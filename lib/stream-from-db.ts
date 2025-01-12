import { Database } from "@/database.types";
import { SupabaseClient } from "@supabase/supabase-js";
import { FileLike } from "openai/uploads.mjs";

export const blobToFileLike = (
  blob: Blob,
  filename: string,
  createdAt: string,
): FileLike => {
  // @ts-expect-error: overriding it for opean upload
  blob.lastModified = Number(new Date(createdAt ?? new Date()).getTime());
  // @ts-expect-error: overriding it for opean upload
  blob.name = filename;

  return blob as unknown as FileLike;
};

export const getBlobFromDBChunk = async (
  chunkId: number,
  userId: string,
  context: { supabaseClient: SupabaseClient<Database>; expectedMime?: string },
): Promise<FileLike> => {
  const { data: chunk } = await context.supabaseClient
    .from("file_chunks")
    .select("*")
    .eq("id", chunkId)
    .eq("user_id", userId)
    .single();

  if (!chunk) {
    return blobToFileLike(
      new Blob([], { type: context.expectedMime ?? "audio/mpeg" }),
      String(chunkId),
      new Date().toISOString(),
    );
  }
  const base64String = chunk?.base64.split(",")[1] ?? "";
  const blob = new Blob([Buffer.from(base64String, "base64")], {
    type: chunk?.mime ?? context.expectedMime ?? "audio/mpeg",
  });

  console.log("blob size", blob.size);

  return blobToFileLike(
    blob,
    String(chunk.id),
    chunk?.created_at ?? new Date().toISOString(),
  );
};

export const concatenateAudioChunksToBlob = async (
  commonFileUuid: string,
  userId: string,
  context: { supabaseClient: SupabaseClient<Database> },
): Promise<FileLike> => {
  const { data: chunks } = await context.supabaseClient
    .from("file_chunks")
    .select("*")
    .eq("common_file_uuid", commonFileUuid)
    .eq("user_id", userId)
    .order("id", { ascending: true });
  const type = chunks?.[0]?.mime ?? "audio/mpeg";

  const blob = new Blob(
    chunks?.map((chunk) => {
      const base64String = chunk.base64.split(",")[1];
      return Buffer.from(base64String, "base64");
    }) ?? [],
    { type },
  );

  // @ts-expect-error: overriding it for opean upload
  blob.lastModified = Number(
    (chunks ?? []).at(-1)?.created_at ?? new Date().getTime(),
  );
  // @ts-expect-error: overriding it for opean upload
  blob.name = commonFileUuid;

  return blob as unknown as FileLike;
};

export const createAudioStreamFromDBChunks = async (
  commonFileUuid: string,
  userId: string,
  context: {
    supabaseClient: SupabaseClient<Database>;
  },
) => {
  const { data: chunks } = await context.supabaseClient
    .from("file_chunks")
    .select("*")
    .eq("common_file_uuid", commonFileUuid)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (!chunks) {
    return new ReadableStream({
      async start(controller) {
        controller.close();
      },
    });
  }

  return new ReadableStream({
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
};
