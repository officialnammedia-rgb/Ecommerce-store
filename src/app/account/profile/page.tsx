import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { ProfileForms } from "@/components/storefront/ProfileForms";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await requireUser();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true },
  });

  return (
    <div className="container py-10 max-w-2xl">
      <Link href="/account" className="text-sm underline">
        ← Back to account
      </Link>
      <h1 className="mt-3 text-2xl font-semibold">Profile & security</h1>
      <p className="text-sm text-neutral-600">
        Manage how you appear and sign in.
      </p>
      <div className="mt-6">
        <ProfileForms initialName={user?.name ?? ""} email={user?.email ?? ""} />
      </div>
    </div>
  );
}
