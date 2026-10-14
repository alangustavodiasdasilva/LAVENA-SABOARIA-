import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductForm from "@/components/admin/product-form";
import { PageHeader } from "@/components/admin/ui";
import { requirePageAdmin } from "@/lib/admin-guard";
import { getAdminCategories, getAdminProduct } from "@/lib/admin-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Editar produto" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePageAdmin();
  const { id } = await params;
  const [product, categories] = await Promise.all([getAdminProduct(id).catch(() => null), getAdminCategories()]);
  if (!product) notFound();
  return (
    <>
      <PageHeader back={{ href: "/admin/produtos", label: "Produtos" }} title={product.name} subtitle="Edite as informações e salve." />
      <ProductForm key={product.id + product.createdAt} product={product} categories={categories} />
    </>
  );
}
