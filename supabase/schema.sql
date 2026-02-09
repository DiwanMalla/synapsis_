-- Enable the pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the notes table
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  embedding VECTOR(768) -- nomic-embed-text produces 768 dimensions
);

-- Create an index for faster similarity search (to be used later)
CREATE INDEX IF NOT EXISTS notes_embedding_idx ON notes USING ivfflat (embedding vector_cosine_ops);

-- Row Level Security (RLS) policies - initially allow all for development
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON notes
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function for semantic search using cosine similarity
DROP FUNCTION IF EXISTS match_notes;

CREATE OR REPLACE FUNCTION match_notes(
  query_embedding VECTOR(768),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE(
  id UUID,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  embedding VECTOR(768),
  similarity FLOAT
)
LANGUAGE SQL
STABLE
AS $$
  SELECT
    notes.id::UUID,
    notes.content::TEXT,
    notes.created_at::TIMESTAMP WITH TIME ZONE,
    notes.embedding::VECTOR(768),
    (1 - (notes.embedding <=> query_embedding))::FLOAT AS similarity
  FROM notes
  WHERE 1 - (notes.embedding <=> query_embedding) > match_threshold
  ORDER BY notes.embedding <=> query_embedding
  LIMIT match_count;
$$;
