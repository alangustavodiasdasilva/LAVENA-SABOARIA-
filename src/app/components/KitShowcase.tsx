"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Gift, X, ShoppingBag, Star } from "lucide-react";
import { useCart } from "./CartContext";

type Product = {
  id: string;
  name: string;
  benefits?: string | null;
  ingredients?: string | null;
  description: string;
  imageUrl?: string | null;
  category?: { id: string; name: string } | null;
};

type Kit = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  salePrice?: number | null;
  imageUrl?: string | null;
  productIds: string[];
  isActive: boolean;
  isFeatured: boolean;
  stockStatus?: string;
};

function effectivePrice(k: Kit) {
  if (k.salePrice && k.salePrice > 0 && k.salePrice < k.price) return k.salePrice;
  return k.price;
}

function discountPct(k: Kit) {
  if (!k.salePrice || k.salePrice <= 0 || k.salePrice >= k.price) return 0;
  return Math.round(((k.price - k.salePrice) / k.price) * 100);
}

function isPurchasable(k: Kit) {
  return (k.stockStatus || "IN_STOCK") === "IN_STOCK";
}

function formatBRL(value: number) {
  return value.toFixed(2).replace(".", ",");
}

export default function KitShowcase({
  kits,
  products,
}: {
  kits: Kit[];
  products: Product[];
}) {
  const { addToCart } = useCart();
  const [selected, setSelected] = useState<Kit | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const active = kits.filter((k) => k.isActive);

  // Auto open modal from URL query parameter (?kit=ID)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const kitId = params.get("kit");
      if (kitId) {
        const found = kits.find((k) => k.id === kitId);
        if (found) setSelected(found);
      }
    }
  }, [kits]);

  useEffect(() => {
    if (!selected) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => {
      html.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [selected]);

  if (active.length === 0) return null;

  const productsOf = (k: Kit) => products.filter((p) => k.productIds.includes(p.id));

  const handleAdd = (k: Kit, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isPurchasable(k)) return;
    addToCart({
      id: `kit-${k.id}`,
      name: `Kit ${k.name}`,
      price: effectivePrice(k),
      imageUrl: k.imageUrl || "",
    });
  };

  return (
    <section id="kits" className="kit-showcase">
      <div className="container">
        <div className="section-header">
          <p className="section-label">Kits Especiais</p>
          <h2 className="section-title">Pronto para presentear</h2>
          <p className="section-subtitle">
            Combinações pensadas com carinho pra você dar (ou se dar) um mimo especial.
          </p>
        </div>

        <div className="kit-grid">
          {active.map((kit) => {
            const items = productsOf(kit);
            const pct = discountPct(kit);
            const hasSale = pct > 0;
            const purchasable = isPurchasable(kit);
            return (
              <article
                key={kit.id}
                className={`kit-card ${!purchasable ? "is-unavailable" : ""}`}
                onClick={() => setSelected(kit)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setSelected(kit)}
              >
                <div className="kit-card-image">
                  {kit.imageUrl ? (
                    <Image
                      src={kit.imageUrl}
                      alt={kit.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                      unoptimized={kit.imageUrl?.startsWith("data:")}
                    />
                  ) : (
                    <div className="product-image-placeholder">Sem imagem</div>
                  )}
                  <div className="product-badges">
                    {hasSale && <span className="product-badge sale">-{pct}%</span>}
                    {kit.isFeatured && (
                      <span className="product-badge gold">
                        <Star size={11} fill="currentColor" /> Destaque
                      </span>
                    )}
                  </div>
                  <span className="kit-card-tag">
                    <Gift size={12} /> KIT
                  </span>
                </div>
                <div className="kit-card-body">
                  <h3 className="kit-card-title">{kit.name}</h3>
                  <small className="text-muted kit-card-items">
                    {items.length} {items.length === 1 ? "item" : "itens"}: {items.slice(0, 3).map((i) => i.name).join(", ")}
                    {items.length > 3 ? ` +${items.length - 3}` : ""}
                  </small>
                  {kit.description && (
                    <p className="kit-card-desc">{kit.description}</p>
                  )}
                  <div className="kit-card-footer">
                    <div className="product-price-wrap">
                      {hasSale && (
                        <span className="product-price-original">
                          R$ {formatBRL(kit.price)}
                        </span>
                      )}
                      <span className="product-price">
                        <span className="product-price-currency">R$ </span>
                        {formatBRL(effectivePrice(kit))}
                      </span>
                    </div>
                    <button
                      className="btn-add-cart"
                      onClick={(e) => handleAdd(kit, e)}
                      aria-label={`Adicionar ${kit.name} ao carrinho`}
                      disabled={!purchasable}
                    >
                      <ShoppingBag size={16} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {selected && (() => {
        const items = productsOf(selected);
        const pct = discountPct(selected);
        const hasSale = pct > 0;
        return (
          <div
            className="product-sheet-overlay"
            onClick={() => setSelected(null)}
            role="dialog"
            aria-modal="true"
            aria-label={selected.name}
          >
            <div className="product-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="product-sheet-handle" aria-hidden />
              <button
                ref={closeRef}
                className="product-sheet-close"
                onClick={() => setSelected(null)}
                aria-label="Fechar"
              >
                <X size={22} />
              </button>

              <div className="product-sheet-image">
                {selected.imageUrl ? (
                  <Image
                    src={selected.imageUrl}
                    alt={selected.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                    unoptimized={selected.imageUrl?.startsWith("data:")}
                  />
                ) : (
                  <div className="product-image-placeholder">Sem imagem</div>
                )}
                <div className="product-badges">
                  {hasSale && <span className="product-badge sale">-{pct}%</span>}
                </div>
              </div>

              <div className="product-sheet-info">
                <span className="product-category-label" style={{ color: "var(--color-gold)" }}>
                  <Gift size={11} style={{ display: "inline", verticalAlign: "middle" }} /> KIT
                </span>
                <h2 className="product-sheet-title">{selected.name}</h2>
                <div className="product-sheet-price-wrap">
                  {hasSale && (
                    <span className="product-sheet-price-original">
                      R$ {formatBRL(selected.price)}
                    </span>
                  )}
                  <span className="product-sheet-price">
                    R$ {formatBRL(effectivePrice(selected))}
                  </span>
                </div>

                <div className="product-sheet-scroll">
                  {selected.description && (
                    <p className="product-sheet-desc">{selected.description}</p>
                  )}

                  <section className="product-sheet-section">
                    <h4>Esse kit inclui</h4>
                    <ul className="kit-detail-items">
                      {items.map((p) => (
                        <li key={p.id}>
                          <strong>{p.name}</strong>
                          {p.description && <small>{p.description}</small>}
                        </li>
                      ))}
                    </ul>
                  </section>

                  {/* Benefícios agregados */}
                  {items.some((p) => p.benefits) && (
                    <section className="product-sheet-section">
                      <h4>Benefícios</h4>
                      <p style={{ whiteSpace: "pre-line" }}>
                        {items
                          .filter((p) => p.benefits)
                          .map((p) => `• ${p.name}: ${p.benefits}`)
                          .join("\n\n")}
                      </p>
                    </section>
                  )}

                  {/* Ingredientes agregados */}
                  {items.some((p) => p.ingredients) && (
                    <section className="product-sheet-section">
                      <h4>Ingredientes</h4>
                      <p style={{ whiteSpace: "pre-line" }}>
                        {items
                          .filter((p) => p.ingredients)
                          .map((p) => `• ${p.name}: ${p.ingredients}`)
                          .join("\n\n")}
                      </p>
                    </section>
                  )}
                </div>

                <div className="product-sheet-cta">
                  <button
                    className="btn btn-primary w-full"
                    onClick={() => {
                      handleAdd(selected);
                      setSelected(null);
                    }}
                  >
                    <ShoppingBag size={18} /> Adicionar Kit ao Carrinho
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </section>
  );
}
