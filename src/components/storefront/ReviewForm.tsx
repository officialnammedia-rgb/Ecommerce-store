"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export function ReviewForm({
  productId,
  initialRating,
  initialTitle,
  initialBody,
  signedIn,
}: {
  productId: string;
  initialRating?: number;
  initialTitle?: string | null;
  initialBody?: string;
  signedIn: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(initialRating ?? 0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState(initialTitle ?? "");
  const [body, setBody] = useState(initialBody ?? "");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      toast.error("Please select a rating");
      return;
    }
    if (body.trim().length < 5) {
      toast.error("Please write at least a few words");
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch("/api/reviews", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ productId, rating, title: title.trim() || null, body }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
          toast.error(data.error ?? "Could not save review");
          return;
        }
        toast.success(initialRating ? "Review updated" : "Thanks for your review!");
        setOpen(false);
        router.refresh();
      } catch {
        toast.error("Network error");
      }
    });
  }

  if (!signedIn) {
    return (
      <a
        href={`/login?callbackUrl=/products`}
        className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-semibold hover:bg-neutral-50"
      >
        Sign in to write a review
      </a>
    );
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        {initialRating ? "Edit your review" : "Write a review"}
      </Button>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-neutral-200 p-4 space-y-4">
      <div>
        <p className="text-sm font-semibold">Your rating</p>
        <div className="mt-1 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setRating(s)}
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(0)}
              aria-label={`Rate ${s} stars`}
              className="p-0.5"
            >
              <Star
                className={cn(
                  "h-7 w-7 transition-colors",
                  (hover || rating) >= s
                    ? "fill-amber-500 text-amber-500"
                    : "text-neutral-300",
                )}
              />
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm font-semibold">Title (optional)</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          placeholder="Sum it up in a few words"
          className="mt-1 w-full h-10 rounded-md border border-neutral-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
        />
      </div>
      <div>
        <label className="text-sm font-semibold">Your review</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          rows={4}
          minLength={5}
          maxLength={2000}
          placeholder="What did you like or dislike? How did it fit?"
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
        />
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Submit review"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
