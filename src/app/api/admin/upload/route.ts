import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { requireAdmin } from "@/lib/session";
import { isCloudinaryEnabled, uploadImageToCloudinary } from "@/lib/cloudinary";

// Admin image uploads. Routing rule:
//  1. If Cloudinary is configured (recommended for production on Vercel, since
//     Vercel's filesystem is ephemeral) — push the file to Cloudinary and store
//     its CDN URL on the product.
//  2. Otherwise fall back to writing to ./public/uploads so local dev still works
//     without any external account.
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export const runtime = "nodejs";

export async function POST(req: Request) {
  await requireAdmin();
  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const baseName = file.name.replace(/\.[^.]+$/, "").replace(/[^a-z0-9-_]/gi, "-") || "image";
  const filename = `${Date.now()}-${randomBytes(4).toString("hex")}-${baseName}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  if (isCloudinaryEnabled()) {
    try {
      const url = await uploadImageToCloudinary(buffer, filename);
      return NextResponse.json({ url, provider: "cloudinary" });
    } catch (err) {
      console.error("[upload] Cloudinary upload failed", err);
      return NextResponse.json(
        { error: "Image upload failed. Please try again." },
        { status: 502 },
      );
    }
  }

  // Dev fallback — local disk. Will NOT persist on Vercel; that's by design
  // (forces the admin to configure Cloudinary before going live).
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return NextResponse.json({ url: `/uploads/${filename}`, provider: "local" });
}
