import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/admin-shell";
import { countNewOrders } from "@/lib/admin-data";
import { isAdmin, isPasswordWeak } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect("/admin/login");
  const [newOrders, weak] = await Promise.all([countNewOrders().catch(() => 0), isPasswordWeak().catch(() => false)]);
  return (
    <AdminShell newOrders={newOrders} weakPassword={weak}>
      {children}
    </AdminShell>
  );
}
