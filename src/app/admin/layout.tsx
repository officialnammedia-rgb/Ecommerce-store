import { requireAdmin } from "@/lib/session";
import { AdminSidebar } from "@/components/admin/Sidebar";

export const metadata = {
  title: "Admin",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const storeName = process.env.STORE_NAME ?? "Aurelia";
  return (
    <div className="flex min-h-screen bg-neutral-50">
      <AdminSidebar storeName={storeName} />
      <div className="flex-1 min-w-0">
        <div className="px-8 py-6">{children}</div>
      </div>
    </div>
  );
}
