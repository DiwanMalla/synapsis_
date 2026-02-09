-- Enable the pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the notes table
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  embedding VECTOR(1536) -- OpenAI text-embedding-3-small produces 1536 dimensions
);

-- Create an index for faster similarity search (to be used later)
CREATE INDEX IF NOT EXISTS notes_embedding_idx ON notes USING ivfflat (embedding vector_cosine_ops);

-- Row Level Security (RLS) policies - initially allow all for development
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON notes
  FOR ALL
  USING (true)
  WITH CHECK (true);
