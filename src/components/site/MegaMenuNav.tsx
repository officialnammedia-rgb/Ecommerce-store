"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

type MegaMenuLink = { label: string; href: string };
type MegaMenuColumn = { title: string; links: MegaMenuLink[] };
export type MegaMenuTile = { title: string; href: string; image: string };
export type MegaMenuItem = {
  label: string;
  href: string;
  columns: MegaMenuColumn[];
  tiles?: MegaMenuTile[];
};

export function MegaMenuNav({ items }: { items: MegaMenuItem[] }) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <nav
      className="hidden md:flex items-center gap-1 text-sm relative"
      onMouseLeave={() => setOpen(null)}
    >
      {items.map((it) => (
        <div key={it.label} onMouseEnter={() => setOpen(it.label)}>
          <Link
            href={it.href}
            className={cn(
              "px-3 py-2 font-medium uppercase tracking-wide text-[13px] transition-colors",
              open === it.label ? "text-brand-accent" : "hover:text-brand-accent",
            )}
          >
            {it.label}
          </Link>
        </div>
      ))}

      {items.map((it) => (
        <div
          key={`panel-${it.label}`}
          className={cn(
            "absolute left-1/2 -translate-x-1/2 top-full w-screen max-w-5xl bg-white shadow-2xl border-t border-neutral-200 transition-all duration-200",
            open === it.label
              ? "opacity-100 visible translate-y-0"
              : "opacity-0 invisible -translate-y-1",
          )}
          onMouseEnter={() => setOpen(it.label)}
        >
          <div className="grid grid-cols-12 gap-8 p-8">
            <div className="col-span-8 grid grid-cols-3 gap-8">
              {it.columns.map((col) => (
                <div key={col.title}>
                  <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
                    {col.title}
                  </p>
                  <ul className="mt-3 space-y-2">
                    {col.links.map((l) => (
                      <li key={l.href + l.label}>
                        <Link
                          href={l.href}
                          className="text-sm text-neutral-800 hover:text-brand-accent"
                          onClick={() => setOpen(null)}
                        >
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            {it.tiles && it.tiles.length > 0 && (
              <div className="col-span-4 grid grid-cols-2 gap-3">
                {it.tiles.map((t) => (
                  <Link
                    key={t.href + t.title}
                    href={t.href}
                    className="group relative aspect-[3/4] overflow-hidden rounded-lg"
                    onClick={() => setOpen(null)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={t.image}
                      alt={t.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <span className="absolute bottom-2 left-3 text-white text-sm font-semibold">
                      {t.title}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </nav>
  );
}
