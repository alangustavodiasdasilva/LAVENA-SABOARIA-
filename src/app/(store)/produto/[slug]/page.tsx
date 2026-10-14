import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "@/styles/product.css";
import { ProductDetail } from "@/components/store/product-detail";
import { ProductCard } from "@/components/store/product-card";
import { getProductBySlug, getPublicSettings, getStoreProducts, safe } from "@/lib/data";
import { effectivePrice } from "@/lib/pricing";
import { defaultOption, productAvailability, productOptions } from "@/lib/stock";
import { FALLBACK_SETTINGS, absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

function firstImage(images: (string | null | undefined)[]): string | undefined {
  const img = images.find((i): i is string => !!i && !i.startsWith("data:"));
  return img ? absoluteUrl(img) : undefined;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const { data: p } = await safe(() => getProductBySlug(slug), null);
  if (!p) return { title: "Produto não encontrado" };
  const description = (p.description || "").replace(/\s+/g, " ").slice(0, 155);
  const image = firstImage([p.imageUrl, ...p.images]);
  return {
    title: p.name,
    description,
    alternates: { canonical: `/produto/${p.slug}` },
    openGraph: { title: p.name, description, type: "website", url: `/produto/${p.slug}`, ...(image ? { images: [{ url: image }] } : {}) },
    twitter: { card: "summary_large_image", title: p.name, description, ...(image ? { images: [image] } : {}) },
  };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const [productR, settingsR] = await Promise.all([safe(() => getProductBySlug(slug), null), safe(getPublicSettings, FALLBACK_SETTINGS)]);
  const product = productR.data;
  if (productR.failed) throw new Error("Falha ao carregar o produto");
  if (!product) notFound();

  const all = (await safe(getStoreProducts, [])).data;
  const sameCat = all.filter((p) => p.id !== product.id && p.categoryId === product.categoryId);
  const others = all.filter((p) => p.id !== product.id && p.categoryId !== product.categoryId);
  const related = [...sameCat, ...others].slice(0, 4);

  const url = absoluteUrl(`/produto/${product.slug}`);
  const options = productOptions(product);
  const availability = productAvailability(product);
  const base = defaultOption(product);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.id,
    brand: { "@type": "Brand", name: "Lavena" },
    ...(firstImage([product.imageUrl, ...product.images]) ? { image: [firstImage([product.imageUrl, ...product.images])] } : {}),
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "BRL",
      lowPrice: Math.min(...options.map((o) => effectivePrice(o))).toFixed(2),
      highPrice: Math.max(...options.map((o) => effectivePrice(o))).toFixed(2),
      offerCount: options.length,
      url,
      availability: availability === "soldout" ? "https://schema.org/OutOfStock" : availability === "reserve" ? "https://schema.org/PreOrder" : "https://schema.org/InStock",
      price: effectivePrice(base).toFixed(2),
    },
  };

  return (
    <div className="container page-top">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav aria-label="Você está em">
        <ol className="crumbs">
          <li>
            <Link href="/">Início</Link>
          </li>
          <li>
            <Link href="/loja">Loja</Link>
          </li>
          {product.category && (
            <li>
              <Link href={`/loja?categoria=${product.category.slug}`}>{product.category.name}</Link>
            </li>
          )}
          <li aria-current="page">{product.name}</li>
        </ol>
      </nav>

      <ProductDetail product={product} url={url} whatsappNumber={settingsR.data.whatsappNumber} deliveryInfo={settingsR.data.deliveryInfo} />

      {related.length > 0 && (
        <section className="related" aria-labelledby="rel-title">
          <h2 id="rel-title">
            Você também pode <span className="title-accent">gostar</span>
          </h2>
          <div className="pgrid">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
