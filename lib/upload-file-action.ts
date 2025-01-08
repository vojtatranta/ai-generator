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

  const uploadFolderPath = path.join(
    process.cwd(),
    "public/tmp/ai-generator-uploads",
  );
  const fileExt = path.extname(file.name);
  const nextFileName = `${uuidv4()}${fileExt}`;
  try {
    await fs.mkdir(uploadFolderPath, { recursive: true });
  } catch (error) {
    console.error("upload error, failed to create folder", error);
    return null;
  }

  const arrayBuffer = await file.arrayBuffer();
  const completeFilePath = path.join(uploadFolderPath, nextFileName);
  try {
    await fs.writeFile(completeFilePath, Buffer.from(arrayBuffer));
  } catch (error) {
    console.error("upload error, failed to write file", error);
    return null;
  }
  return completeFilePath;
}
