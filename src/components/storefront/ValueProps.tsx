import { Truck, RotateCcw, ShieldCheck, BadgeIndianRupee } from "lucide-react";

const items = [
  {
    icon: Truck,
    title: "Free shipping",
    sub: "On orders above ₹999",
  },
  {
    icon: RotateCcw,
    title: "Easy returns",
    sub: "7-day return window",
  },
  {
    icon: BadgeIndianRupee,
    title: "Cash on delivery",
    sub: "Pay when it arrives",
  },
  {
    icon: ShieldCheck,
    title: "Secure checkout",
    sub: "100% safe payments",
  },
];

export function ValueProps() {
  return (
    <section className="border-y border-neutral-200 bg-neutral-50">
      <div className="container py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <div key={it.title} className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-white border border-neutral-200 flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">{it.title}</p>
                <p className="text-xs text-neutral-600">{it.sub}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
