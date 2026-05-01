"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/auth/AuthLayout";

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const callbackUrl = search.get("callbackUrl") ?? "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }
    router.push(res?.url ?? callbackUrl);
    router.refresh();
  }

  return (
    <AuthLayout
      imageUrl="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1400&q=80"
      imageAlt="Welcome back"
      eyebrow="Welcome back"
      headline="Pick up where you left off."
      subhead="Sign in to track orders, manage your wishlist, and check out faster."
    >
      <h1 className="text-3xl font-semibold">Sign in</h1>
      <p className="text-sm text-neutral-600 mt-1">
        New to Aurelia?{" "}
        <Link href="/register" className="font-medium text-brand-accent hover:underline">
          Create an account
        </Link>
      </p>

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
        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Password</label>
            <Link
              href="/forgot-password"
              className="text-xs text-neutral-600 hover:text-brand-accent hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative mt-1">
            <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full h-11 rounded-md border border-neutral-300 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full h-11" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <p className="mt-8 text-xs text-neutral-500 text-center">
        By signing in you agree to our{" "}
        <Link href="/pages/terms" className="underline">
          Terms
        </Link>{" "}
        &amp;{" "}
        <Link href="/pages/privacy" className="underline">
          Privacy Policy
        </Link>
        .
      </p>
    </AuthLayout>
  );
}
