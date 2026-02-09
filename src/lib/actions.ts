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
