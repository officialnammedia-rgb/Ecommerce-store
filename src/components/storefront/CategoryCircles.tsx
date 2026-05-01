import Link from "next/link";

type Item = { title: string; href: string; image: string };

export function CategoryCircles({ items }: { items: Item[] }) {
  return (
    <section className="container py-10">
      <h2 className="text-lg md:text-xl font-semibold mb-6">Shop by category</h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 md:gap-6">
        {items.map((it) => (
          <Link key={it.href} href={it.href} className="group flex flex-col items-center gap-2">
            <div className="relative w-20 h-20 md:w-28 md:h-28 rounded-full overflow-hidden ring-2 ring-transparent group-hover:ring-brand-accent transition-all">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={it.image}
                alt={it.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            <span className="text-xs md:text-sm font-medium text-center">{it.title}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
