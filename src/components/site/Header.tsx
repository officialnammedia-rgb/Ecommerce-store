import Link from "next/link";
import { ShoppingBag, Search, User, Heart } from "lucide-react";
import { readCart, cartTotals } from "@/lib/cart";
import { getSession } from "@/lib/session";
import { isAdminRole } from "@/lib/auth";
import { MegaMenuNav, type MegaMenuItem } from "./MegaMenuNav";
import { MobileMenu } from "./MobileMenu";
import { siteName } from "@/lib/site";

const NAV: MegaMenuItem[] = [
  {
    label: "New",
    href: "/collections/new",
    columns: [
      {
        title: "Just landed",
        links: [
          { label: "All new", href: "/collections/new" },
          { label: "New for women", href: "/collections/women?sort=newest" },
          { label: "New for men", href: "/collections/men?sort=newest" },
        ],
      },
      {
        title: "Trending",
        links: [
          { label: "Linen edit", href: "/search?q=linen" },
          { label: "Everyday tees", href: "/search?q=tee" },
          { label: "Denim", href: "/search?q=jeans" },
        ],
      },
      {
        title: "Editorial",
        links: [
          { label: "Spring lookbook", href: "/collections/all" },
          { label: "Festive picks", href: "/collections/all" },
        ],
      },
    ],
    tiles: [
      {
        title: "Spring '26",
        href: "/collections/new",
        image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&q=80",
      },
      {
        title: "Best sellers",
        href: "/collections/all",
        image: "https://images.unsplash.com/photo-1485231183945-fffde7cc051e?w=600&q=80",
      },
    ],
  },
  {
    label: "Women",
    href: "/collections/women",
    columns: [
      {
        title: "Categories",
        links: [
          { label: "All women", href: "/collections/women" },
          { label: "Tops & tees", href: "/search?q=tee" },
          { label: "Dresses", href: "/search?q=dress" },
          { label: "Shirts", href: "/search?q=shirt" },
          { label: "Bottoms", href: "/search?q=jeans" },
        ],
      },
      {
        title: "Edits",
        links: [
          { label: "Festive ready", href: "/collections/women" },
          { label: "Workwear", href: "/collections/women" },
          { label: "Easy linen", href: "/search?q=linen" },
        ],
      },
      {
        title: "Sale",
        links: [
          { label: "Up to 60% off", href: "/collections/sale" },
          { label: "Final markdowns", href: "/collections/sale" },
        ],
      },
    ],
    tiles: [
      {
        title: "Festive edit",
        href: "/collections/women",
        image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&q=80",
      },
    ],
  },
  {
    label: "Men",
    href: "/collections/men",
    columns: [
      {
        title: "Categories",
        links: [
          { label: "All men", href: "/collections/men" },
          { label: "T-shirts", href: "/search?q=tee" },
          { label: "Shirts", href: "/search?q=shirt" },
          { label: "Jeans", href: "/search?q=jeans" },
        ],
      },
      {
        title: "Edits",
        links: [
          { label: "Smart casual", href: "/collections/men" },
          { label: "Streetwear", href: "/collections/men" },
        ],
      },
      { title: "Sale", links: [{ label: "Up to 50% off", href: "/collections/sale" }] },
    ],
    tiles: [
      {
        title: "Sharp & easy",
        href: "/collections/men",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
      },
    ],
  },
  {
    label: "Sale",
    href: "/collections/sale",
    columns: [
      {
        title: "By discount",
        links: [
          { label: "Up to 30% off", href: "/collections/sale" },
          { label: "Up to 50% off", href: "/collections/sale" },
          { label: "Up to 60% off", href: "/collections/sale" },
        ],
      },
      {
        title: "Categories",
        links: [
          { label: "Women's sale", href: "/collections/sale" },
          { label: "Men's sale", href: "/collections/sale" },
        ],
      },
      {
        title: "Final call",
        links: [
          { label: "Last sizes", href: "/collections/sale" },
          { label: "Clearance", href: "/collections/sale" },
        ],
      },
    ],
  },
];

export async function Header() {
  const storeName = siteName();
  const [cart, session] = await Promise.all([readCart(), getSession()]);
  const itemCount = cart ? cartTotals(cart).itemCount : 0;
  const isAdmin = isAdminRole(session?.user?.role);

  return (
    <header className="border-b border-neutral-200 bg-white sticky top-0 z-40">
      <div className="container flex h-16 items-center gap-4">
        <MobileMenu items={NAV} />
        <Link href="/" className="text-xl font-bold tracking-tight">
          {storeName}
        </Link>
        <div className="flex-1 flex justify-center">
          <MegaMenuNav items={NAV} />
        </div>
        <div className="flex items-center gap-1">
          <Link
            href="/search"
            aria-label="Search"
            className="p-2 hover:bg-neutral-100 rounded-md"
            title="Search"
          >
            <Search className="h-5 w-5" />
          </Link>
          <Link
            href="/account/wishlist"
            aria-label="Wishlist"
            className="hidden sm:inline-flex p-2 hover:bg-neutral-100 rounded-md"
            title="Wishlist"
          >
            <Heart className="h-5 w-5" />
          </Link>
          <Link
            href="/account"
            aria-label="Account"
            className="p-2 hover:bg-neutral-100 rounded-md"
            title={session?.user?.email ?? "Account"}
          >
            <User className="h-5 w-5" />
          </Link>
          <Link
            href="/cart"
            aria-label="Cart"
            className="p-2 hover:bg-neutral-100 rounded-md relative"
            title="Cart"
          >
            <ShoppingBag className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-brand-accent text-white text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 font-bold">
                {itemCount}
              </span>
            )}
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="ml-2 hidden sm:inline-flex items-center rounded-full bg-brand-accent text-white px-3 h-8 text-xs font-semibold hover:bg-rose-700"
            >
              Admin
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
