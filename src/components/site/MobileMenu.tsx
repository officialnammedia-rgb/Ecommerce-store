"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import type { MegaMenuItem } from "./MegaMenuNav";

export function MobileMenu({ items }: { items: MegaMenuItem[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        onClick={() => setOpen(true)}
        className="md:hidden p-2 hover:bg-neutral-100 rounded-md"
      >
        <Menu className="h-5 w-5" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <span className="font-semibold">Menu</span>
              <button onClick={() => setOpen(false)} aria-label="Close" className="p-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-4 space-y-5">
              {items.map((it) => (
                <div key={it.label}>
                  <Link
                    href={it.href}
                    onClick={() => setOpen(false)}
                    className="block text-sm font-semibold uppercase tracking-wider"
                  >
                    {it.label}
                  </Link>
                  <ul className="mt-2 ml-1 space-y-1.5">
                    {it.columns.flatMap((c) => c.links).map((l) => (
                      <li key={l.href + l.label}>
                        <Link
                          href={l.href}
                          onClick={() => setOpen(false)}
                          className="text-sm text-neutral-700 hover:text-brand-accent"
                        >
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
