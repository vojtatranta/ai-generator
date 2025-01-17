import { BUCKET_NAME } from "@/constants/data";
import {
  createSupabaseServerClient,
  getMaybeUser,
  FileType,
} from "@/lib/supabase-server";
import { Storage } from "@google-cloud/storage";
import { NextRequest, NextResponse } from "next/server";

async function handleCloudFileStreamResponse(gcpFilePath: string) {
  return new Response(
    new Storage()
      .bucket(BUCKET_NAME)
      .file(gcpFilePath)
      .createReadStream() as unknown as ReadableStream,
    {
      headers: {
        "Content-Type": "audio/mpeg",
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-cache",
      },
    },
  );
}

export async function GET(req: NextRequest) {
  const user = await getMaybeUser();
  if (!user) {
    return new NextResponse("Not authenticated", { status: 400 });
  }

  const searchParams = req.nextUrl.searchParams;
  const commonFileUuid = searchParams.get("commonFileUuid");

  if (!commonFileUuid) {
    return new NextResponse("File ID is required", { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  try {
    const { data: file } = await supabase
      .from("files")
      .select("*")
      .eq("common_file_uuid", commonFileUuid)
      .eq("user_id", user.id)
      .single();

    if (file?.local_file_path) {
      return handleCloudFileStreamResponse(file.local_file_path);
    }

    const { data: chunks } = await supabase
      .from("file_chunks")
      .select("*")
      .eq("common_file_uuid", commonFileUuid)
      .order("order", { ascending: true });

    if (!chunks || chunks.length === 0) {
      return new NextResponse("No audio chunks found", { status: 404 });
    }

    // Create a ReadableStream that will yield audio chunks
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for (const chunk of chunks) {
            // Remove the data URL prefix to get just the base64 data
            const base64Data = chunk.base64.split(",")[1];
            const binaryData = Buffer.from(base64Data, "base64");

            // Add the binary data to the stream
            controller.enqueue(new Uint8Array(binaryData));
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    // Return the stream with appropriate headers
    return new Response(stream, {
      headers: {
        "Content-Type": chunks[0].mime || "audio/mpeg",
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error streaming audio:", error);
    return new NextResponse("Error streaming audio", { status: 500 });
  }
}
