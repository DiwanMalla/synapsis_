// This file is now just for shared types
// The client initialization has moved to:
// - src/lib/supabase/client.ts (Browser)
// - src/lib/supabase/server.ts (Server/Actions)

export interface Note {
  id: string; // UUID from Supabase
  content: string;
  created_at?: string; // Made optional to handle partial returns from RPC
  embedding: number[] | null;
  similarity?: number; // Added for search results
}

export interface NoteInsert {
  content: string;
  embedding?: number[];
}
