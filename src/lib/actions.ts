"use server";

import { createClient } from "@/lib/supabase/server";
import { generateEmbedding } from "./embedding";
import type { Note } from "@/lib/supabase";

/**
 * Create a new note in the database with AI embeddings
 */
export async function createNote(
  content: string,
): Promise<{ success: boolean; note?: Note; error?: string }> {
  try {
    const supabase = await createClient(); // Await the server client

    // Generate embedding using Ollama (local, free)
    console.log("Generating embedding for note...");
    const embedding = await generateEmbedding(content);
    console.log("Embedding generated:", embedding.length, "dimensions");

    // Save note with embedding to database
    const { data, error } = await supabase
      .from("notes")
      .insert({ content, embedding })
      .select()
      .single();

    if (error) {
      console.error("Error creating note:", error);
      return { success: false, error: error.message };
    }

    return { success: true, note: data };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { success: false, error: "Failed to create note" };
  }
}

/**
 * Fetch all notes from the database, ordered by newest first
 */
export async function getNotes(): Promise<{
  success: boolean;
  notes?: Note[];
  error?: string;
}> {
  try {
    const supabase = await createClient(); // Await the server client

    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching notes:", error);
      return { success: false, error: error.message };
    }

    return { success: true, notes: data || [] };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { success: false, error: "Failed to fetch notes" };
  }
}

/**
 * Search notes using semantic similarity (vector search)
 * Finds notes related to the query even if keywords don't match
 */
export async function searchNotes(
  query: string,
  limit: number = 5,
): Promise<{ success: boolean; notes?: Note[]; error?: string }> {
  try {
    const supabase = await createClient();

    // Generate embedding for the search query
    console.log("Generating embedding for search query...");
    const queryEmbedding = await generateEmbedding(query);

    // Perform cosine similarity search using pgvector
    // The <=> operator calculates cosine distance (lower = more similar)
    const { data, error } = await supabase.rpc("match_notes", {
      query_embedding: queryEmbedding,
      match_threshold: 0.5, // Minimum similarity score
      match_count: limit,
    });

    if (error) {
      console.error("Error searching notes:", error);
      return { success: false, error: error.message };
    }

    return { success: true, notes: data || [] };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { success: false, error: "Failed to search notes" };
  }
}

/**
 * Update an existing note
 */
export async function updateNote(
  id: string,
  content: string,
): Promise<{ success: boolean; note?: Note; error?: string }> {
  try {
    const supabase = await createClient();

    // Generate new embedding for updated content
    console.log("Generating new embedding for updated note...");
    const embedding = await generateEmbedding(content);

    const { data, error } = await supabase
      .from("notes")
      .update({ content, embedding })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating note:", error);
      return { success: false, error: error.message };
    }

    return { success: true, note: data };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { success: false, error: "Failed to update note" };
  }
}

/**
 * Delete a note
 */
export async function deleteNote(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from("notes").delete().eq("id", id);

    if (error) {
      console.error("Error deleting note:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { success: false, error: "Failed to delete note" };
  }
}

/**
 * Get related notes for a specific note (for graph edges)
 * Finds the top N most similar notes using vector similarity
 */
export async function getRelatedNotes(
  noteId: string,
  limit: number = 3,
): Promise<{
  success: boolean;
  related?: { id: string; content: string; similarity: number }[];
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // First, get the embedding of the source note
    const { data: noteData, error: noteError } = await supabase
      .from("notes")
      .select("embedding")
      .eq("id", noteId)
      .single();

    if (noteError || !noteData?.embedding) {
      return { success: false, error: "Note not found or has no embedding" };
    }

    // Find similar notes excluding the source note
    const { data, error } = await supabase.rpc("match_notes", {
      query_embedding: noteData.embedding,
      match_threshold: 0.3,
      match_count: limit + 1, // Get one extra in case the source note is returned
    });

    if (error) {
      console.error("Error finding related notes:", error);
      return { success: false, error: error.message };
    }

    // Filter out the source note and map to simplified format
    const related = (data || [])
      .filter((n: Note) => n.id !== noteId)
      .slice(0, limit)
      .map((n: Note) => ({
        id: n.id,
        content: n.content,
        similarity: n.similarity || 0,
      }));

    return { success: true, related };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { success: false, error: "Failed to get related notes" };
  }
}

/**
 * Get all notes with their relationships (for graph visualization)
 * Returns nodes and edges for the entire knowledge graph
 */
export async function getGraphData(): Promise<{
  success: boolean;
  nodes?: { id: string; content: string; val: number }[];
  edges?: { source: string; target: string; value: number }[];
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get all notes
    const { data: notes, error: notesError } = await supabase
      .from("notes")
      .select("id, content, embedding");

    if (notesError) {
      console.error("Error fetching notes for graph:", notesError);
      return { success: false, error: notesError.message };
    }

    if (!notes || notes.length === 0) {
      return { success: true, nodes: [], edges: [] };
    }

    // Create nodes
    const nodes = notes.map((note) => ({
      id: note.id,
      content:
        note.content.length > 50
          ? note.content.substring(0, 50) + "..."
          : note.content,
      val: 1, // Node size
    }));

    // Find edges by calculating similarity between all note pairs
    const edges: { source: string; target: string; value: number }[] = [];
    const threshold = 0.15; // Lower threshold for short/food notes

    for (let i = 0; i < notes.length; i++) {
      for (let j = i + 1; j < notes.length; j++) {
        const noteA = notes[i];
        const noteB = notes[j];

        if (!noteA.embedding || !noteB.embedding) continue;

        // Calculate cosine similarity
        const similarity = cosineSimilarity(noteA.embedding, noteB.embedding);

        if (similarity > threshold) {
          edges.push({
            source: noteA.id,
            target: noteB.id,
            value: similarity,
          });
        }
      }
    }

    // Always connect each node to its top 2 most similar nodes
    // Group edges by source
    const edgesBySource: Record<string, { target: string; value: number }[]> = {};
    edges.forEach(edge => {
      if (!edgesBySource[edge.source]) edgesBySource[edge.source] = [];
      if (!edgesBySource[edge.target]) edgesBySource[edge.target] = [];
      edgesBySource[edge.source].push({ target: edge.target, value: edge.value });
      edgesBySource[edge.target].push({ target: edge.source, value: edge.value });
    });

    // Build final edges - take top 3 connections per node
    const finalEdges: { source: string; target: string; value: number }[] = [];
    const addedPairs = new Set<string>();

    Object.entries(edgesBySource).forEach(([sourceId, connections]) => {
      connections
        .sort((a, b) => b.value - a.value)
        .slice(0, 3)
        .forEach(conn => {
          const pairKey = [sourceId, conn.target].sort().join('-');
          if (!addedPairs.has(pairKey)) {
            addedPairs.add(pairKey);
            finalEdges.push({
              source: sourceId,
              target: conn.target,
              value: conn.value,
            });
          }
        });
    });

    const limitedEdges = finalEdges;

    return { success: true, nodes, edges: limitedEdges };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { success: false, error: "Failed to get graph data" };
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
