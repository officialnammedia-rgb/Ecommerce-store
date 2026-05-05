import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  updateProductAction,
  deleteProductAction,
  updateVariantAction,
  deleteVariantAction,
} from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUploader } from "@/components/admin/ImageUploader";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      images: { orderBy: { position: "asc" } },
      variants: { orderBy: { createdAt: "asc" } },
      collections: { include: { collection: true } },
    },
  });
  if (!product) notFound();

  const collections = await prisma.collection.findMany({ orderBy: { position: "asc" } });
  const selectedColIds = new Set(product.collections.map((c) => c.collectionId));

  const update = updateProductAction.bind(null, product.id);
  const remove = deleteProductAction.bind(null, product.id);

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{product.title}</h1>
        <form action={remove}>
          <Button type="submit" variant="destructive">Delete product</Button>
        </form>
      </div>

      <form action={update} className="mt-6 space-y-6 bg-white border rounded-lg p-5">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Title">
            <Input name="title" defaultValue={product.title} required />
          </Field>
          <Field label="Slug">
            <Input name="slug" defaultValue={product.slug} required />
          </Field>
        </div>
        <Field label="Description">
          <textarea
            name="description"
            rows={5}
            defaultValue={product.description ?? ""}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </Field>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Status">
            <select
              name="status"
              defaultValue={product.status}
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </Field>
          <Field label="Tags">
            <Input name="tags" defaultValue={product.tags ?? ""} />
          </Field>
        </div>
        <Field label="Images" hint="Upload files or paste URLs (one per line).">
          <ImageUploader
            name="imageUrls"
            defaultValue={product.images.map((i) => i.url).join("\n")}
          />
        </Field>
        <Field label="Collections">
          <div className="flex flex-wrap gap-2">
            {collections.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm border rounded-md px-3 py-1.5">
                <input
                  type="checkbox"
                  name="collectionIds"
                  value={c.id}
                  defaultChecked={selectedColIds.has(c.id)}
                />{" "}
                {c.title}
              </label>
            ))}
          </div>
        </Field>
        <div className="pt-2">
          <Button type="submit">Save changes</Button>
        </div>
      </form>

      <div className="mt-8">
        <h2 className="text-xl font-semibold">Variants</h2>
        <div className="mt-3 bg-white border rounded-lg overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-neutral-50 text-neutral-500">
              <tr>
                <th className="px-4 py-3 text-left">SKU</th>
                <th className="px-4 py-3 text-left">Options</th>
                <th className="px-4 py-3 text-right">Price (₹)</th>
                <th className="px-4 py-3 text-right">Compare at (₹)</th>
                <th className="px-4 py-3 text-right">Inventory</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {product.variants.map((v) => {
                const update = updateVariantAction.bind(null, v.id);
                const del = deleteVariantAction.bind(null, v.id);
                const opts = [v.optionValue1, v.optionValue2, v.optionValue3]
                  .filter(Boolean)
                  .join(" / ");
                return (
                  <tr key={v.id}>
                    <td className="px-4 py-3 align-top font-mono text-xs break-all max-w-[220px]">
                      {v.sku}
                    </td>
                    <td className="px-4 py-3 align-top">{opts || "—"}</td>
                    <td className="px-4 py-3" colSpan={4}>
                      <form action={update} className="flex items-center gap-3 justify-end">
                        <input
                          name="priceRupees"
                          type="number"
                          min={0}
                          step="1"
                          defaultValue={v.price / 100}
                          className="w-24 rounded border border-neutral-300 px-2 py-1 text-right"
                        />
                        <input
                          name="compareAtRupees"
                          type="number"
                          min={0}
                          step="1"
                          placeholder="—"
                          defaultValue={v.compareAtPrice ? v.compareAtPrice / 100 : ""}
                          className="w-24 rounded border border-neutral-300 px-2 py-1 text-right"
                        />
                        <input
                          name="inventoryQty"
                          type="number"
                          min={0}
                          defaultValue={v.inventoryQty}
                          className="w-20 rounded border border-neutral-300 px-2 py-1 text-right"
                        />
                        <Button size="sm" type="submit" variant="outline">
                          Save
                        </Button>
                      </form>
                      <form action={del} className="text-right mt-1">
                        <button className="text-red-600 text-xs">Delete variant</button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      {hint && <p className="text-xs text-neutral-500 mb-1">{hint}</p>}
      <div className="mt-1">{children}</div>
    </div>
  );
}
