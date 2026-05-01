import { prisma } from "@/lib/prisma";
import { createProductAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUploader } from "@/components/admin/ImageUploader";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const collections = await prisma.collection.findMany({ orderBy: { position: "asc" } });

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold">New product</h1>
      <form action={createProductAction} className="mt-6 space-y-6">
        <Field label="Title" hint="Customer-facing product name.">
          <Input name="title" required />
        </Field>
        <Field label="Slug (optional)" hint="Auto-generated from title if left empty.">
          <Input name="slug" />
        </Field>
        <Field label="Description">
          <textarea
            name="description"
            rows={5}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Status">
          <select
            name="status"
            defaultValue="ACTIVE"
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </Field>
        <Field label="Tags" hint="Comma separated.">
          <Input name="tags" placeholder="cotton, summer" />
        </Field>
        <Field label="Images" hint="Upload files or paste URLs (one per line).">
          <ImageUploader name="imageUrls" />
        </Field>

        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Sizes" hint="Comma separated, e.g., XS, S, M, L">
            <Input name="sizes" placeholder="XS, S, M, L" />
          </Field>
          <Field label="Colors" hint="Comma separated, e.g., Black, White">
            <Input name="colors" placeholder="Black, White" />
          </Field>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Base price (₹)" hint="Applied to every generated variant.">
            <Input name="basePriceRupees" type="number" min={0} required />
          </Field>
          <Field label="Inventory per variant">
            <Input name="inventoryPerVariant" type="number" min={0} defaultValue={10} />
          </Field>
        </div>

        <Field label="Collections">
          <div className="flex flex-wrap gap-2">
            {collections.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm border rounded-md px-3 py-1.5">
                <input type="checkbox" name="collectionIds" value={c.id} /> {c.title}
              </label>
            ))}
          </div>
        </Field>

        <div className="pt-4">
          <Button type="submit">Create product</Button>
        </div>
      </form>
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
