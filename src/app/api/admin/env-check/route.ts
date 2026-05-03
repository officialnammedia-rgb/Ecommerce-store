import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

// Diagnostic endpoint for admins. Reports which integration env vars are
// visible to the running function, WITHOUT leaking their values.
// Used to debug "image upload fails on Vercel" type issues.
export async function GET() {
  await requireAdmin();

  const mask = (v: string | undefined) => {
    if (!v) return null;
    if (v.length <= 8) return "***";
    return `${v.slice(0, 4)}…${v.slice(-3)} (len=${v.length})`;
  };

  return NextResponse.json({
    runtime: {
      vercel: !!process.env.VERCEL,
      vercelEnv: process.env.VERCEL_ENV ?? null,
      nodeEnv: process.env.NODE_ENV ?? null,
      region: process.env.VERCEL_REGION ?? null,
    },
    cloudinary: {
      hasUrl: !!process.env.CLOUDINARY_URL,
      urlPreview: mask(process.env.CLOUDINARY_URL),
      hasCloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
      hasApiKey: !!process.env.CLOUDINARY_API_KEY,
      hasApiSecret: !!process.env.CLOUDINARY_API_SECRET,
    },
    razorpay: {
      hasKeyId: !!process.env.RAZORPAY_KEY_ID,
      keyIdPrefix: process.env.RAZORPAY_KEY_ID?.slice(0, 8) ?? null,
      hasKeySecret: !!process.env.RAZORPAY_KEY_SECRET,
      hasWebhookSecret: !!process.env.RAZORPAY_WEBHOOK_SECRET,
    },
    email: {
      hasResendKey: !!process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM ?? null,
    },
    db: {
      hasUrl: !!process.env.DATABASE_URL,
      hostHint:
        process.env.DATABASE_URL?.match(/@([^/]+)/)?.[1]?.slice(0, 40) ?? null,
    },
  });
}
