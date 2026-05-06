import { requireAdmin } from "@/lib/session";
import { AdminSidebar } from "@/components/admin/Sidebar";

export const metadata = {
  title: "Admin",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const storeName = process.env.STORE_NAME ?? "Ascendyl";
  return (
    <div className="flex min-h-screen bg-neutral-50 md:flex-row flex-col">
      <AdminSidebar storeName={storeName} />
      <div className="flex-1 min-w-0">
        <div className="px-4 py-4 md:px-8 md:py-6">{children}</div>
      </div>
    </div>
  );
}
