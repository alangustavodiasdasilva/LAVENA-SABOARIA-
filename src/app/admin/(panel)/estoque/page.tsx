import type { Metadata } from "next";
import StockManager from "@/components/admin/stock-manager";
import { PageHeader } from "@/components/admin/ui";
import { requirePageAdmin } from "@/lib/admin-guard";
import { getAdminProducts } from "@/lib/admin-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Estoque" };

export default async function StockPage() {
  await requirePageAdmin();
  const products = await getAdminProducts();
  return (
    <>
      <PageHeader title="Estoque" subtitle="Ajuste quantidades e disponibilidade rapidamente, sem abrir cada produto." />
      <StockManager products={products} />
    </>
  );
}
