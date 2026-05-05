import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCollectionAction, deleteCollectionAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminCollectionsPage() {
  const collections = await prisma.collection.findMany({
    orderBy: { position: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <h1 className="text-2xl font-semibold">Collections</h1>
        <div className="mt-4 bg-white border rounded-lg overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead className="bg-neutral-50 text-neutral-500">
              <tr>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">Slug</th>
                <th className="px-4 py-3 text-right">Products</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {collections.map((c) => {
                const del = deleteCollectionAction.bind(null, c.id);
                return (
                  <tr key={c.id}>
                    <td className="px-4 py-3 font-medium">{c.title}</td>
                    <td className="px-4 py-3 text-neutral-600">/{c.slug}</td>
                    <td className="px-4 py-3 text-right">{c._count.products}</td>
                    <td className="px-4 py-3 text-right">
                      <form action={del}>
                        <button className="text-red-600 text-xs">Delete</button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold">New collection</h2>
        <form action={createCollectionAction} className="mt-3 space-y-3 bg-white border rounded-lg p-4">
          <div>
            <label className="text-sm font-medium">Title</label>
            <Input name="title" required />
          </div>
          <div>
            <label className="text-sm font-medium">Slug (optional)</label>
            <Input name="slug" />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea name="description" rows={3} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium">Image URL</label>
            <Input name="imageUrl" placeholder="https://..." />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isFeatured" /> Feature on home
          </label>
          <Button type="submit">Create</Button>
        </form>
      </div>
    </div>
  );
}
