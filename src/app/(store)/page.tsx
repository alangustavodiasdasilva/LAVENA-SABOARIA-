import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, MessageCircle, Sparkles } from "lucide-react";
import "@/styles/home.css";
import { ContactBand, Faq, GiftsBand, Hero, Lines, Steps, Story, TrustStrip } from "@/components/store/home-sections";
import { KitCard, ProductCard } from "@/components/store/product-card";
import {
  getKitById,
  getProductById,
  getPublicSettings,
  getStoreCategories,
  getStoreKits,
  getStoreProducts,
  safe,
} from "@/lib/data";
import { FALLBACK_SETTINGS, SITE_DESCRIPTION, SITE_TAGLINE } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: `Lavena | Saboaria Artesanal — ${SITE_TAGLINE}` },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

export default async function HomePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;

  // Links antigos do carrossel (?product=ID e ?kit=ID) agora levam à página própria.
  if (typeof sp.product === "string") {
    const { data } = await safe(() => getProductById(sp.product as string), null);
    if (data) redirect(`/produto/${data.slug}`);
  }
  if (typeof sp.kit === "string") {
    const { data } = await safe(() => getKitById(sp.kit as string), null);
    if (data) redirect(`/kit/${data.slug}`);
  }

  const [settingsR, productsR, kitsR, categoriesR] = await Promise.all([
    safe(getPublicSettings, FALLBACK_SETTINGS),
    safe(getStoreProducts, []),
    safe(getStoreKits, []),
    safe(getStoreCategories, []),
  ]);
  const settings = settingsR.data;
  const products = productsR.data;
  const kits = kitsR.data.slice(0, 3);
  const failed = productsR.failed;
  const featured = products.slice(0, 8);

  return (
    <>
      <Hero slides={settings.heroSlides} />
      <TrustStrip />
      <Lines categories={categoriesR.data} />

      <section className="section section-alt" id="produtos">
        <div className="container">
          <div className="featured-head reveal">
            <div className="section-head">
              <span className="eyebrow">{products.some((p) => p.isFeatured) ? "Mais amados" : "Novidades"}</span>
              <h2>
                Para o seu <span className="title-accent">momento</span> de cuidado
              </h2>
            </div>
            {products.length > 0 && (
              <Link href="/loja" className="link-arrow">
                Ver todos os produtos <ArrowRight size={16} />
              </Link>
            )}
          </div>

          {failed ? (
            <div className="empty-state">
              <Sparkles size={34} strokeWidth={1.3} />
              <h3>Nosso catálogo está descansando um instante</h3>
              <p>Não conseguimos carregar os produtos agora. Atualize a página em alguns instantes ou fale com a gente.</p>
              {settings.whatsappNumber && (
                <a className="btn btn-whatsapp" href={`https://wa.me/${settings.whatsappNumber}`} target="_blank" rel="noopener noreferrer">
                  <MessageCircle size={18} /> Chamar no WhatsApp
                </a>
              )}
            </div>
          ) : featured.length === 0 ? (
            <div className="empty-state">
              <Sparkles size={34} strokeWidth={1.3} />
              <h3>Estamos preparando novidades</h3>
              <p>Em breve você encontra aqui os sabonetes, geleias e mousses da Lavena. Volte logo!</p>
            </div>
          ) : (
            <div className="pgrid">
              {featured.map((p, i) => (
                <ProductCard key={p.id} product={p} priority={i < 4} />
              ))}
            </div>
          )}
        </div>
      </section>

      <GiftsBand hasKits={kits.length > 0} />

      {kits.length > 0 && (
        <section className="section" id="kits">
          <div className="container">
            <div className="section-head is-centered reveal">
              <span className="eyebrow is-centered">Kits especiais</span>
              <h2>
                Prontos para <span className="title-accent">presentear</span>
              </h2>
              <p>Combinações pensadas com carinho para você dar (ou se dar) um mimo especial.</p>
            </div>
            <div className="pgrid is-three kits-grid">
              {kits.map((k) => (
                <KitCard
                  key={k.id}
                  kit={k}
                  items={products.filter((p) => k.productIds.includes(p.id)).map((p) => ({ id: p.id, name: p.name }))}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <Story />
      <Steps deliveryInfo={settings.deliveryInfo} />
      <Faq />
      <ContactBand whatsappNumber={settings.whatsappNumber} instagramUrl={settings.instagramUrl} />
    </>
  );
}
