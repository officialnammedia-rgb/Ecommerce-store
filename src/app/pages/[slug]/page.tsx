import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

// Legal + content pages barely change. Cache them for an hour; admin edits
// show up after at most 60 min (or an explicit redeploy).
export const revalidate = 3600;

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
