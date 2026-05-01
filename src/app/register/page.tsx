"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/auth/AuthLayout";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Could not create account");
        setLoading(false);
        return;
      }
      const signed = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      setLoading(false);
      if (signed?.error) {
        setError("Created, but sign-in failed. Please log in.");
        router.push("/login");
        return;
      }
      router.push(signed?.url ?? "/");
      router.refresh();
    } catch {
      setLoading(false);
      setError("Network error");
    }
  }

  return (
    <AuthLayout
      imageUrl="https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1400&q=80"
      imageAlt="Join Aurelia"
      eyebrow="Join Aurelia"
      headline="Members get more."
      subhead="Save your wishlist, track orders, and unlock 10% off your first purchase."
    >
      <h1 className="text-3xl font-semibold">Create your account</h1>
      <p className="text-sm text-neutral-600 mt-1">
        Already a member?{" "}
        <Link href="/login" className="font-medium text-brand-accent hover:underline">
          Sign in
        </Link>
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <label className="text-sm font-medium">Full name</label>
          <div className="relative mt-1">
            <User className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={1}
              maxLength={100}
              autoComplete="name"
              placeholder="Your name"
              className="w-full h-11 rounded-md border border-neutral-300 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
            />
          </div>
        </div>
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
          <label className="text-sm font-medium">Password</label>
          <div className="relative mt-1">
            <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              className="w-full h-11 rounded-md border border-neutral-300 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
            />
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">8+ characters recommended.</p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full h-11" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <p className="mt-8 text-xs text-neutral-500 text-center">
        By creating an account you agree to our{" "}
        <Link href="/pages/terms" className="underline">
          Terms
        </Link>{" "}
        &amp;{" "}
        <Link href="/pages/privacy" className="underline">
          Privacy
        </Link>
        .
      </p>
    </AuthLayout>
  );
}
