import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { AddressBook, AddressDTO } from "@/components/storefront/AddressBook";

export const dynamic = "force-dynamic";

export default async function AddressesPage() {
  const session = await requireUser();
  const rows = await prisma.address.findMany({
    where: { userId: session.user.id, type: "SHIPPING" },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
  });
  const addresses: AddressDTO[] = rows.map((a) => ({
    id: a.id,
    fullName: a.fullName,
    phone: a.phone,
    line1: a.line1,
    line2: a.line2,
    city: a.city,
    state: a.state,
    postalCode: a.postalCode,
    country: a.country,
    isDefault: a.isDefault,
  }));

  return (
    <div className="container py-10 max-w-2xl">
      <Link href="/account" className="text-sm underline">
        ← Back to account
      </Link>
      <h1 className="mt-3 text-2xl font-semibold">Saved addresses</h1>
      <p className="text-sm text-neutral-600">
        Save addresses to skip typing them at checkout.
      </p>
      <div className="mt-6">
        <AddressBook initialAddresses={addresses} />
      </div>
    </div>
  );
}
