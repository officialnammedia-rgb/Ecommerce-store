import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container py-24 text-center max-w-md mx-auto">
      <p className="text-xs uppercase tracking-[0.25em] text-brand-accent">404 · Not found</p>
      <h1 className="mt-3 text-4xl md:text-5xl font-semibold leading-tight">
        We couldn&apos;t find that page.
      </h1>
      <p className="mt-3 text-neutral-600">
        The link may be broken, or the product/collection might no longer exist.
      </p>
      <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full bg-neutral-900 text-white px-6 py-3 text-sm font-semibold hover:bg-neutral-800"
        >
          Back to home
        </Link>
        <Link
          href="/collections/all"
          className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-6 py-3 text-sm font-semibold hover:bg-neutral-50"
        >
          Shop all
        </Link>
      </div>
    </div>
  );
}
