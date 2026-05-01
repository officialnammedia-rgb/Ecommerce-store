"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/auth/AuthLayout";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await fetch("/api/auth/forgot", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email }),
        });
      } finally {
        setSubmitted(true);
      }
    });
  }

  return (
    <AuthLayout
      imageUrl="https://images.unsplash.com/photo-1485231183945-fffde7cc051e?w=1400&q=80"
      imageAlt="Forgot password"
      eyebrow="Account recovery"
      headline="Let's get you back in."
      subhead="Enter your email and we'll send you a secure link to reset your password."
    >
      <h1 className="text-3xl font-semibold">Forgot password</h1>
      <p className="text-sm text-neutral-600 mt-1">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-brand-accent hover:underline">
          Sign in
        </Link>
      </p>

      {submitted ? (
        <div className="mt-8 rounded-lg bg-emerald-50 text-emerald-900 px-4 py-4 text-sm">
          <p className="font-semibold">Check your inbox.</p>
          <p className="mt-1">
            If an account exists for that email, we&apos;ve sent a reset link. The link is valid for 30 minutes.
          </p>
          <p className="mt-3 text-xs text-emerald-700">
            Tip: in dev, the email is logged to your terminal.
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="text-sm font-medium">Email</label>
            <div className="relative mt-1">
              <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full h-11 rounded-md border border-neutral-300 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
              />
            </div>
          </div>
          <Button type="submit" className="w-full h-11" disabled={pending}>
            {pending ? "Sending..." : "Send reset link"}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
