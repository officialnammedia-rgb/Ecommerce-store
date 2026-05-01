"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/auth/AuthLayout";

export function ResetPasswordForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const token = sp.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirm) {
      setError("Passwords don't match");
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/reset", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ token, newPassword }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
          setError(data.error ?? "Could not reset password");
          return;
        }
        setDone(true);
        setTimeout(() => router.push("/login"), 2500);
      } catch {
        setError("Network error");
      }
    });
  }

  return (
    <AuthLayout
      imageUrl="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1400&q=80"
      imageAlt="Reset password"
      eyebrow="Almost there"
      headline="Choose a new password."
      subhead="Use 8+ characters. A mix of letters, numbers and symbols is best."
    >
      <h1 className="text-3xl font-semibold">Reset password</h1>

      {!token ? (
        <div className="mt-8 rounded-lg bg-rose-50 text-rose-900 px-4 py-4 text-sm">
          <p className="font-semibold">Missing token.</p>
          <p className="mt-1">
            <Link href="/forgot-password" className="underline">
              Request a fresh reset link
            </Link>
            .
          </p>
        </div>
      ) : done ? (
        <div className="mt-8 rounded-lg bg-emerald-50 text-emerald-900 px-4 py-4 text-sm">
          <p className="font-semibold">Password updated.</p>
          <p className="mt-1">Redirecting you to sign in…</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="text-sm font-medium">New password</label>
            <div className="relative mt-1">
              <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                placeholder="At least 8 characters"
                className="w-full h-11 rounded-md border border-neutral-300 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Confirm new password</label>
            <div className="relative mt-1">
              <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                className="w-full h-11 rounded-md border border-neutral-300 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full h-11" disabled={pending}>
            {pending ? "Updating..." : "Update password"}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
