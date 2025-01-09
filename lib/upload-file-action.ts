import path from "path";
import fs from "fs/promises";
import { createSupabaseServerClient, getMaybeUser } from "./supabase-server";
import { v4 as uuidv4 } from "uuid";
import { handleUploadedFile } from "@/components/api/trpc-router";

export async function uploadFileAction(formData: FormData) {
  "use server";
  const file = formData.get("file") as File;

  if (!file) {
    return null;
  }

  const user = await getMaybeUser();

  if (!user) {
    return null;
  }

  const supabase = await createSupabaseServerClient();

  const uploadFolderPath = path.join(
    process.cwd(),
    "public/tmp/ai-generator-uploads",
  );
  const fileExt = path.extname(file.name);
  const nextFileName = `${uuidv4()}${fileExt}`;

  const arrayBuffer = Buffer.from(await file.arrayBuffer());
  const completeFilePath = path.join(uploadFolderPath, nextFileName);

  return handleUploadedFile(arrayBuffer, completeFilePath, file.name, supabase);
}
