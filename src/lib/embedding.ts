import ollama from "ollama";

const EMBEDDING_MODEL = "nomic-embed-text";
const EMBEDDING_DIMENSIONS = 768; // nomic-embed-text produces 768 dimensions

/**
 * Generate embeddings for text using Ollama (local, free)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await ollama.embed({
      model: EMBEDDING_MODEL,
      input: text,
    });

    // The response.embeddings is an array of arrays (one per input)
    // Since we only pass one input, we take the first one
    return response.embeddings[0];
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw new Error("Failed to generate embedding");
  }
}

/**
 * Generate embeddings for multiple texts at once (batch processing)
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    const response = await ollama.embed({
      model: EMBEDDING_MODEL,
      input: texts,
    });

    return response.embeddings;
  } catch (error) {
    console.error("Error generating embeddings:", error);
    throw new Error("Failed to generate embeddings");
  }
}

export { EMBEDDING_DIMENSIONS };
