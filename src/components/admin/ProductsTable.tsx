"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/utils";
import {
  bulkUpdateProductStatusAction,
  bulkDeleteProductsAction,
} from "@/app/admin/products/actions";

export type AdminProductRow = {
  id: string;
  slug: string;
  title: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  minPrice: number;
  totalQty: number;
  imageUrl: string | null;
};

type StatusFilter = "ALL" | "DRAFT" | "ACTIVE" | "ARCHIVED";

export function ProductsTable({ products }: { products: AdminProductRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q)
      );
    });
  }, [products, statusFilter, query]);

  const allVisibleSelected =
    filtered.length > 0 && filtered.every((p) => selected.has(p.id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllVisible() {
    if (allVisibleSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        for (const p of filtered) next.delete(p.id);
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        for (const p of filtered) next.add(p.id);
        return next;
      });
    }
  }

  function runBulk(fn: () => Promise<{ count: number }>, afterLabel: string) {
    setError(null);
    startTransition(async () => {
      try {
        const { count } = await fn();
        setSelected(new Set());
        router.refresh();
        // Tiny inline feedback via browser's own setTimeout; a real toast
        // would be nicer but avoids new dependencies.
        console.log(`${afterLabel}: ${count} product(s)`);
      } catch (e: any) {
        setError(e?.message ?? "Action failed");
      }
    });
  }

  function bulkStatus(status: "DRAFT" | "ACTIVE" | "ARCHIVED") {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    runBulk(
      () => bulkUpdateProductStatusAction(ids, status),
      `Status → ${status}`,
    );
  }

  function bulkDelete() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    const confirmed = window.confirm(
      `Delete ${ids.length} product${ids.length === 1 ? "" : "s"}? This cannot be undone.`,
    );
    if (!confirmed) return;
    runBulk(() => bulkDeleteProductsAction(ids), "Deleted");
  }

  return (
    <>
      {/* Filters + counts */}
      <div className="mt-6 flex flex-wrap gap-3 items-center">
        <input
          type="search"
          placeholder="Search by title or slug…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 min-w-[200px] h-9 px-3 border border-neutral-200 rounded-md text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="h-9 px-3 border border-neutral-200 rounded-md text-sm bg-white"
        >
          <option value="ALL">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <div className="text-xs text-neutral-500 ml-auto whitespace-nowrap">
          Showing {filtered.length} of {products.length}
        </div>
      </div>

      {error && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 text-red-700 text-sm px-3 py-2">
          {error}
        </div>
      )}

      {/* Sticky bulk-action toolbar */}
      {selected.size > 0 && (
        <div className="mt-4 sticky top-16 z-20 bg-neutral-900 text-white rounded-lg px-4 py-2.5 flex flex-wrap items-center gap-2 shadow-lg">
          <span className="text-sm font-medium mr-2">
            {selected.size} selected
          </span>
          <Button
            size="sm"
            disabled={isPending}
            onClick={() => bulkStatus("ACTIVE")}
            className="bg-green-600 text-white hover:bg-green-700"
          >
            Publish
          </Button>
          <Button
            size="sm"
            disabled={isPending}
            onClick={() => bulkStatus("DRAFT")}
            className="bg-white text-neutral-900 hover:bg-neutral-100"
          >
            Unpublish
          </Button>
          <Button
            size="sm"
            disabled={isPending}
            onClick={() => bulkStatus("ARCHIVED")}
            className="bg-neutral-700 text-white hover:bg-neutral-600"
          >
            Archive
          </Button>
          <div className="flex-1" />
          <Button
            size="sm"
            variant="destructive"
            disabled={isPending}
            onClick={bulkDelete}
          >
            Delete
          </Button>
          <button
            type="button"
            className="text-xs text-white/70 hover:text-white px-2"
            onClick={() => setSelected(new Set())}
            disabled={isPending}
          >
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="mt-4 bg-white rounded-lg border border-neutral-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleAllVisible}
                  aria-label="Select all visible"
                />
              </th>
              <th className="text-left px-4 py-3">Product</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Price</th>
              <th className="text-right px-4 py-3">Inventory</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((p) => {
              const checked = selected.has(p.id);
              return (
                <tr
                  key={p.id}
                  className={checked ? "bg-neutral-50" : "hover:bg-neutral-50"}
                >
                  <td className="px-4 py-3 align-middle">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(p.id)}
                      aria-label={`Select ${p.title}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-neutral-100 overflow-hidden shrink-0">
                        {p.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.imageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="font-medium hover:underline block truncate"
                        >
                          {p.title}
                        </Link>
                        <div className="text-xs text-neutral-500 truncate">
                          /{p.slug}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        p.status === "ACTIVE"
                          ? "text-green-700 bg-green-50 px-2 py-0.5 rounded text-xs"
                          : p.status === "ARCHIVED"
                            ? "text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded text-xs"
                            : "text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-xs"
                      }
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatINR(p.minPrice)}
                  </td>
                  <td className="px-4 py-3 text-right">{p.totalQty}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="text-sm underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-neutral-500"
                >
                  {products.length === 0
                    ? "No products yet."
                    : "No products match your filters."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
