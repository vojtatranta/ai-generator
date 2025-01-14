import { NextRequest } from "next/server";

export const config = {
  api: {
    bodyParser: false, // Disable built-in bodyParser to handle stream manually
  },
};

export default async function handler(req: NextRequest) {
  if (req.method === "POST") {
    console.log("Receiving audio stream...");

    let chunkIndex = 0;

    req.on("data", (chunk) => {
      console.log(`Received chunk ${chunkIndex}: ${chunk.length} bytes`);

      // Convert chunk to Base64
      const base64Chunk = chunk.toString("base64");

      // Save to database or handle it as needed
      saveChunkToDatabase(base64Chunk, chunkIndex);

      chunkIndex++;
    });

    req.on("end", () => {
      console.log("All chunks received");
      markFileForTranscription(); // Mark transcription after receiving all chunks
      res
        .status(200)
        .json({ message: "Audio uploaded and processed successfully!" });
    });

    req.on("error", (err) => {
      console.error("Stream error:", err);
      res.status(500).json({ error: "Error receiving audio stream" });
    });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

function saveChunkToDatabase(base64Chunk, chunkIndex) {
  console.log(`Saving chunk ${chunkIndex}: ${base64Chunk.substring(0, 50)}...`);
  // Pseudo-database save; replace with actual database storage logic
}

function markFileForTranscription() {
  console.log("File marked for transcription.");
}
