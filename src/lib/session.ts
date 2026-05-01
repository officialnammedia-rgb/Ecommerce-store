import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions, isAdminRole } from "@/lib/auth";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireUser() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  return session;
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session?.user) redirect("/login?callbackUrl=/admin");
  if (!isAdminRole(session.user.role)) redirect("/");
  return session;
}
