-- Drop the old function first to avoid conflicts
drop function if exists match_notes;

-- Re-create the function with the correct return types
create or replace function match_notes (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,       -- Matches the table's 'id' column type
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    notes.id,
    notes.content,
    1 - (notes.embedding <=> query_embedding) as similarity
  from notes
  where 1 - (notes.embedding <=> query_embedding) > match_threshold
  order by notes.embedding <=> query_embedding
  limit match_count;
end;
$$;
