"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingCart,
  RotateCcw,
  Users,
  Tag,
  Settings as SettingsIcon,
  LogOut,
  ExternalLink,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/collections", label: "Collections", icon: Layers },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/returns", label: "Returns", icon: RotateCcw },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/discounts", label: "Discounts", icon: Tag },
  { href: "/admin/settings", label: "Settings", icon: SettingsIcon },
];

// AdminSidebar is:
//  - a slide-in drawer (hamburger) below the `md` breakpoint, so small screens
//    get the full viewport for data-heavy admin pages
//  - a permanent left rail from `md` upwards
export function AdminSidebar({ storeName }: { storeName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Auto-close the drawer when the route changes so navigating doesn't leave
  // the overlay hanging.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const panel = (
    <>
      <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
        <Link href="/admin" className="font-semibold text-lg">
          {storeName} <span className="text-neutral-400 text-xs ml-1">admin</span>
        </Link>
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="md:hidden p-1 rounded hover:bg-neutral-100"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {items.map((it) => {
          const active = it.exact ? pathname === it.href : pathname.startsWith(it.href);
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm",
                active ? "bg-neutral-900 text-white" : "hover:bg-neutral-100",
              )}
            >
              <Icon className="h-4 w-4" /> {it.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-neutral-200 space-y-1">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-neutral-100"
        >
          <ExternalLink className="h-4 w-4" /> View store
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-neutral-100"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar with hamburger */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between bg-white border-b border-neutral-200 px-4 h-14">
        <button
          type="button"
          aria-label="Open admin menu"
          onClick={() => setOpen(true)}
          className="p-2 -ml-2 rounded hover:bg-neutral-100"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/admin" className="font-semibold">
          {storeName} <span className="text-neutral-400 text-xs ml-1">admin</span>
        </Link>
        <span className="w-9" aria-hidden />
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col">
            {panel}
          </aside>
        </div>
      )}

      {/* Desktop rail */}
      <aside className="hidden md:flex w-60 shrink-0 border-r border-neutral-200 bg-white min-h-screen flex-col">
        {panel}
      </aside>
    </>
  );
}
