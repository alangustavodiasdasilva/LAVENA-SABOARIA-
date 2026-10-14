import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import ProductList from "@/components/admin/product-list";
import { PageHeader } from "@/components/admin/ui";
import { requirePageAdmin } from "@/lib/admin-guard";
import { getAdminProducts } from "@/lib/admin-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Produtos" };

export default async function ProductsPage() {
  await requirePageAdmin();
  const products = await getAdminProducts();
  return (
    <>
      <PageHeader
        title="Produtos"
        subtitle={`${products.length} ${products.length === 1 ? "produto cadastrado" : "produtos cadastrados"}.`}
        actions={
          <Link href="/admin/produtos/novo" className="btn btn-primary">
            <Plus size={17} /> Novo produto
          </Link>
        }
      />
      <ProductList products={products} />
    </>
  );
}
