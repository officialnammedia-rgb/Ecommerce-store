import Link from "next/link";

type Tile = {
  title: string;
  subtitle?: string;
  cta: string;
  href: string;
  image: string;
  badge?: string;
};

export function PromoTiles({ tiles }: { tiles: Tile[] }) {
  return (
    <section className="container pb-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiles.map((t) => (
          <Link
            key={t.href + t.title}
            href={t.href}
            className="group relative aspect-[4/5] md:aspect-[3/4] overflow-hidden rounded-2xl"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={t.image}
              alt={t.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
            {t.badge && (
              <span className="absolute top-4 left-4 inline-flex items-center rounded-full bg-brand-accent text-white text-xs font-semibold px-3 py-1">
                {t.badge}
              </span>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
              <p className="text-xs uppercase tracking-widest opacity-80">{t.subtitle}</p>
              <h3 className="text-2xl font-semibold mt-1">{t.title}</h3>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium border-b border-white/60 pb-0.5 group-hover:border-white">
                {t.cta} →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
