import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import "@/styles/product.css";
import ShopCatalog from "@/components/store/shop-catalog";
import { getStoreCategories, getStoreProducts, safe } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Loja",
  description: "Sabonetes glicerinados, sabonetes líquidos, geleias e mousses de banho artesanais da Lavena.",
  alternates: { canonical: "/loja" },
};

export default async function ShopPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const [productsR, categoriesR] = await Promise.all([safe(getStoreProducts, []), safe(getStoreCategories, [])]);
  const cat = typeof sp.categoria === "string" ? sp.categoria : null;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 80) : "";

  return (
    <div className="container page-top">
      <header className="page-head">
        <span className="eyebrow">Loja</span>
        <h1>
          Nossos <span className="title-accent">produtos</span>
        </h1>
        <p>Feitos à mão, com ingredientes selecionados e aromas delicados. Escolha o seu momento de cuidado.</p>
      </header>

      {productsR.failed ? (
        <div className="empty-state">
          <Sparkles size={34} strokeWidth={1.3} />
          <h3>Nosso catálogo está descansando um instante</h3>
          <p>Não conseguimos carregar os produtos agora. Atualize a página em alguns instantes.</p>
        </div>
      ) : productsR.data.length === 0 ? (
        <div className="empty-state">
          <Sparkles size={34} strokeWidth={1.3} />
          <h3>Estamos preparando novidades</h3>
          <p>Em breve você encontra aqui os produtos da Lavena. Volte logo!</p>
        </div>
      ) : (
        <ShopCatalog products={productsR.data} categories={categoriesR.data} initialCategory={cat} initialQuery={q} />
      )}
    </div>
  );
}
