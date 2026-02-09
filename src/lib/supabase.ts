// This file is now just for shared types
// The client initialization has moved to:
// - src/lib/supabase/client.ts (Browser)
// - src/lib/supabase/server.ts (Server/Actions)

export interface Note {
  id: number; // Changed to number to match BigInt in Postgres
  content: string;
  created_at: string;
  embedding: number[] | null;
}

export interface NoteInsert {
  content: string;
  embedding?: number[];
}
