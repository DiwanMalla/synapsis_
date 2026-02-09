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
    const supabase = await createClient();

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
    const supabase = await createClient();

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
    const { data, error } = await supabase.rpc("match_notes", {
      query_embedding: queryEmbedding,
      match_threshold: 0.5,
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
      match_count: limit + 1,
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
  debug?: string[];
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const debugLog: string[] = [];

    // Get all notes
    const { data: notes, error: notesError } = await supabase
      .from("notes")
      .select("id, content, embedding");

    if (notesError) {
      return { success: false, error: notesError.message };
    }

    if (!notes || notes.length === 0) {
      return { success: true, nodes: [], edges: [] };
    }

    debugLog.push(`Fetched ${notes.length} notes.`);

    // Create nodes
    const nodes = notes.map((note) => ({
      id: note.id,
      content:
        note.content.length > 50
          ? note.content.substring(0, 50) + "..."
          : note.content,
      val: 1,
    }));

    // DEBUG: Calculate ALL similarities to see what's going on
    const edges: { source: string; target: string; value: number }[] = [];

    // STRATEGY: "K-Nearest Neighbors" (KNN)
    // For every node, find its top 2 closest friends, regardless of threshold.
    // This guarantees connections.

    // Pre-parse all embeddings
    const parsedNotes = notes
      .map((note) => ({
        ...note,
        parsedEmbedding: parseEmbedding(note.embedding),
      }))
      .filter((note) => note.parsedEmbedding !== null);

    debugLog.push(`Found ${parsedNotes.length} notes with valid embeddings.`);

    for (let i = 0; i < parsedNotes.length; i++) {
      const noteA = parsedNotes[i];

      const potentialMatches: {
        target: string;
        value: number;
        content: string;
      }[] = [];

      for (let j = 0; j < parsedNotes.length; j++) {
        if (i === j) continue; // Don't connect to self
        const noteB = parsedNotes[j];

        const sim = cosineSimilarity(
          noteA.parsedEmbedding,
          noteB.parsedEmbedding,
        );
        potentialMatches.push({
          target: noteB.id,
          value: sim,
          content: noteB.content.substring(0, 20),
        });
      }

      // Sort by similarity (Highest first)
      potentialMatches.sort((a, b) => b.value - a.value);

      // Take Top 2
      const topMatches = potentialMatches.slice(0, 2);

      // Add to edges
      topMatches.forEach((match) => {
        edges.push({
          source: noteA.id,
          target: match.target,
          value: match.value,
        });
        debugLog.push(
          `Node "${noteA.content.substring(0, 15)}" -> "${match.content}" (${match.value.toFixed(3)})`,
        );
      });
    }

    // Deduplicate edges (A->B is same as B->A)
    const uniqueEdges: { source: string; target: string; value: number }[] = [];
    const pairSet = new Set<string>();

    edges.forEach((edge) => {
      const key = [edge.source, edge.target].sort().join("-");
      if (!pairSet.has(key)) {
        pairSet.add(key);
        uniqueEdges.push(edge);
      }
    });

    console.log("Graph Debug:", debugLog); // Will print in server terminal

    return { success: true, nodes, edges: uniqueEdges, debug: debugLog };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { success: false, error: "Failed to get graph data" };
  }
}

/**
 * Parse embedding from various formats (string, array, etc.)
 */
function parseEmbedding(embedding: unknown): number[] | null {
  if (!embedding) return null;

  // If it's already an array, return it
  if (Array.isArray(embedding)) {
    return embedding.map(Number);
  }

  // If it's a string (PostgreSQL vector format), parse it
  if (typeof embedding === "string") {
    // Remove brackets and split by comma
    const cleaned = embedding.replace(/[\[\]{}]/g, "");
    return cleaned
      .split(",")
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n));
  }

  // If it's an object with array-like properties
  if (typeof embedding === "object") {
    const values = Object.values(embedding as Record<string, unknown>);
    if (values.length > 0) {
      return values.map(Number).filter((n) => !isNaN(n));
    }
  }

  return null;
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: unknown, b: unknown): number {
  const vecA = parseEmbedding(a);
  const vecB = parseEmbedding(b);

  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) {
    console.log("Invalid vectors:", {
      a: typeof a,
      b: typeof b,
      vecALen: vecA?.length,
      vecBLen: vecB?.length,
    });
    return 0;
  }

  if (vecA.length !== vecB.length) {
    console.log("Vector length mismatch:", vecA.length, "vs", vecB.length);
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 0;

  return dotProduct / denom;
}
