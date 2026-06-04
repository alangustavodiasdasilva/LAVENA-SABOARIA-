"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { useCart } from "./CartContext";
import Carousel from "./Carousel";
import { Star, X, ShoppingBag } from "lucide-react";

type StockStatus = "IN_STOCK" | "IN_PRODUCTION" | "OUT_OF_STOCK";

type Product = {
  id: string;
  name: string;
  description: string;
  benefits?: string | null;
  ingredients?: string | null;
  price: number;
  salePrice?: number | null;
  size?: string | null;
  imageUrl?: string | null;
  images?: string[];
  categoryId: string;
  isFeatured?: boolean;
  stockStatus?: string;
  category?: { id: string; name: string } | null;
};

type Category = { id: string; name: string };

function gallery(p: Product): string[] {
  const set = new Set<string>();
  if (p.imageUrl) set.add(p.imageUrl);
  (p.images || []).forEach((s) => s && set.add(s));
  return Array.from(set);
}

function effectivePrice(p: Product) {
  if (p.salePrice && p.salePrice > 0 && p.salePrice < p.price) return p.salePrice;
  return p.price;
}

function discountPct(p: Product) {
  if (!p.salePrice || p.salePrice <= 0 || p.salePrice >= p.price) return 0;
  return Math.round(((p.price - p.salePrice) / p.price) * 100);
}

function isPurchasable(p: Product) {
  return (p.stockStatus || "IN_STOCK") === "IN_STOCK";
}

function statusLabel(s: string): { label: string; tone: string } | null {
  if (s === "IN_PRODUCTION") return { label: "Em produção", tone: "warn" };
  if (s === "OUT_OF_STOCK") return { label: "Esgotado", tone: "danger" };
  return null;
}

function formatBRL(value: number) {
  return value.toFixed(2).replace(".", ",");
}

export default function ProductGrid({
  products,
  categories = [],
}: {
  products: Product[];
  categories?: Category[];
}) {
  const { addToCart } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      return selectedCategory ? p.categoryId === selectedCategory : true;
    });
  }, [products, selectedCategory]);

  const handleAddToCart = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isPurchasable(product)) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: effectivePrice(product),
      imageUrl: product.imageUrl || product.images?.[0] || "",
    });
  };

  // Auto open modal from URL query parameter (?product=ID)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const prodId = params.get("product");
      if (prodId) {
        const found = products.find((p) => p.id === prodId);
        if (found) {
          setSelectedProduct(found);
        }
      }
    }
  }, [products]);

  // Modal: lock scroll sem piscada (scrollbar-gutter no html)
  useEffect(() => {
    if (!selectedProduct) return;
    const html = document.documentElement;
    const previousOverflow = html.style.overflow;
    html.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedProduct(null);
    };
    window.addEventListener("keydown", onKey);
    closeBtnRef.current?.focus();
    return () => {
      html.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [selectedProduct]);

  return (
    <>
      <div style={{ textAlign: "center", marginBottom: "16px" }}>
        <p className="section-label">Produtos</p>
      </div>
      {/* Categorias */}
      {categories.length > 0 && (
        <div className="categories-strip">
          <div className="categories-scroll">
            <button
              className={`category-chip ${selectedCategory === null ? "active" : ""}`}
              onClick={() => setSelectedCategory(null)}
              aria-pressed={selectedCategory === null ? "true" : "false"}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`category-chip ${selectedCategory === cat.id ? "active" : ""}`}
                onClick={() => setSelectedCategory(cat.id)}
                aria-pressed={selectedCategory === cat.id ? "true" : "false"}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {filteredProducts.length === 0 ? (
        <div className="empty-state">
          <p>Nenhum produto encontrado.</p>
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map((product) => {
            const pct = discountPct(product);
            const isSale = pct > 0;
            const status = statusLabel(product.stockStatus || "IN_STOCK");
            const purchasable = isPurchasable(product);
            const cardImages = gallery(product);
            const mainImg = cardImages[0];
            return (
              <article
                key={product.id}
                className={`product-card ${!purchasable ? "is-unavailable" : ""}`}
                onClick={() => setSelectedProduct(product)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setSelectedProduct(product);
                }}
              >
                <div className="product-image-wrap">
                  {cardImages.length > 1 ? (
                    <Carousel
                      images={cardImages}
                      alt={product.name}
                      autoPlay
                      intervalMs={3500}
                      sizes="(max-width: 480px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      showArrows={false}
                      showDots={false}
                    />
                  ) : mainImg ? (
                    <Image
                      src={mainImg}
                      alt={product.name}
                      fill
                      sizes="(max-width: 480px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover"
                      unoptimized={mainImg?.startsWith("data:")}
                    />
                  ) : (
                    <div className="product-image-placeholder">Sem imagem</div>
                  )}

                  {/* Badges sobre a imagem */}
                  <div className="product-badges">
                    {isSale && <span className="product-badge sale">-{pct}%</span>}
                    {product.isFeatured && (
                      <span className="product-badge gold">
                        <Star size={11} fill="currentColor" /> Destaque
                      </span>
                    )}
                  </div>

                  {status && (
                    <div className={`product-status product-status-${status.tone}`}>
                      {status.label}
                    </div>
                  )}
                </div>
                <div className="product-body">
                  <span className="product-category-label">
                    {product.category?.name || "Sem Categoria"}
                  </span>
                  <h3 className="product-name">{product.name}</h3>
                  {product.size && <span className="product-size">{product.size}</span>}
                  <p className="product-desc">{product.description}</p>
                  <div className="product-footer">
                    <div className="product-price-wrap">
                      {isSale && (
                        <span className="product-price-original">
                          R$ {formatBRL(product.price)}
                        </span>
                      )}
                      <span className="product-price">
                        <span className="product-price-currency">R$ </span>
                        {formatBRL(effectivePrice(product))}
                      </span>
                    </div>
                    <button
                      className="btn-add-cart"
                      onClick={(e) => handleAddToCart(product, e)}
                      aria-label={
                        purchasable
                          ? `Adicionar ${product.name} ao carrinho`
                          : `${product.name} indisponível`
                      }
                      disabled={!purchasable}
                      title={!purchasable ? "Indisponível no momento" : undefined}
                    >
                      <ShoppingBag size={16} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Bottom sheet / Modal */}
      {selectedProduct && (() => {
        const imgs = gallery(selectedProduct);
        const pct = discountPct(selectedProduct);
        const isSale = pct > 0;
        const status = statusLabel(selectedProduct.stockStatus || "IN_STOCK");
        const purchasable = isPurchasable(selectedProduct);
        return (
          <div
            className="product-sheet-overlay"
            onClick={() => setSelectedProduct(null)}
            role="dialog"
            aria-modal="true"
            aria-label={selectedProduct.name}
          >
            <div className="product-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="product-sheet-handle" aria-hidden />
              <button
                ref={closeBtnRef}
                className="product-sheet-close"
                onClick={() => setSelectedProduct(null)}
                aria-label="Fechar"
              >
                <X size={22} />
              </button>

              <div className="product-sheet-image">
                {imgs.length === 0 ? (
                  <div className="product-image-placeholder">Sem imagem</div>
                ) : imgs.length === 1 ? (
                  <Image
                    src={imgs[0]}
                    alt={selectedProduct.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                    unoptimized={imgs[0]?.startsWith("data:")}
                  />
                ) : (
                  <Carousel
                    images={imgs}
                    alt={selectedProduct.name}
                    autoPlay
                    intervalMs={4000}
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                )}
                <div className="product-badges">
                  {isSale && <span className="product-badge sale">-{pct}%</span>}
                </div>
                {status && (
                  <div className={`product-status product-status-${status.tone}`}>
                    {status.label}
                  </div>
                )}
              </div>

              <div className="product-sheet-info">
                <span className="product-category-label">
                  {selectedProduct.category?.name || "Sem Categoria"}
                </span>
                <h2 className="product-sheet-title">{selectedProduct.name}</h2>
                {selectedProduct.size && (
                  <span className="product-sheet-size">{selectedProduct.size}</span>
                )}
                <div className="product-sheet-price-wrap">
                  {isSale && (
                    <span className="product-sheet-price-original">
                      R$ {formatBRL(selectedProduct.price)}
                    </span>
                  )}
                  <span className="product-sheet-price">
                    <span className="product-price-currency">R$ </span>
                    {formatBRL(effectivePrice(selectedProduct))}
                  </span>
                  {isSale && <span className="product-sheet-savings">Economize {pct}%</span>}
                </div>

                <div className="product-sheet-scroll">
                  <p className="product-sheet-desc">{selectedProduct.description}</p>

                  {selectedProduct.benefits && (
                    <section className="product-sheet-section">
                      <h4>Benefícios</h4>
                      <p>{selectedProduct.benefits}</p>
                    </section>
                  )}

                  {selectedProduct.ingredients && (
                    <section className="product-sheet-section">
                      <h4>Ingredientes</h4>
                      <p>{selectedProduct.ingredients}</p>
                    </section>
                  )}
                </div>

                <div className="product-sheet-cta">
                  {purchasable ? (
                    <button
                      className="btn btn-primary w-full"
                      onClick={() => {
                        handleAddToCart(selectedProduct);
                        setSelectedProduct(null);
                      }}
                    >
                      <ShoppingBag size={18} /> Adicionar ao Carrinho
                    </button>
                  ) : (
                    <button className="btn btn-outline w-full" disabled>
                      {status?.label || "Indisponível"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
