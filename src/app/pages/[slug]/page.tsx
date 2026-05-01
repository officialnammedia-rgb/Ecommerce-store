import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function StaticPage({ params }: { params: { slug: string } }) {
  const page = await prisma.page.findUnique({ where: { slug: params.slug } });
  if (!page || !page.isPublished) notFound();
  return (
    <div className="container py-12 max-w-3xl">
      <h1 className="text-3xl font-semibold">{page.title}</h1>
      <div className="mt-6 prose max-w-none whitespace-pre-line text-neutral-700">
        {page.body}
      </div>
    </div>
  );
}
