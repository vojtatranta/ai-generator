import path from "path";
import fs from "fs/promises";
import { createSupabaseServerClient, getMaybeUser } from "./supabase-server";
import { v4 as uuidv4 } from "uuid";
import {
  handleCompleteAudio,
  handleUploadedFile,
  transcribeAudio,
} from "@/components/api/trpc-router";
import { waitUntil } from "@vercel/functions";
import { Readable } from "stream";
import { DownloadResponse } from "@google-cloud/storage";
import { getLocale } from "next-intl/server";

// export async function chunkBlob(
//     blob: Blob,
//     header:
//   ): Promise<Blob[]> {
//     const minChunkSizeBytes = 1200 * 1024; // Minimum chunk size of 100kB
//     const maxChunkSizeBytes = chunkSizeMB * 1024 * 1024; // Convert MB to bytes
//     const chunkSizeBytes =
//       blob.size > maxChunkSizeBytes
//         ? maxChunkSizeBytes
//         : Math.max(
//             minChunkSizeBytes,
//             Math.floor(blob.size / Math.ceil(blob.size / maxChunkSizeBytes))
//           ); // Calculate the chunk size sensibly so that you are as close to max chunkSize as to minimum
//     const headerBlob = await getFirstBlobHeader(blob); // Extract the header (first bytes)
//     const chunks: Blob[] = [];

//     let offset = headerBlob.size; // Start after the header
//     while (offset < blob.size) {
//       const end =
//         offset + chunkSizeBytes > blob.size
//           ? blob.size
//           : offset + Math.max(minChunkSizeBytes, chunkSizeBytes);
//       const chunkData = blob.slice(offset, end); // Slice the audio data

//       // If the last chunk is too small, add empty data to it to fill up the minimum
//       if (chunkData.size < minChunkSizeBytes) {
//         const emptyData = new Uint8Array(minChunkSizeBytes - chunkData.size);
//         const chunkWithHeader = new Blob([headerBlob, chunkData, emptyData], {
//           type: blob.type,
//         });
//         chunks.push(chunkWithHeader);
//       } else {
//         // Create a new blob with the header + actual audio data
//         const chunkWithHeader = new Blob([headerBlob, chunkData], {
//           type: blob.type,
//         });
//         chunks.push(chunkWithHeader);
//       }

//       offset = end; // Move to the next offset
//     }

//     return chunks;
//   }

function getMP3Header(data: Uint8Array): Uint8Array {
  if (String.fromCharCode(...Array.from(data).slice(0, 3)) === "ID3") {
    const headerSize =
      (data[6] << 21) | (data[7] << 14) | (data[8] << 7) | data[9];
    return data.slice(0, 10 + headerSize); // 10-byte base header + size of extended header
  } else {
    // No ID3 header, return default 192 bytes
    return data.slice(0, 192);
  }
}

/**
 * Chunk an MP3 Uint8Array into multiple parts
 * @param {Uint8Array} mp3Array - Complete MP3 file as Uint8Array
 * @param {number} bitrate - Bitrate in kbps (e.g., 128 for 128 kbps)
 * @returns {Uint8Array[]} - Array of Uint8Array chunks
 */
function chunkMP3(mp3Array: Uint8Array, bitrate: number = 128): Uint8Array[] {
  const headerSize = 192; // Estimate for MP3 header size (in bytes)
  const maxChunkSize = 1.5 * 1024 * 1024; // 5 MB in bytes
  const bytesPerSecond = (bitrate * 1000) / 8; // Convert bitrate to bytes per second
  const minChunkBytes = Math.floor(5 * bytesPerSecond); // 5 seconds worth of audio in bytes

  const chunks: Uint8Array[] = [];
  let offset = 0;

  while (offset < mp3Array.length) {
    const remainingBytes = mp3Array.length - offset;

    // Calculate chunk size (ensure it's between 5 seconds and 5 MB)
    const chunkSize = Math.min(
      maxChunkSize,
      Math.max(minChunkBytes + headerSize, remainingBytes),
    );

    const end = Math.min(offset + chunkSize, mp3Array.length);

    // Extract header + chunk data
    const chunk = mp3Array.slice(offset, end);
    const chunkWithHeader =
      offset === 0 ? chunk : prependHeader(chunk, mp3Array);

    chunks.push(chunkWithHeader);
    offset = end;
  }

  return chunks;
}

/**
 * Prepend the MP3 header to the chunk
 * @param {Uint8Array} chunk - Audio data chunk
 * @param {Uint8Array} originalArray - The full MP3 file for header extraction
 * @returns {Uint8Array} - Chunk with header prepended
 */
function prependHeader(
  chunk: Uint8Array,
  originalArray: Uint8Array,
): Uint8Array {
  // Assume the header is in the first 192 bytes of the original MP3
  const header = originalArray.slice(0, 192);
  const chunkWithHeader = new Uint8Array(header.length + chunk.length);
  chunkWithHeader.set(header, 0); // Copy header
  chunkWithHeader.set(chunk, header.length); // Copy chunk
  return chunkWithHeader;
}

function handleFileArrayBuffer(
  fileBuffer: Uint8Array,
  dataInfo: {
    commonFileUuid: string;
    mime: string;
    locale: string;
    transcribe: boolean;
    filePath: string;
  },
  context: {
    supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
    userId: string;
    locale: string;
  },
): {
  firstChunkPromise: Promise<void>;
  completePromise: Promise<{
    commonFileUuid: string;
    locale: string;
    lastChunkIndex: number;
  }>;
} {
  const fullFile = new Uint8Array(fileBuffer);
  const { supabase, userId } = context;
  let chunkIndex = 0;

  const chunks = chunkMP3(fullFile);
  let lastData = null;

  let firstChunkPromiseResolve: (() => void) | null = null;
  let firstChunkDone = false;
  const firstChunkPromise = new Promise<void>((resolve) => {
    firstChunkPromiseResolve = resolve;
  });

  console.log("processing file", dataInfo);
  const completePromise = chunks.reduce<Promise<void>>(
    (promise, chunk) =>
      promise.then(async () => {
        const base64Chunk = `data:audio/mpeg;base64,${Buffer.from(chunk).toString("base64")}`;
        console.log("saving chunk", chunkIndex);
        const { data, error } = await supabase
          .from("file_chunks")
          .insert({
            user_id: userId,
            base64: base64Chunk,
            common_file_uuid: dataInfo.commonFileUuid,
            mime: dataInfo.mime,
            order: chunkIndex,
            cloud_path: dataInfo.filePath,
          })
          .select("id, common_file_uuid, mime, order")
          .single();

        if (!firstChunkDone) {
          firstChunkDone = true;
          firstChunkPromiseResolve?.();
        }

        if (!data || error) {
          console.error("save file error", error);
          throw new Error(
            `Audio upload error: ${error?.message || "Error saving chunk"}`,
          );
        }

        lastData = data;

        if (dataInfo.transcribe) {
          console.log("transcribing chunk", data.id);
          console.log("transcribing chunk index", chunkIndex);
          waitUntil(
            transcribeAudio(data.id, userId, {
              supabase,
              locale: dataInfo.locale,
              createFileOnEnd: false,
              commonFileUuid: dataInfo.commonFileUuid,
            }),
          );
        }

        chunkIndex++;
      }),
    Promise.resolve(),
  );

  if (lastData) {
    console.log("creating file on transcription end", lastData);
    waitUntil(
      handleCompleteAudio(dataInfo.commonFileUuid, {
        supabase: supabase,
        userId: userId,
        locale: context.locale,
      }),
    );
  }
  console.log("Upload complete. Chunks received:", chunkIndex);

  return {
    firstChunkPromise,
    completePromise: completePromise.then(() => ({
      commonFileUuid: dataInfo.commonFileUuid,
      locale: dataInfo.locale,
      lastChunkIndex: chunkIndex,
    })),
  };
}

export function handleGCPDownloadedFile(
  downloadResponse: DownloadResponse,
  context: {
    supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
    userId: string;
    commonFileUuid: string;
    locale: string;
    mime: string;
    transcribe: boolean;
    filePath: string;
  },
) {
  const buffer = downloadResponse[0];
  const arrayBuffer = new Uint8Array(buffer);

  return handleFileArrayBuffer(
    arrayBuffer,
    {
      commonFileUuid: context.commonFileUuid,
      mime: context.mime,
      locale: context.locale,
      transcribe: context.transcribe,
      filePath: context.filePath,
    },
    context,
  );
}

async function uploadAudioAction(formData: FormData) {
  "use server";
  const file = formData.get("file") as File;
  if (!file) throw new Error("No file uploaded");

  const transcribe = Boolean(Number(formData.get("transcribe")));

  const dataInfo = {
    mime: formData.get("mime") as string,
    commonFileUuid: formData.get("commonFileUuid") as string,
    locale: String(formData.get("locale") ?? "cs"),
  };

  const user = await getMaybeUser();
  if (!user) return null;

  const locale = await getLocale();

  const supabase = await createSupabaseServerClient();
  const fullFile = new Uint8Array(await file.arrayBuffer());

  let chunkIndex = 0;

  const chunks = chunkMP3(fullFile);

  let lastData = null;

  await chunks.reduce<Promise<void | void[]>>(
    (promise, chunk) =>
      promise.then(async () => {
        const base64Chunk = `data:audio/mpeg;base64,${Buffer.from(chunk).toString("base64")}`;
        console.log("saving chunk", chunkIndex);
        const { data, error } = await supabase
          .from("file_chunks")
          .insert({
            user_id: user.id,
            base64: base64Chunk,
            common_file_uuid: dataInfo.commonFileUuid,
            mime: dataInfo.mime,
            order: chunkIndex,
          })
          .select("id, common_file_uuid, mime, order")
          .single();

        if (!data || error) {
          console.error("save file error", error);
          throw new Error(
            `Audio upload error: ${error?.message || "Error saving chunk"}`,
          );
        }

        lastData = data;

        if (transcribe) {
          console.log("transcribing chunk", data.id);
          console.log("transcribing chunk index", chunkIndex);
          waitUntil(
            transcribeAudio(data.id, user.id, {
              supabase,
              locale: dataInfo.locale,
              createFileOnEnd: false,
              commonFileUuid: dataInfo.commonFileUuid,
            }),
          );
        }

        chunkIndex++;
      }),
    Promise.resolve(),
  );

  if (lastData) {
    console.log("creating file on transcription end", lastData);
    waitUntil(
      handleCompleteAudio(dataInfo.commonFileUuid, {
        supabase: supabase,
        userId: user.id,
        locale,
      }),
    );
  }
  console.log("Upload complete. Chunks received:", chunkIndex);

  return {
    commonFileUuid: dataInfo.commonFileUuid,
    locale: dataInfo.locale,
    lastChunkIndex: chunkIndex,
  };
}
export default uploadAudioAction;
