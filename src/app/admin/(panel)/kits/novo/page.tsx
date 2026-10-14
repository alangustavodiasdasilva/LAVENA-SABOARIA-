import type { Metadata } from "next";
import KitForm from "@/components/admin/kit-form";
import { PageHeader } from "@/components/admin/ui";
import { requirePageAdmin } from "@/lib/admin-guard";
import { getAdminProducts } from "@/lib/admin-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Novo kit" };

export default async function NewKitPage() {
  await requirePageAdmin();
  const products = await getAdminProducts();
  return (
    <>
      <PageHeader back={{ href: "/admin/kits", label: "Kits" }} title="Novo kit" />
      <KitForm products={products} />
    </>
  );
}
