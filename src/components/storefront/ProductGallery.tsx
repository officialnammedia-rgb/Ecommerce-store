"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type GalleryImage = { id: string; url: string; alt: string | null };

export function ProductGallery({
  images,
  title,
}: {
  images: GalleryImage[];
  title: string;
}) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return <div className="aspect-[4/5] rounded-lg bg-neutral-100" />;
  }

  function go(delta: number) {
    setActive((i) => (i + delta + images.length) % images.length);
  }

  return (
    <div className="grid md:grid-cols-[80px_1fr] gap-3">
      {/* Thumbnail rail (desktop) */}
      <div className="hidden md:flex flex-col gap-2 max-h-[640px] overflow-y-auto pr-1">
        {images.map((img, i) => (
          <button
            key={img.id}
            onClick={() => setActive(i)}
            className={cn(
              "relative aspect-square w-20 rounded-md overflow-hidden border-2 transition",
              i === active ? "border-neutral-900" : "border-transparent hover:border-neutral-300",
            )}
            aria-label={`Show image ${i + 1}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt={img.alt ?? title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Main image */}
      <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-neutral-100 group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[active].url}
          alt={images[active].alt ?? title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/85 backdrop-blur shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/85 backdrop-blur shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  aria-label={`Show image ${i + 1}`}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === active ? "w-6 bg-white" : "w-1.5 bg-white/60",
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Mobile thumbnails */}
      {images.length > 1 && (
        <div className="md:hidden flex gap-2 overflow-x-auto -mx-4 px-4">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActive(i)}
              className={cn(
                "relative aspect-square w-16 flex-shrink-0 rounded-md overflow-hidden border-2",
                i === active ? "border-neutral-900" : "border-transparent",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.alt ?? title} className="absolute inset-0 w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
