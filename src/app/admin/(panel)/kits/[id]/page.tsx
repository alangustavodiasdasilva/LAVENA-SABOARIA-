import type { Metadata } from "next";
import { notFound } from "next/navigation";
import KitForm from "@/components/admin/kit-form";
import { PageHeader } from "@/components/admin/ui";
import { requirePageAdmin } from "@/lib/admin-guard";
import { getAdminKit, getAdminProducts } from "@/lib/admin-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Editar kit" };

export default async function EditKitPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePageAdmin();
  const { id } = await params;
  const [kit, products] = await Promise.all([getAdminKit(id).catch(() => null), getAdminProducts()]);
  if (!kit) notFound();
  return (
    <>
      <PageHeader back={{ href: "/admin/kits", label: "Kits" }} title={kit.name} />
      <KitForm key={kit.id} kit={kit} products={products} />
    </>
  );
}
