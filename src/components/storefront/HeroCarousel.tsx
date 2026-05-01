"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type HeroSlide = {
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaHref: string;
  secondaryText?: string;
  secondaryHref?: string;
  image: string;
  accent: string; // tailwind background color class for left side
  textOnDark?: boolean;
};

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timer.current = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 5500);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [slides.length]);

  function go(delta: number) {
    setIndex((i) => (i + delta + slides.length) % slides.length);
    if (timer.current) clearInterval(timer.current);
  }

  return (
    <section className="relative">
      <div className="relative h-[420px] md:h-[560px] overflow-hidden">
        {slides.map((s, i) => (
          <div
            key={i}
            className={cn(
              "absolute inset-0 transition-opacity duration-700",
              i === index ? "opacity-100 z-10" : "opacity-0 z-0",
            )}
            aria-hidden={i !== index}
          >
            <div className="grid md:grid-cols-2 h-full">
              <div className={cn("flex items-center", s.accent)}>
                <div
                  className={cn(
                    "container max-w-xl py-12 md:py-0",
                    s.textOnDark ? "text-white" : "text-neutral-900",
                  )}
                >
                  <p
                    className={cn(
                      "text-xs md:text-sm uppercase tracking-[0.25em]",
                      s.textOnDark ? "text-white/80" : "text-brand-accent",
                    )}
                  >
                    {s.eyebrow}
                  </p>
                  <h1 className="mt-4 text-4xl md:text-6xl font-semibold leading-[1.05]">
                    {s.title}
                  </h1>
                  <p
                    className={cn(
                      "mt-5 max-w-md text-base md:text-lg",
                      s.textOnDark ? "text-white/85" : "text-neutral-600",
                    )}
                  >
                    {s.subtitle}
                  </p>
                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <Link
                      href={s.ctaHref}
                      className={cn(
                        "inline-flex items-center justify-center rounded-full px-7 py-3 text-sm font-semibold transition",
                        s.textOnDark
                          ? "bg-white text-neutral-900 hover:bg-neutral-100"
                          : "bg-neutral-900 text-white hover:bg-neutral-800",
                      )}
                    >
                      {s.ctaText}
                    </Link>
                    {s.secondaryHref && s.secondaryText && (
                      <Link
                        href={s.secondaryHref}
                        className={cn(
                          "inline-flex items-center justify-center rounded-full border px-6 py-3 text-sm font-semibold transition",
                          s.textOnDark
                            ? "border-white/40 hover:bg-white/10"
                            : "border-neutral-900/30 hover:bg-neutral-900/5",
                        )}
                      >
                        {s.secondaryText}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
              <div className="relative h-64 md:h-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.image}
                  alt={s.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        aria-label="Previous"
        onClick={() => go(-1)}
        className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full bg-white/85 backdrop-blur shadow hover:bg-white"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        aria-label="Next"
        onClick={() => go(1)}
        className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full bg-white/85 backdrop-blur shadow hover:bg-white"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => {
              setIndex(i);
              if (timer.current) clearInterval(timer.current);
            }}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === index ? "w-8 bg-neutral-900" : "w-2 bg-neutral-400/70 hover:bg-neutral-600",
            )}
          />
        ))}
      </div>
    </section>
  );
}
