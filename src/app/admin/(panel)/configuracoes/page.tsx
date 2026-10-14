import type { Metadata } from "next";
import SettingsForm, { type LinkOption } from "@/components/admin/settings-form";
import { PageHeader } from "@/components/admin/ui";
import { requirePageAdmin } from "@/lib/admin-guard";
import { getAdminKits, getAdminProducts, getAdminSettings } from "@/lib/admin-data";
import { isPasswordWeak } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { SITE_URL } from "@/lib/site";
import { isStorageConfigured } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Configurações" };

export default async function SettingsPage() {
  await requirePageAdmin();
  const [settings, products, kits, weak, dbOk] = await Promise.all([
    getAdminSettings(),
    getAdminProducts(),
    getAdminKits(),
    isPasswordWeak().catch(() => true),
    prisma.$queryRaw`select 1`.then(() => true, () => false),
  ]);

  const linkOptions: LinkOption[] = [
    { label: "Loja (todos os produtos)", href: "/loja" },
    { label: "Monte seu presente", href: "/presente" },
    ...kits.filter((k) => k.isActive).map((k) => ({ label: `Kit: ${k.name}`, href: `/kit/${k.slug}` })),
    ...products.filter((p) => p.isVisible).map((p) => ({ label: `Produto: ${p.name}`, href: `/produto/${p.slug}` })),
  ];

  return (
    <>
      <PageHeader title="Configurações" subtitle="Contato, imagens do topo do site, segurança e estado do sistema." />
      <SettingsForm settings={settings} linkOptions={linkOptions} status={{ database: dbOk, storage: isStorageConfigured(), siteUrl: SITE_URL, passwordCustom: !weak }} />
    </>
  );
}
