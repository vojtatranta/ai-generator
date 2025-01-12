import {
  createSupabaseServerClient,
  getMaybeUser,
} from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

function blobToStream(blob: Blob): ReadableStream {
  const reader = blob.stream().getReader(); // Create a stream reader from the blob's stream

  return new ReadableStream({
    async start(controller) {
      while (true) {
        const { done, value } = await reader.read(); // Read chunks of the blob
        if (done) {
          controller.close(); // Close the stream when done
          break;
        }
        controller.enqueue(value); // Push chunk to the stream
      }
    },
    cancel() {
      console.log("Stream canceled");
    },
  });
}

function reconstructAudioBlob(base64Chunks: string[], mimeType: string): Blob {
  const byteArrays: Uint8Array[] = [];

  // Decode each base64 chunk to Uint8Array
  base64Chunks.forEach((base64, index) => {
    const binaryString = atob(base64.split(",")[1] ?? ""); // Decode base64 to binary string
    const byteArray = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
      byteArray[i] = binaryString.charCodeAt(i);
    }

    console.log(`Chunk ${index + 1}: ${byteArray.length} bytes`);
    byteArrays.push(byteArray); // Add to the array
  });

  // Concatenate all Uint8Arrays into a single Blob
  const audioBlob = new Blob(byteArrays, { type: mimeType });
  console.log(`Reconstructed audio blob size: ${audioBlob.size} bytes`);

  return audioBlob;
}

export async function GET(req: NextRequest) {
  const user = await getMaybeUser();
  if (!user) {
    return new NextResponse("Not authenticated", { status: 400 });
  }

  const searchParams = req.nextUrl.searchParams;
  const chunkId = searchParams.get("chunkId");

  if (!chunkId) {
    return new NextResponse("File ID is required", { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  try {
    const { data: chunk } = await supabase
      .from("file_chunks")
      .select("*")
      .eq("id", chunkId)
      .single();

    if (!chunk) {
      return new NextResponse("No audio chunks found", { status: 404 });
    }

    // Create a ReadableStream that will yield audio chunks

    const blob = reconstructAudioBlob(
      [chunk.base64],
      chunk.mime || "audio/mpeg",
    );
    const stream = blobToStream(blob);

    // Return the stream with appropriate headers
    return new Response(stream, {
      headers: {
        "Content-Type": chunk.mime || "audio/mpeg",
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error streaming audio:", error);
    return new NextResponse(`Error streaming audio ${error}`, { status: 500 });
  }
}
