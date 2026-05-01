import Link from "next/link";

export function LookbookStrip() {
  return (
    <section className="container py-12">
      <div className="grid md:grid-cols-2 gap-4 rounded-2xl overflow-hidden">
        <div className="relative aspect-[4/5] md:aspect-auto md:h-[480px] overflow-hidden group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1400"
            alt="Editor's pick"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent" />
          <div className="absolute inset-y-0 left-0 flex items-center p-8 md:p-12 text-white max-w-md">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-white/70">The Edit</p>
              <h3 className="mt-3 text-3xl md:text-4xl font-semibold leading-tight">
                Wardrobe essentials that work harder
              </h3>
              <p className="mt-3 text-white/85 text-sm">
                Considered cuts, breathable fabrics, made to mix and match.
              </p>
              <Link
                href="/collections/all"
                className="mt-6 inline-flex items-center rounded-full bg-white text-neutral-900 px-5 py-2.5 text-sm font-semibold hover:bg-neutral-100"
              >
                Shop the edit
              </Link>
            </div>
          </div>
        </div>
        <div className="grid grid-rows-2 gap-4">
          <div className="relative overflow-hidden rounded-2xl group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1485231183945-fffde7cc051e?w=1200"
              alt="Festive ready"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 text-white">
              <p className="text-xs uppercase tracking-widest opacity-80">Festive ready</p>
              <h4 className="text-2xl font-semibold mt-1">Statement pieces</h4>
              <Link href="/collections/women" className="text-sm underline mt-1 inline-block">
                Shop women →
              </Link>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200"
              alt="For him"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 text-white">
              <p className="text-xs uppercase tracking-widest opacity-80">Sharp & easy</p>
              <h4 className="text-2xl font-semibold mt-1">Men&apos;s drops</h4>
              <Link href="/collections/men" className="text-sm underline mt-1 inline-block">
                Shop men →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
