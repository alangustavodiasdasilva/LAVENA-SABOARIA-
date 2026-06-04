"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Gift, Plus, Minus, MessageCircle, ArrowLeft, Search, Check, Info, X,
} from "lucide-react";

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
  stockStatus?: string;
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
};

type Category = { id: string; name: string };

function effectivePrice(p: { price: number; salePrice?: number | null }) {
  if (p.salePrice && p.salePrice > 0 && p.salePrice < p.price) return p.salePrice;
  return p.price;
}

function isPurchasable(p: Product) {
  return (p.stockStatus || "IN_STOCK") === "IN_STOCK";
}

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default function GiftBuilder({
  products,
  kits,
  categories,
  whatsappNumber,
}: {
  products: Product[];
  kits: Kit[];
  categories: Category[];
  whatsappNumber: string;
}) {
  const [selection, setSelection] = useState<Record<string, number>>({});
  const [kitSelection, setKitSelection] = useState<Record<string, number>>({});
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [cardMessage, setCardMessage] = useState("");
  const [extraNote, setExtraNote] = useState("");
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const closeDetailRef = useRef<HTMLButtonElement>(null);

  const purchasables = products.filter(isPurchasable);
  const activeKits = kits.filter((k) => k.isActive);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return purchasables.filter((p) => {
      const matchCat = selectedCategory ? p.categoryId === selectedCategory : true;
      const matchQ = q
        ? p.name.toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q)
        : true;
      return matchCat && matchQ;
    });
  }, [purchasables, selectedCategory, query]);

  const selectedItems = useMemo(
    () =>
      products
        .filter((p) => selection[p.id] > 0)
        .map((p) => ({ product: p, qty: selection[p.id] })),
    [products, selection]
  );

  const selectedKits = useMemo(
    () =>
      kits
        .filter((k) => kitSelection[k.id] > 0)
        .map((k) => ({ kit: k, qty: kitSelection[k.id] })),
    [kits, kitSelection]
  );

  const totalUnits =
    selectedItems.reduce((s, i) => s + i.qty, 0) +
    selectedKits.reduce((s, k) => s + k.qty, 0);

  const totalValue =
    selectedItems.reduce((s, i) => s + effectivePrice(i.product) * i.qty, 0) +
    selectedKits.reduce((s, k) => s + effectivePrice(k.kit) * k.qty, 0);

  const adjustQty = (id: string, delta: number) => {
    setSelection((s) => {
      const next = Math.max(0, (s[id] || 0) + delta);
      if (next === 0) {
        const { [id]: _, ...rest } = s;
        return rest;
      }
      return { ...s, [id]: next };
    });
  };

  const adjustKitQty = (id: string, delta: number) => {
    setKitSelection((s) => {
      const next = Math.max(0, (s[id] || 0) + delta);
      if (next === 0) {
        const { [id]: _, ...rest } = s;
        return rest;
      }
      return { ...s, [id]: next };
    });
  };

  // ESC fecha detalhe
  useEffect(() => {
    if (!detailProduct) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDetailProduct(null);
    };
    window.addEventListener("keydown", onKey);
    closeDetailRef.current?.focus();
    return () => {
      html.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [detailProduct]);

  const enviarPresente = () => {
    if (totalUnits === 0) return;
    if (!senderName.trim()) {
      alert("Por favor, informe seu nome.");
      return;
    }

    const clean = (whatsappNumber || "").replace(/\D/g, "");
    if (!clean) {
      alert("WhatsApp da loja não configurado.");
      return;
    }

    const linhas: string[] = [];
    linhas.push("🎁 *Olá, Lavena!*");
    linhas.push("");
    linhas.push(`Sou *${senderName.trim()}*${senderPhone.trim() ? ` (${senderPhone.trim()})` : ""} e gostaria de montar uma *sacola presente*${recipientName.trim() ? ` para *${recipientName.trim()}*` : ""}.`);
    linhas.push("");
    linhas.push("━━━━━━━━━━━━━━━━━");

    selectedKits.forEach((k) => {
      const price = effectivePrice(k.kit);
      const subtotal = price * k.qty;
      linhas.push(`🎀 *Kit: ${k.kit.name}*`);
      linhas.push(`   ${k.qty} un. × ${formatBRL(price)} = ${formatBRL(subtotal)}`);
      linhas.push("");
    });

    selectedItems.forEach((it, idx) => {
      const price = effectivePrice(it.product);
      const subtotal = price * it.qty;
      linhas.push(`🌿 *${it.product.name}*`);
      linhas.push(`   ${it.qty} un. × ${formatBRL(price)} = ${formatBRL(subtotal)}`);
      if (idx < selectedItems.length - 1) linhas.push("");
    });

    linhas.push("━━━━━━━━━━━━━━━━━");
    linhas.push("");
    linhas.push(`💝 *Total: ${formatBRL(totalValue)}*`);

    if (cardMessage.trim()) {
      linhas.push("");
      linhas.push("💌 *Mensagem do cartão:*");
      linhas.push(`_"${cardMessage.trim()}"_`);
    }

    if (extraNote.trim()) {
      linhas.push("");
      linhas.push("📝 *Observação:*");
      linhas.push(extraNote.trim());
    }

    linhas.push("");
    linhas.push("Aguardo retorno para combinar pagamento e entrega 🌿");

    const texto = encodeURIComponent(linhas.join("\n"));
    window.open(`https://wa.me/${clean}?text=${texto}`, "_blank");
  };

  return (
    <div className="container gift-page">
      <a href="/" className="cart-back" aria-label="Voltar para loja">
        <ArrowLeft size={16} /> Voltar para a loja
      </a>

      <div className="gift-header">
        <div className="gift-header-icon">
          <Gift size={28} />
        </div>
        <div>
          <h1 className="gift-title">Monte um presente</h1>
          <p className="gift-subtitle">
            Escolha itens ou kits prontos, personalize a mensagem e envie pelo WhatsApp.
          </p>
        </div>
      </div>

      <div className="gift-layout">
        <section className="gift-catalog">
          {/* Passo 1: Kits prontos */}
          {activeKits.length > 0 && (
            <div className="gift-section">
              <h2 className="gift-section-title">
                <span className="gift-step">1</span>
                <Gift size={18} /> Escolha um kit pronto
              </h2>
              <div className="gift-kits-scroll">
                {activeKits.map((kit) => {
                  const qty = kitSelection[kit.id] || 0;
                  const price = effectivePrice(kit);
                  const hasSale =
                    !!kit.salePrice && kit.salePrice > 0 && kit.salePrice < kit.price;
                  const productsInKit = products.filter((p) => kit.productIds.includes(p.id));
                  return (
                    <div key={kit.id} className={`gift-card ${qty > 0 ? "selected" : ""}`}>
                      {qty > 0 && (
                        <span className="gift-card-check" aria-hidden>
                          <Check size={14} />
                        </span>
                      )}
                      <span className="gift-card-kit-badge">KIT</span>
                      <div className="gift-card-thumb">
                        {kit.imageUrl ? (
                          <Image
                            src={kit.imageUrl}
                            alt={kit.name}
                            fill
                            sizes="(max-width: 480px) 50vw, 200px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="product-image-placeholder">Sem imagem</div>
                        )}
                      </div>
                      <div className="gift-card-body">
                        <h3>{kit.name}</h3>
                        <small className="text-muted">
                          {productsInKit.length} {productsInKit.length === 1 ? "item" : "itens"}
                        </small>
                        <div style={{ marginTop: 6 }}>
                          {hasSale && (
                            <span className="product-price-original" style={{ fontSize: "0.75rem" }}>
                              R$ {kit.price.toFixed(2).replace(".", ",")}
                            </span>
                          )}
                          <strong className="gift-card-price">{formatBRL(price)}</strong>
                        </div>
                        <div className="gift-card-controls">
                          {qty === 0 ? (
                            <button
                              className="btn btn-outline btn-sm w-full"
                              onClick={() => adjustKitQty(kit.id, 1)}
                            >
                              <Plus size={14} /> Adicionar
                            </button>
                          ) : (
                            <div className="qty-group">
                              <button onClick={() => adjustKitQty(kit.id, -1)} className="qty-btn" aria-label="Diminuir">
                                <Minus size={14} />
                              </button>
                              <span className="cart-item-qty">{qty}</span>
                              <button onClick={() => adjustKitQty(kit.id, 1)} className="qty-btn" aria-label="Aumentar">
                                <Plus size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Passo 2 (ou 1 sem kits): Produtos individuais */}
          <div className="gift-section">
            <h2 className="gift-section-title">
              <span className="gift-step">{activeKits.length > 0 ? "2" : "1"}</span>
              <Plus size={18} /> {activeKits.length > 0 ? "Ou adicione produtos avulsos" : "Escolha os produtos"}
            </h2>

            {categories.length > 0 && (
              <div className="categories-strip">
                <div className="categories-scroll">
                  <button
                    className={`category-chip ${selectedCategory === null ? "active" : ""}`}
                    onClick={() => setSelectedCategory(null)}
                  >
                    Todos
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      className={`category-chip ${selectedCategory === cat.id ? "active" : ""}`}
                      onClick={() => setSelectedCategory(cat.id)}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {filtered.length === 0 ? (
              <div className="empty-state"><p>Nenhum produto encontrado.</p></div>
            ) : (
              <div className="gift-grid">
                {filtered.map((p) => {
                  const qty = selection[p.id] || 0;
                  const img = p.imageUrl || p.images?.[0];
                  const price = effectivePrice(p);
                  return (
                    <div key={p.id} className={`gift-card ${qty > 0 ? "selected" : ""}`}>
                      {qty > 0 && (
                        <span className="gift-card-check" aria-hidden>
                          <Check size={14} />
                        </span>
                      )}
                      <button
                        type="button"
                        className="gift-card-info-btn"
                        onClick={() => setDetailProduct(p)}
                        aria-label="Ver especificações"
                        title="Ver especificações"
                      >
                        <Info size={14} />
                      </button>
                      <div className="gift-card-thumb">
                        {img ? (
                          <Image
                            src={img}
                            alt={p.name}
                            fill
                            sizes="(max-width: 480px) 50vw, 200px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="product-image-placeholder">Sem imagem</div>
                        )}
                      </div>
                      <div className="gift-card-body">
                        <h3>{p.name}</h3>
                        {p.size && <small className="text-muted">{p.size}</small>}
                        <strong className="gift-card-price">{formatBRL(price)}</strong>
                        <div className="gift-card-controls">
                          {qty === 0 ? (
                            <button
                              className="btn btn-outline btn-sm w-full"
                              onClick={() => adjustQty(p.id, 1)}
                            >
                              <Plus size={14} /> Adicionar
                            </button>
                          ) : (
                            <div className="qty-group">
                              <button onClick={() => adjustQty(p.id, -1)} className="qty-btn" aria-label="Diminuir">
                                <Minus size={14} />
                              </button>
                              <span className="cart-item-qty">{qty}</span>
                              <button onClick={() => adjustQty(p.id, 1)} className="qty-btn" aria-label="Aumentar">
                                <Plus size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Resumo do presente */}
        <aside className="gift-summary">
          <div className="gift-summary-header">
            <Gift size={20} />
            <h2>Seu presente</h2>
          </div>

          <div className="gift-summary-fields" style={{ marginTop: 0 }}>
            <div className="gift-fields-divider">Seus dados</div>
            <label>
              Seu nome <span className="required-mark">*</span>
              <input
                type="text"
                className="admin-input"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Ex: Carla"
                required
              />
            </label>
            <label>
              Seu WhatsApp <span className="text-muted">(opcional)</span>
              <input
                type="tel"
                className="admin-input"
                value={senderPhone}
                onChange={(e) => setSenderPhone(e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </label>

            <div className="gift-fields-divider">Presente</div>
            <label>
              Nome de quem vai receber <span className="text-muted">(opcional)</span>
              <input
                type="text"
                className="admin-input"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Ex: Maria"
              />
            </label>
            <label>
              Mensagem do cartão <span className="text-muted">(opcional)</span>
              <textarea
                className="admin-input admin-textarea"
                value={cardMessage}
                onChange={(e) => setCardMessage(e.target.value)}
                placeholder="Feliz aniversário com muito carinho ♡"
                maxLength={200}
              />
              <small className="text-muted">{cardMessage.length}/200</small>
            </label>
            <label>
              Observações para a loja <span className="text-muted">(opcional)</span>
              <textarea
                className="admin-input admin-textarea"
                value={extraNote}
                onChange={(e) => setExtraNote(e.target.value)}
                placeholder="Quero retirar no sábado, embrulhar para presente, etc."
                maxLength={300}
              />
            </label>
          </div>

          <div className="gift-fields-divider">Resumo do Pedido</div>

          {totalUnits === 0 ? (
            <div className="gift-empty">
              <p>Nenhum item selecionado.</p>
              <small>Escolha kits ou produtos no catálogo.</small>
            </div>
          ) : (
            <>
              <ul className="gift-summary-list">
                {selectedKits.map((k) => (
                  <li key={`k-${k.kit.id}`}>
                    <span>🎀 {k.qty}× Kit {k.kit.name}</span>
                    <strong>{formatBRL(effectivePrice(k.kit) * k.qty)}</strong>
                  </li>
                ))}
                {selectedItems.map((it) => (
                  <li key={`p-${it.product.id}`}>
                    <span>{it.qty}× {it.product.name}</span>
                    <strong>{formatBRL(effectivePrice(it.product) * it.qty)}</strong>
                  </li>
                ))}
              </ul>

              <div className="gift-summary-row total">
                <span>Total</span>
                <strong>{formatBRL(totalValue)}</strong>
              </div>
            </>
          )}

          <button
            onClick={enviarPresente}
            disabled={totalUnits === 0 || !senderName.trim()}
            className="btn btn-whatsapp gift-send-btn"
          >
            <MessageCircle size={18} /> Enviar pelo WhatsApp
          </button>
          {totalUnits > 0 && !senderName.trim() && (
            <small className="text-muted gift-send-hint">
              Preencha seu nome para enviar.
            </small>
          )}
        </aside>
      </div>

      {/* Sticky checkout mobile */}
      {totalUnits > 0 && (
        <div className="gift-sticky-checkout">
          <div className="cart-sticky-total">
            <span className="cart-sticky-label">{totalUnits} {totalUnits === 1 ? "item" : "itens"}</span>
            <span className="cart-sticky-value">{formatBRL(totalValue)}</span>
          </div>
          <button onClick={enviarPresente} className="btn btn-whatsapp" disabled={!senderName.trim()}>
            <MessageCircle size={18} /> Enviar
          </button>
        </div>
      )}

      {/* Modal de detalhes do produto */}
      {detailProduct && (
        <div
          className="product-sheet-overlay"
          onClick={() => setDetailProduct(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="product-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="product-sheet-handle" aria-hidden />
            <button
              ref={closeDetailRef}
              className="product-sheet-close"
              onClick={() => setDetailProduct(null)}
              aria-label="Fechar"
            >
              <X size={22} />
            </button>

            <div className="product-sheet-image">
              {detailProduct.imageUrl || detailProduct.images?.[0] ? (
                <Image
                  src={detailProduct.imageUrl || detailProduct.images![0]}
                  alt={detailProduct.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              ) : (
                <div className="product-image-placeholder">Sem imagem</div>
              )}
            </div>

            <div className="product-sheet-info">
              <span className="product-category-label">
                {detailProduct.category?.name || "—"}
              </span>
              <h2 className="product-sheet-title">{detailProduct.name}</h2>
              {detailProduct.size && (
                <span className="product-sheet-size">{detailProduct.size}</span>
              )}
              <span className="product-sheet-price">
                {formatBRL(effectivePrice(detailProduct))}
              </span>

              <div className="product-sheet-scroll">
                <p className="product-sheet-desc">{detailProduct.description}</p>
                {detailProduct.benefits && (
                  <section className="product-sheet-section">
                    <h4>Benefícios</h4>
                    <p>{detailProduct.benefits}</p>
                  </section>
                )}
                {detailProduct.ingredients && (
                  <section className="product-sheet-section">
                    <h4>Ingredientes</h4>
                    <p>{detailProduct.ingredients}</p>
                  </section>
                )}
              </div>

              <div className="product-sheet-cta">
                <button
                  className="btn btn-primary w-full"
                  onClick={() => {
                    adjustQty(detailProduct.id, 1);
                    setDetailProduct(null);
                  }}
                >
                  <Plus size={18} /> Adicionar ao presente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
