"use server";

import { createClient } from "@/lib/supabase/server";
import type { Note } from "@/lib/supabase";

/**
 * Create a new note in the database
 */
export async function createNote(
  content: string
): Promise<{ success: boolean; note?: Note; error?: string }> {
  try {
    const supabase = await createClient(); // Await the server client
    
    const { data, error } = await supabase
      .from("notes")
      .insert({ content })
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
