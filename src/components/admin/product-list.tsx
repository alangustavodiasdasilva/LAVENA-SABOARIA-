"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Package, Pencil, Search, Star } from "lucide-react";
import { setProductFlags } from "@/actions/catalog";
import { EmptyBlock, StockBadge } from "@/components/admin/ui";
import { useRun } from "@/components/admin/use-run";
import SmartImage from "@/components/ui/smart-image";
import { formatBRL } from "@/lib/format";
import { effectivePrice, isOnSale } from "@/lib/pricing";
import { startingPrice } from "@/lib/stock";
import type { ProductDTO } from "@/lib/types";

export default function ProductList({ products }: { products: ProductDTO[] }) {
  const { run, busyKey } = useRun();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("ALL");

  const categories = useMemo(() => {
    const m = new Map<string, string>();
    products.forEach((p) => p.category && m.set(p.category.id, p.category.name));
    return [...m.entries()];
  }, [products]);

  const list = products.filter((p) => (cat === "ALL" || p.categoryId === cat) && (!q.trim() || p.name.toLowerCase().includes(q.trim().toLowerCase())));

  if (products.length === 0) {
    return (
      <EmptyBlock
        icon={<Package size={26} />}
        title="Nenhum produto ainda"
        action={
          <Link href="/admin/produtos/novo" className="btn btn-primary">
            Cadastrar o primeiro produto
          </Link>
        }
      >
        Cadastre seus sabonetes, geleias e mousses com foto, preço e descrição.
      </EmptyBlock>
    );
  }

  const toggle = (p: ProductDTO, flag: "isVisible" | "isFeatured") =>
    run(() => setProductFlags(p.id, { [flag]: !p[flag] }), { success: flag === "isVisible" ? (p.isVisible ? "Produto ocultado da loja." : "Produto visível na loja.") : p.isFeatured ? "Removido dos destaques." : "Produto em destaque." }, `${p.id}:${flag}`);

  return (
    <>
      <div className="toolbar">
        <div className="search-field">
          <Search size={17} aria-hidden />
          <input className="input" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar produto" aria-label="Buscar produto" />
        </div>
      </div>
      {categories.length > 1 && (
        <div className="chip-row" role="group" aria-label="Filtrar por categoria">
          <button type="button" className={`chip ${cat === "ALL" ? "is-active" : ""}`} onClick={() => setCat("ALL")}>
            Todas
          </button>
          {categories.map(([id, name]) => (
            <button key={id} type="button" className={`chip ${cat === id ? "is-active" : ""}`} onClick={() => setCat(id)}>
              {name}
            </button>
          ))}
        </div>
      )}

      {list.length === 0 ? (
        <EmptyBlock icon={<Search size={26} />} title="Nenhum produto encontrado">
          Tente outra busca.
        </EmptyBlock>
      ) : (
        <ul className="product-rows">
          {list.map((p) => (
            <li key={p.id} className={`prow card ${p.isVisible ? "" : "is-hidden"}`}>
              <Link href={`/admin/produtos/${p.id}`} className="prow-main">
                <span className="prow-img">
                  <SmartImage src={p.imageUrl || p.images[0]} alt="" fill sizes="72px" style={{ objectFit: "cover" }} />
                </span>
                <span className="prow-info">
                  <strong>{p.name}</strong>
                  <small>
                    {p.category?.name ?? "Sem categoria"}
                    {p.variants.length > 0 ? ` · ${p.variants.length + 1} opções` : ""}
                  </small>
                  <span className="prow-meta">
                    <b>
                      {p.variants.length > 0 ? "a partir de " : ""}
                      {formatBRL(p.variants.length > 0 ? startingPrice(p) : effectivePrice(p))}
                    </b>
                    {isOnSale(p) && p.variants.length === 0 && <span className="badge badge-sale">Promoção</span>}
                    <StockBadge status={p.stockStatus} />
                    {!p.isVisible && <span className="badge badge-dark">Oculto</span>}
                  </span>
                </span>
              </Link>
              <div className="prow-actions">
                <button type="button" className={`btn btn-ghost btn-icon ${p.isFeatured ? "is-on" : ""}`} onClick={() => toggle(p, "isFeatured")} disabled={busyKey === `${p.id}:isFeatured`} aria-pressed={p.isFeatured} aria-label={p.isFeatured ? "Remover dos destaques" : "Destacar na página inicial"} title="Destaque">
                  <Star size={18} fill={p.isFeatured ? "currentColor" : "none"} />
                </button>
                <button type="button" className="btn btn-ghost btn-icon" onClick={() => toggle(p, "isVisible")} disabled={busyKey === `${p.id}:isVisible`} aria-label={p.isVisible ? "Ocultar da loja" : "Mostrar na loja"} title={p.isVisible ? "Ocultar da loja" : "Mostrar na loja"}>
                  {p.isVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
                <Link href={`/admin/produtos/${p.id}`} className="btn btn-outline btn-sm">
                  <Pencil size={14} /> Editar
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
