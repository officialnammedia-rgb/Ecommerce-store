import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatINR } from "@/lib/utils";
import {
  createDiscountAction,
  deleteDiscountAction,
  toggleDiscountAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminDiscountsPage() {
  const discounts = await prisma.discount.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <h1 className="text-2xl font-semibold">Discounts</h1>
        <div className="mt-4 bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-500">
              <tr>
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-right">Value</th>
                <th className="px-4 py-3 text-right">Min subtotal</th>
                <th className="px-4 py-3 text-right">Used</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {discounts.map((d) => {
                const toggle = toggleDiscountAction.bind(null, d.id);
                const del = deleteDiscountAction.bind(null, d.id);
                return (
                  <tr key={d.id}>
                    <td className="px-4 py-3 font-mono">{d.code}</td>
                    <td className="px-4 py-3">{d.type}</td>
                    <td className="px-4 py-3 text-right">
                      {d.type === "PERCENT" ? `${d.value}%` : formatINR(d.value)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {d.minSubtotal > 0 ? formatINR(d.minSubtotal) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {d.usedCount}
                      {d.usageLimit ? ` / ${d.usageLimit}` : ""}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <form action={toggle} className="inline">
                        <button className="text-xs underline">
                          {d.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </form>
                      <form action={del} className="inline">
                        <button className="text-xs text-red-600">Delete</button>
                      </form>
                    </td>
                  </tr>
                );
              })}
              {discounts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-neutral-500">
                    No discounts yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold">New discount</h2>
        <form action={createDiscountAction} className="mt-3 space-y-3 bg-white border rounded-lg p-4">
          <div>
            <label className="text-sm font-medium">Code</label>
            <Input name="code" required placeholder="WELCOME10" />
          </div>
          <div>
            <label className="text-sm font-medium">Type</label>
            <select
              name="type"
              defaultValue="PERCENT"
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm w-full"
            >
              <option value="PERCENT">Percent off</option>
              <option value="FIXED">Fixed amount (₹)</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Value</label>
            <Input name="value" type="number" min={1} required />
            <p className="text-xs text-neutral-500 mt-1">
              For PERCENT use 1-100. For FIXED use rupees.
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">Min subtotal (₹)</label>
            <Input name="minSubtotal" type="number" min={0} defaultValue={0} />
          </div>
          <div>
            <label className="text-sm font-medium">Usage limit (optional)</label>
            <Input name="usageLimit" type="number" min={1} placeholder="—" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isActive" defaultChecked /> Active
          </label>
          <Button type="submit">Create</Button>
        </form>
      </div>
    </div>
  );
}
