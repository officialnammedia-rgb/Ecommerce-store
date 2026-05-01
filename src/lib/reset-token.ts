import crypto from "crypto";

const TTL_MS = 30 * 60 * 1000; // 30 minutes

function secret() {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("NEXTAUTH_SECRET is required for password reset tokens");
  return s;
}

function b64url(buf: Buffer | string): string {
  const b = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
  return b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(s: string): Buffer {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4;
  return Buffer.from(padded + "=".repeat(pad ? 4 - pad : 0), "base64");
}

type Payload = {
  uid: string;
  exp: number; // ms
  // First 12 chars of the user's current passwordHash. When password changes, this stops matching.
  pfp: string;
};

export function createResetToken(uid: string, currentHash: string): string {
  const payload: Payload = {
    uid,
    exp: Date.now() + TTL_MS,
    pfp: currentHash.slice(0, 12),
  };
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(
    crypto.createHmac("sha256", secret()).update(body).digest(),
  );
  return `${body}.${sig}`;
}

export function verifyResetToken(token: string): { uid: string; pfp: string } | null {
  if (!token || token.indexOf(".") < 0) return null;
  const [body, sig] = token.split(".");
  const expected = b64url(crypto.createHmac("sha256", secret()).update(body).digest());
  // Constant-time compare
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  let parsed: Payload;
  try {
    parsed = JSON.parse(b64urlDecode(body).toString("utf8")) as Payload;
  } catch {
    return null;
  }
  if (!parsed?.uid || !parsed?.exp || !parsed?.pfp) return null;
  if (Date.now() > parsed.exp) return null;
  return { uid: parsed.uid, pfp: parsed.pfp };
}
