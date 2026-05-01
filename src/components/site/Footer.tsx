import Link from "next/link";
import { Instagram, Facebook, Twitter, Youtube } from "lucide-react";

const COLS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Shop",
    links: [
      { label: "New arrivals", href: "/collections/new" },
      { label: "Women", href: "/collections/women" },
      { label: "Men", href: "/collections/men" },
      { label: "Sale", href: "/collections/sale" },
      { label: "All products", href: "/collections/all" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Track order", href: "/account" },
      { label: "Shipping", href: "/pages/shipping" },
      { label: "Returns", href: "/pages/returns" },
      { label: "Size guide", href: "/pages/size-guide" },
      { label: "Contact us", href: "/pages/contact" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/pages/about" },
      { label: "Sustainability", href: "/pages/sustainability" },
      { label: "Careers", href: "/pages/careers" },
      { label: "Press", href: "/pages/press" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", href: "/pages/terms" },
      { label: "Privacy", href: "/pages/privacy" },
      { label: "Cookie policy", href: "/pages/cookies" },
      { label: "Refund policy", href: "/pages/returns" },
    ],
  },
];

export function Footer() {
  const storeName = process.env.STORE_NAME ?? "Aurelia";
  return (
    <footer className="bg-neutral-950 text-neutral-300 mt-12">
      <div className="container py-14 grid grid-cols-2 md:grid-cols-6 gap-8">
        <div className="col-span-2 md:col-span-2">
          <Link href="/" className="text-2xl font-bold text-white tracking-tight">
            {storeName}
          </Link>
          <p className="mt-3 text-sm text-neutral-400 max-w-xs">
            Considered, everyday clothing — designed in India, made to move with you.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <SocialLink href="https://instagram.com" icon={Instagram} label="Instagram" />
            <SocialLink href="https://facebook.com" icon={Facebook} label="Facebook" />
            <SocialLink href="https://twitter.com" icon={Twitter} label="Twitter" />
            <SocialLink href="https://youtube.com" icon={Youtube} label="YouTube" />
          </div>
        </div>

        {COLS.map((col) => (
          <div key={col.title}>
            <p className="text-xs font-semibold uppercase tracking-widest text-white">
              {col.title}
            </p>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.href + l.label}>
                  <Link
                    href={l.href}
                    className="text-sm text-neutral-400 hover:text-white transition"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-neutral-800">
        <div className="container py-6 flex flex-col md:flex-row gap-4 items-center justify-between text-xs text-neutral-500">
          <p>
            © {new Date().getFullYear()} {storeName}. All rights reserved.
          </p>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <PaymentBadge label="UPI" />
            <PaymentBadge label="Visa" />
            <PaymentBadge label="Mastercard" />
            <PaymentBadge label="RuPay" />
            <PaymentBadge label="Razorpay" />
            <PaymentBadge label="COD" />
          </div>
          <p>Made in India</p>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="h-9 w-9 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition"
    >
      <Icon className="h-4 w-4" />
    </a>
  );
}

function PaymentBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center justify-center rounded-md bg-neutral-800 text-neutral-300 px-2.5 py-1 text-[10px] font-semibold tracking-wider">
      {label}
    </span>
  );
}
