import path from "path";
import fs from "fs/promises";
import { getMaybeUser } from "./supabase-server";
import { v4 as uuidv4 } from "uuid";

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

  const uploadFolderPath = path.join("/tmp/ai-generator-uploads");
  const fileExt = path.extname(file.name);
  const nextFileName = `${uuidv4()}${fileExt}`;
  await fs.mkdir(uploadFolderPath, { recursive: true });

  const arrayBuffer = await file.arrayBuffer();
  const completeFilePath = path.join(uploadFolderPath, nextFileName);
  await fs.writeFile(completeFilePath, Buffer.from(arrayBuffer));
  return completeFilePath;
}
