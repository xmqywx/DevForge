import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { randomBytes } from "crypto";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./public/uploads";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
const MAX_FILES = 5;

export async function handleUpload(formData: FormData): Promise<string[]> {
  const files = formData.getAll("files") as File[];
  if (files.length > MAX_FILES) throw new Error(`Maximum ${MAX_FILES} files allowed`);
  if (!existsSync(UPLOAD_DIR)) await mkdir(UPLOAD_DIR, { recursive: true });

  const urls: string[] = [];
  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) throw new Error(`File type ${file.type} not allowed`);
    if (file.size > MAX_FILE_SIZE) throw new Error(`File ${file.name} exceeds 5MB limit`);
    const ext = file.name.split(".").pop() ?? "png";
    const filename = `${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(join(UPLOAD_DIR, filename), buffer);
    urls.push(`/uploads/${filename}`);
  }
  return urls;
}
