import { v2 as cloudinary } from "cloudinary";

// Cloudinary reads configuration from the CLOUDINARY_URL env var of the form:
//   cloudinary://<api_key>:<api_secret>@<cloud_name>
// We also accept the three explicit vars for admins who prefer them.
let configured = false;

function ensureConfigured(): boolean {
  if (configured) return true;
  const hasUrl = !!process.env.CLOUDINARY_URL;
  const hasTriple =
    !!process.env.CLOUDINARY_CLOUD_NAME &&
    !!process.env.CLOUDINARY_API_KEY &&
    !!process.env.CLOUDINARY_API_SECRET;
  if (!hasUrl && !hasTriple) return false;
  if (!hasUrl) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
      api_key: process.env.CLOUDINARY_API_KEY!,
      api_secret: process.env.CLOUDINARY_API_SECRET!,
      secure: true,
    });
  }
  // When CLOUDINARY_URL is set the SDK picks it up automatically.
  configured = true;
  return true;
}

export function isCloudinaryEnabled(): boolean {
  return ensureConfigured();
}

// Uploads a file (as a Buffer) to Cloudinary and returns the secure HTTPS URL.
export async function uploadImageToCloudinary(
  buffer: Buffer,
  filename: string,
): Promise<string> {
  if (!ensureConfigured()) {
    throw new Error("Cloudinary is not configured");
  }

  const folder = process.env.CLOUDINARY_FOLDER || "aurelia/products";

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        // Let Cloudinary pick an optimal format (webp/avif) + quality for delivery.
        // Note: the URL we store is the original, but Cloudinary can still deliver
        // transformed variants on the fly.
        public_id: filename.replace(/\.[^.]+$/, ""),
      },
      (err, result) => {
        if (err || !result) {
          reject(err ?? new Error("Cloudinary upload returned no result"));
          return;
        }
        resolve(result.secure_url);
      },
    );
    stream.end(buffer);
  });
}
