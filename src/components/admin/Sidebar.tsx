"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
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

export function AdminSidebar({ storeName }: { storeName: string }) {
  const pathname = usePathname();
  return (
    <aside className="w-60 shrink-0 border-r border-neutral-200 bg-white min-h-screen flex flex-col">
      <div className="px-5 py-4 border-b border-neutral-200">
        <Link href="/admin" className="font-semibold text-lg">
          {storeName} <span className="text-neutral-400 text-xs ml-1">admin</span>
        </Link>
      </div>
      <nav className="flex-1 p-3 space-y-1">
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
    </aside>
  );
}
