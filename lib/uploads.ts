import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { put, del } from "@vercel/blob";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function usingBlobStorage(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/**
 * Saves an uploaded image and returns the URL to store on the record.
 *
 * In production (on Vercel, with a Blob store connected) this uploads to
 * Vercel Blob, since the app's filesystem is read-only/ephemeral there.
 * Locally, without a BLOB_READ_WRITE_TOKEN configured, it falls back to
 * writing into public/uploads so `npm run dev` works without needing a
 * Blob store set up.
 */
export async function saveUploadedImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image uploads are allowed");
  }
  const ext = EXT_BY_MIME[file.type] ?? "jpg";
  const filename = `${randomUUID()}.${ext}`;

  if (usingBlobStorage()) {
    const blob = await put(`uploads/${filename}`, file, {
      access: "public",
      contentType: file.type,
    });
    return blob.url;
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return `/uploads/${filename}`;
}

/** Best-effort cleanup when a product image row is deleted. */
export async function deleteUploadedImage(url: string): Promise<void> {
  try {
    if (usingBlobStorage() && url.startsWith("http")) {
      await del(url);
      return;
    }
    if (url.startsWith("/uploads/")) {
      await unlink(path.join(process.cwd(), "public", url));
    }
  } catch {
    // Non-fatal: the DB row is the source of truth for what's shown.
  }
}
