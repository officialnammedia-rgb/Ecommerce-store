"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect, useTransition } from "react";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

type FacetGroup = { name: string; values: string[] };

export type Facets = {
  sizes: string[];
  colors: string[];
  priceMin: number;
  priceMax: number;
};

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name_asc", label: "Name: A to Z" },
];

function readMulti(sp: URLSearchParams, key: string): string[] {
  const v = sp.get(key);
  return v ? v.split(",").filter(Boolean) : [];
}

export function CollectionToolbar({
  facets,
  totalCount,
}: {
  facets: Facets;
  totalCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [openMobile, setOpenMobile] = useState(false);

  const currentSort = sp.get("sort") ?? "newest";
  const selectedSizes = readMulti(sp, "size");
  const selectedColors = readMulti(sp, "color");
  const minPrice = sp.get("min");
  const maxPrice = sp.get("max");
  const inStockOnly = sp.get("inStock") === "1";

  function update(updates: Record<string, string | null>) {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    startTransition(() => {
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    });
  }

  function toggleMulti(key: string, value: string) {
    const cur = readMulti(sp, key);
    const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
    update({ [key]: next.length ? next.join(",") : null });
  }

  function clearAll() {
    startTransition(() => router.replace(pathname, { scroll: false }));
  }

  const activeChips: { key: string; label: string; onRemove: () => void }[] = [];
  for (const s of selectedSizes)
    activeChips.push({
      key: `size-${s}`,
      label: `Size: ${s}`,
      onRemove: () => toggleMulti("size", s),
    });
  for (const c of selectedColors)
    activeChips.push({
      key: `color-${c}`,
      label: `Color: ${c}`,
      onRemove: () => toggleMulti("color", c),
    });
  if (minPrice || maxPrice)
    activeChips.push({
      key: "price",
      label: `Price: ₹${minPrice ?? 0} – ₹${maxPrice ?? "∞"}`,
      onRemove: () => update({ min: null, max: null }),
    });
  if (inStockOnly)
    activeChips.push({
      key: "instock",
      label: "In stock only",
      onRemove: () => update({ inStock: null }),
    });

  const FilterBody = (
    <div className="space-y-7 text-sm">
      <FilterGroup title="Sort by" defaultOpen>
        <div className="space-y-2">
          {SORT_OPTIONS.map((o) => (
            <label key={o.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="sort"
                checked={currentSort === o.value}
                onChange={() => update({ sort: o.value === "newest" ? null : o.value })}
              />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
      </FilterGroup>

      {facets.sizes.length > 0 && (
        <FilterGroup title="Size" defaultOpen>
          <div className="flex flex-wrap gap-2">
            {facets.sizes.map((s) => {
              const active = selectedSizes.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleMulti("size", s)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs border transition",
                    active
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-300 hover:bg-neutral-50",
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </FilterGroup>
      )}

      {facets.colors.length > 0 && (
        <FilterGroup title="Color" defaultOpen>
          <div className="grid grid-cols-2 gap-1">
            {facets.colors.map((c) => {
              const active = selectedColors.includes(c);
              return (
                <label key={c} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggleMulti("color", c)}
                  />
                  <span>{c}</span>
                </label>
              );
            })}
          </div>
        </FilterGroup>
      )}

      <FilterGroup title="Price" defaultOpen>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Min ₹"
            defaultValue={minPrice ?? ""}
            onBlur={(e) => update({ min: e.target.value || null })}
            className="w-full rounded border px-2 py-1.5 text-xs"
          />
          <span className="text-neutral-400">–</span>
          <input
            type="number"
            placeholder="Max ₹"
            defaultValue={maxPrice ?? ""}
            onBlur={(e) => update({ max: e.target.value || null })}
            className="w-full rounded border px-2 py-1.5 text-xs"
          />
        </div>
      </FilterGroup>

      <FilterGroup title="Availability" defaultOpen>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => update({ inStock: e.target.checked ? "1" : null })}
          />
          <span>In stock only</span>
        </label>
      </FilterGroup>
    </div>
  );

  return (
    <>
      {/* Toolbar row */}
      <div className="flex items-center justify-between gap-3 border-y border-neutral-200 py-3 mb-6">
        <div className="text-sm text-neutral-600">
          <span className="font-semibold text-neutral-900">{totalCount}</span> products
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpenMobile(true)}
            className="lg:hidden inline-flex items-center gap-1 text-sm border border-neutral-300 rounded-full px-4 h-9"
          >
            Filters
          </button>
          <select
            value={currentSort}
            onChange={(e) => update({ sort: e.target.value === "newest" ? null : e.target.value })}
            className="text-sm border border-neutral-300 rounded-full px-4 h-9 bg-white"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active chips */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {activeChips.map((c) => (
            <button
              key={c.key}
              onClick={c.onRemove}
              className="inline-flex items-center gap-1 rounded-full bg-neutral-100 hover:bg-neutral-200 px-3 py-1 text-xs"
            >
              {c.label}
              <X className="h-3 w-3" />
            </button>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="text-xs underline text-neutral-600 ml-1"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:block">{FilterBody}</aside>

      {/* Mobile drawer */}
      {openMobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpenMobile(false)} />
          <div className="absolute inset-y-0 right-0 w-80 max-w-[85vw] bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <span className="font-semibold">Filters</span>
              <button onClick={() => setOpenMobile(false)} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">{FilterBody}</div>
            <div className="p-4 border-t">
              <button
                onClick={() => setOpenMobile(false)}
                className="w-full rounded-full bg-neutral-900 text-white py-3 text-sm font-semibold"
              >
                View {totalCount} products
              </button>
            </div>
          </div>
        </div>
      )}

      {pending && (
        <div className="fixed top-2 right-2 text-xs bg-neutral-900 text-white rounded-full px-3 py-1 z-50">
          Updating...
        </div>
      )}
    </>
  );
}

function FilterGroup({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="border-b border-neutral-200 pb-5">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="w-full flex items-center justify-between font-semibold text-sm"
      >
        <span>{title}</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}
