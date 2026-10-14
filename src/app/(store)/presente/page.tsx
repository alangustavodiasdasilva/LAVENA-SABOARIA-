import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import "@/styles/product.css";
import "@/styles/cart.css";
import "@/styles/gift.css";
import GiftBuilder from "@/components/store/gift-builder";
import { getPublicSettings, getStoreBags, getStoreCategories, getStoreKits, getStoreProducts, safe } from "@/lib/data";
import { FALLBACK_SETTINGS } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Monte seu presente",
  description: "Escolha kits ou produtos, a embalagem e escreva um cartão. A Lavena prepara o seu presente com carinho.",
  alternates: { canonical: "/presente" },
};

export default async function GiftPage() {
  const [products, kits, bags, categories, settings] = await Promise.all([
    safe(getStoreProducts, []),
    safe(getStoreKits, []),
    safe(getStoreBags, []),
    safe(getStoreCategories, []),
    safe(getPublicSettings, FALLBACK_SETTINGS),
  ]);

  return (
    <div className="container page-top gift-page">
      <header className="page-head">
        <span className="eyebrow">Presentes</span>
        <h1>
          Monte seu <span className="title-accent">presente</span>
        </h1>
        <p>Escolha o que vai dentro, a embalagem e escreva um cartão com carinho. A gente cuida do resto.</p>
      </header>

      {products.failed ? (
        <div className="empty-state">
          <Sparkles size={34} strokeWidth={1.3} />
          <h3>Nosso catálogo está descansando um instante</h3>
          <p>Não conseguimos carregar os produtos agora. Atualize a página em alguns instantes.</p>
        </div>
      ) : products.data.length === 0 && kits.data.length === 0 ? (
        <div className="empty-state">
          <Sparkles size={34} strokeWidth={1.3} />
          <h3>Estamos preparando novidades</h3>
          <p>Em breve você poderá montar o presente perfeito por aqui.</p>
        </div>
      ) : (
        <GiftBuilder products={products.data} kits={kits.data} bags={bags.data} categories={categories.data} whatsappNumber={settings.data.whatsappNumber} />
      )}
    </div>
  );
}
