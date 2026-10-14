import type { Metadata } from "next";
import BagManager from "@/components/admin/bag-manager";
import { PageHeader } from "@/components/admin/ui";
import { requirePageAdmin } from "@/lib/admin-guard";
import { getAdminBags } from "@/lib/admin-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sacolas de presente" };

export default async function BagsPage() {
  await requirePageAdmin();
  const bags = await getAdminBags();
  return (
    <>
      <PageHeader title="Sacolas de presente" subtitle="Embalagens oferecidas no “Monte seu presente”. Só o preço de venda aparece para o cliente." />
      <BagManager bags={bags} />
    </>
  );
}
