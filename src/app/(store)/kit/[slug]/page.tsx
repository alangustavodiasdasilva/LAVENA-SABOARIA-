import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "@/styles/product.css";
import { KitDetail } from "@/components/store/product-detail";
import { getKitBySlug, getPublicSettings, getStoreProducts, safe } from "@/lib/data";
import { FALLBACK_SETTINGS, absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const { data: k } = await safe(() => getKitBySlug(slug), null);
  if (!k) return { title: "Kit não encontrado" };
  const description = (k.description || "Kit especial Lavena, pensado com carinho para presentear.").slice(0, 155);
  const img = [k.imageUrl, ...k.images].find((i): i is string => !!i && !i.startsWith("data:"));
  return {
    title: `Kit ${k.name}`,
    description,
    alternates: { canonical: `/kit/${k.slug}` },
    openGraph: { title: `Kit ${k.name}`, description, ...(img ? { images: [{ url: absoluteUrl(img) }] } : {}) },
  };
}

export default async function KitPage({ params }: Params) {
  const { slug } = await params;
  const [kitR, settingsR, productsR] = await Promise.all([
    safe(() => getKitBySlug(slug), null),
    safe(getPublicSettings, FALLBACK_SETTINGS),
    safe(getStoreProducts, []),
  ]);
  if (kitR.failed) throw new Error("Falha ao carregar o kit");
  const kit = kitR.data;
  if (!kit) notFound();
  const items = productsR.data.filter((p) => kit.productIds.includes(p.id));

  return (
    <div className="container page-top">
      <nav aria-label="Você está em">
        <ol className="crumbs">
          <li>
            <Link href="/">Início</Link>
          </li>
          <li>
            <Link href="/presente">Presentes</Link>
          </li>
          <li aria-current="page">Kit {kit.name}</li>
        </ol>
      </nav>
      <KitDetail kit={kit} items={items} url={absoluteUrl(`/kit/${kit.slug}`)} whatsappNumber={settingsR.data.whatsappNumber} />
    </div>
  );
}
