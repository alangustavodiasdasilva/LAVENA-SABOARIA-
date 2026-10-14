"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Search, SearchX, X } from "lucide-react";
import { ProductCard } from "./product-card";
import { effectivePrice } from "@/lib/pricing";
import { defaultOption, productAvailability, startingPrice } from "@/lib/stock";
import type { ProductDTO } from "@/lib/types";

type Cat = { id: string; name: string; slug: string; count: number };
type Sort = "destaques" | "novidades" | "menor" | "maior" | "nome";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function ShopCatalog({
  products,
  categories,
  initialCategory,
  initialQuery,
}: {
  products: ProductDTO[];
  categories: Cat[];
  initialCategory: string | null;
  initialQuery: string;
}) {
  const [category, setCategory] = useState<string | null>(categories.some((c) => c.slug === initialCategory) ? initialCategory : null);
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState<Sort>("destaques");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const deferredQuery = useDeferredValue(query);

  // mantém o endereço compartilhável sem recarregar a página
  useEffect(() => {
    const url = new URL(window.location.href);
    if (category) url.searchParams.set("categoria", category);
    else url.searchParams.delete("categoria");
    if (deferredQuery.trim()) url.searchParams.set("q", deferredQuery.trim());
    else url.searchParams.delete("q");
    window.history.replaceState(null, "", url.pathname + (url.search || "") + url.hash);
  }, [category, deferredQuery]);

  const visible = useMemo(() => {
    const q = norm(deferredQuery.trim());
    let list = products.filter((p) => {
      if (category && p.category?.slug !== category) return false;
      if (onlyAvailable && productAvailability(p) === "soldout") return false;
      if (q && !norm(`${p.name} ${p.description} ${p.category?.name ?? ""} ${p.size ?? ""}`).includes(q)) return false;
      return true;
    });
    const price = (p: ProductDTO) => (p.variants.length ? startingPrice(p) : effectivePrice(defaultOption(p)));
    const rank = (p: ProductDTO) => (productAvailability(p) === "soldout" ? 1 : 0);
    list = [...list].sort((a, b) => {
      if (sort === "menor") return rank(a) - rank(b) || price(a) - price(b);
      if (sort === "maior") return rank(a) - rank(b) || price(b) - price(a);
      if (sort === "nome") return rank(a) - rank(b) || a.name.localeCompare(b.name, "pt-BR");
      if (sort === "novidades") return rank(a) - rank(b) || b.createdAt.localeCompare(a.createdAt);
      // destaques: favoritos primeiro, esgotados por último
      return rank(a) - rank(b) || Number(b.isFeatured) - Number(a.isFeatured) || b.createdAt.localeCompare(a.createdAt);
    });
    return list;
  }, [products, category, onlyAvailable, deferredQuery, sort]);

  const filtering = !!category || !!query.trim() || onlyAvailable;
  const clear = () => {
    setCategory(null);
    setQuery("");
    setOnlyAvailable(false);
  };

  return (
    <div className="shop">
      <div className="shop-toolbar">
        <div className="shop-search">
          <Search size={18} aria-hidden />
          <input
            type="search"
            className="input"
            placeholder="Buscar produtos, aromas…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Buscar produtos"
            enterKeyHint="search"
          />
          {query && (
            <button type="button" className="shop-search-clear" onClick={() => setQuery("")} aria-label="Limpar busca">
              <X size={16} />
            </button>
          )}
        </div>
        <label className="shop-sort">
          <span className="sr-only">Ordenar por</span>
          <select className="select" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="destaques">Destaques</option>
            <option value="novidades">Novidades</option>
            <option value="menor">Menor preço</option>
            <option value="maior">Maior preço</option>
            <option value="nome">Nome (A–Z)</option>
          </select>
        </label>
      </div>

      <div className="shop-filters">
        <div className="shop-chips" role="group" aria-label="Categorias">
          <button type="button" className="chip" aria-pressed={category === null} onClick={() => setCategory(null)}>
            Todos <span className="count">{products.length}</span>
          </button>
          {categories.map((c) => (
            <button key={c.id} type="button" className="chip" aria-pressed={category === c.slug} onClick={() => setCategory(c.slug)}>
              {c.name} <span className="count">{c.count}</span>
            </button>
          ))}
        </div>
        <label className="check shop-avail">
          <input type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} />
          Só disponíveis
        </label>
      </div>

      <p className="shop-count" aria-live="polite">
        {visible.length} {visible.length === 1 ? "produto" : "produtos"}
        {filtering && (
          <button type="button" className="shop-clear" onClick={clear}>
            Limpar filtros
          </button>
        )}
      </p>

      {visible.length === 0 ? (
        <div className="empty-state">
          <SearchX size={34} strokeWidth={1.3} />
          <h3>Nada por aqui</h3>
          <p>Não encontramos produtos com esses filtros. Tente outra busca ou veja todos os produtos.</p>
          <button type="button" className="btn btn-outline" onClick={clear}>
            Ver todos os produtos
          </button>
        </div>
      ) : (
        <div className="pgrid shop-grid">
          {visible.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 4} />
          ))}
        </div>
      )}
    </div>
  );
}
