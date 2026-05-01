import Link from "next/link";

export function AuthLayout({
  children,
  imageUrl,
  imageAlt,
  eyebrow,
  headline,
  subhead,
}: {
  children: React.ReactNode;
  imageUrl: string;
  imageAlt: string;
  eyebrow: string;
  headline: string;
  subhead: string;
}) {
  return (
    <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-2">
      {/* Visual side */}
      <div className="relative hidden lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={imageAlt} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-tr from-black/70 via-black/30 to-transparent" />
        <div className="absolute inset-0 p-12 flex flex-col justify-end text-white">
          <Link href="/" className="text-2xl font-bold tracking-tight self-start">
            Aurelia
          </Link>
          <div className="mt-auto max-w-md">
            <p className="text-xs uppercase tracking-[0.25em] text-white/70">{eyebrow}</p>
            <h2 className="mt-3 text-3xl xl:text-4xl font-semibold leading-tight">
              {headline}
            </h2>
            <p className="mt-3 text-white/85 text-sm">{subhead}</p>
          </div>
        </div>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center p-6 md:p-12 bg-white">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
