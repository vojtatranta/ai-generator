import { Pinecone } from "@pinecone-database/pinecone";

export const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

export const PINECODE_EMBEDDINGS_MODEL = "multilingual-e5-large";

export const textChunker = (text: string, chunkSize: number = 400) => {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
};
