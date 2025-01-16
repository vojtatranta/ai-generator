import { Pinecone } from "@pinecone-database/pinecone";

export const getPC = () =>
  new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
  });

export const PINECODE_EMBEDDINGS_MODEL = "multilingual-e5-large";

export const textChunker = (
  text: string,
  chunkSize: number = 400,
  overlap: number = 100
): string[] => {
  const chunks: string[] = [];

  // Split text into blocks (paragraphs, code blocks)
  const blocks = text.split(/(\n\n+)/);

  let currentChunk = "";
  let lastChunkEnd = ""; // Store the end of the last chunk for overlap

  for (let block of blocks) {
    // If adding this block would exceed chunk size
    if (currentChunk.length + block.length > chunkSize) {
      if (currentChunk.length > 0) {
        // If we have content in current chunk, save it
        chunks.push(currentChunk.trim());
        // Store the end of this chunk for overlap
        lastChunkEnd = currentChunk.slice(-overlap);
        // Start new chunk with overlap from previous chunk
        currentChunk = lastChunkEnd;
      }

      // If the block itself is larger than chunk size, split it by sentences
      if (block.length > chunkSize) {
        // Split into sentences, respecting common sentence endings and code blocks
        const sentences = block.match(
          /[^.!?`]+[.!?`]+|\s+(?=```[\s\S]*?```)/g
        ) || [block];

        for (let sentence of sentences) {
          if (sentence.length > chunkSize) {
            // If a sentence is still too long, split it by words
            const words = sentence.split(/\s+/);
            let tempChunk = currentChunk; // Start with overlap

            for (let word of words) {
              if (tempChunk.length + word.length + 1 > chunkSize) {
                chunks.push(tempChunk.trim());
                lastChunkEnd = tempChunk.slice(-overlap);
                tempChunk = lastChunkEnd + word;
              } else {
                tempChunk += (tempChunk ? " " : "") + word;
              }
            }

            if (tempChunk.length > 0) {
              currentChunk = tempChunk;
            }
          } else if (currentChunk.length + sentence.length > chunkSize) {
            chunks.push(currentChunk.trim());
            lastChunkEnd = currentChunk.slice(-overlap);
            currentChunk = lastChunkEnd + sentence;
          } else {
            currentChunk += sentence;
          }
        }
      } else {
        currentChunk = lastChunkEnd + block;
      }
    } else {
      currentChunk += block;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter((chunk) => chunk.length > 0);
};
