"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Gift, Plus, Minus, MessageCircle, ArrowLeft, Check, Info, X, ShoppingBag,
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
  isVisible?: boolean;
  variants?: { id: string; name: string; price: number; salePrice?: number | null; imageUrl?: string | null; stockStatus?: string; stockQuantity?: number; }[];
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

type Bag = {
  id: string;
  name: string;
  imageUrl?: string | null;
  amountPaid: number;
  quantity: number;
  margin: number;
  isActive: boolean;
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
  bags = [],
  whatsappNumber,
}: {
  products: Product[];
  kits: Kit[];
  categories: Category[];
  bags?: Bag[];
  whatsappNumber: string;
}) {
  const [selection, setSelection] = useState<Record<string, number>>({});
  const [kitSelection, setKitSelection] = useState<Record<string, number>>({});
  const [selectedBagId, setSelectedBagId] = useState<string | null>(null);
  const [query, _setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [senderName, setSenderName] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [cardMessage, setCardMessage] = useState("");
  const [extraNote, setExtraNote] = useState("");
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const closeDetailRef = useRef<HTMLButtonElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const flattenedProducts = useMemo(() => {
    const list: Product[] = [];
    products.forEach((p) => {
      if (p.variants && p.variants.length > 0) {
        p.variants.forEach((v) => {
          list.push({
            ...p,
            id: `${p.id}-${v.id}`,
            name: `${p.name} (${v.name})`,
            price: v.price,
            salePrice: v.salePrice,
            imageUrl: v.imageUrl || p.imageUrl,
            stockStatus: v.stockStatus || "IN_STOCK",
          });
        });
        list.push(p); // Inclui o produto base como opção padrão
      } else {
        list.push(p);
      }
    });
    return list;
  }, [products]);

  const purchasables = products.filter(p => {
    if (p.isVisible === false) return false;
    if (p.variants && p.variants.length > 0) {
      return p.variants.some(v => (v.stockStatus || "IN_STOCK") === "IN_STOCK");
    }
    return (p.stockStatus || "IN_STOCK") === "IN_STOCK";
  });
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
      flattenedProducts
        .filter((p) => selection[p.id] > 0)
        .map((p) => ({ product: p, qty: selection[p.id] })),
    [flattenedProducts, selection]
  );

  const selectedKits = useMemo(
    () =>
      kits
        .filter((k) => kitSelection[k.id] > 0)
        .map((k) => ({ kit: k, qty: kitSelection[k.id] })),
    [kits, kitSelection]
  );

  const selectedBag = useMemo(() => bags.find(b => b.id === selectedBagId), [bags, selectedBagId]);

  const bagPrice = selectedBag
    ? (selectedBag.amountPaid / Math.max(1, selectedBag.quantity)) * (1 + selectedBag.margin / 100)
    : 0;

  const totalUnits =
    selectedItems.reduce((s, i) => s + i.qty, 0) +
    selectedKits.reduce((s, k) => s + k.qty, 0) +
    (selectedBag ? 1 : 0);

  const totalValue =
    selectedItems.reduce((s, i) => s + effectivePrice(i.product) * i.qty, 0) +
    selectedKits.reduce((s, k) => s + effectivePrice(k.kit) * k.qty, 0) +
    bagPrice;

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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const enviarPresente = () => {
    if (totalUnits === 0) return;

    const focusAndScroll = (el: HTMLElement | null) => {
      if (!el) return;
      el.focus();
      // Scrolla com um pequeno delay para aguardar o teclado do celular aparecer na tela
      setTimeout(() => {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 350);
    };

    if (!senderName.trim()) {
      showToast("Por favor, informe seu nome.");
      focusAndScroll(nameInputRef.current);
      return;
    }

    if (!recipientName.trim()) {
      showToast("Por favor, preencha o nome de quem vai receber.");
      focusAndScroll(document.getElementById("recipientNameInput"));
      return;
    }

    if (!cardMessage.trim()) {
      showToast("Por favor, escreva uma mensagem para o cartão.");
      focusAndScroll(document.getElementById("cardMessageInput"));
      return;
    }

    const clean = (whatsappNumber || "").replace(/\D/g, "");
    if (!clean) {
      showToast("WhatsApp da loja não configurado.");
      return;
    }

    const linhas: string[] = [];
    linhas.push("🎁 *Olá, Lavena!*");
    linhas.push("");
    linhas.push(`Sou *${senderName.trim()}* e gostaria de montar uma *sacola presente*${recipientName.trim() ? ` para *${recipientName.trim()}*` : ""}.`);
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
      linhas.push("");
    });

    if (selectedBag) {
      linhas.push(`🛍️ *Sacola/Embalagem: ${selectedBag.name}*`);
      linhas.push(`   1 un. × ${formatBRL(bagPrice)} = ${formatBRL(bagPrice)}`);
      linhas.push("");
    }

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
      <Link href="/" className="cart-back" aria-label="Voltar para loja">
        <ArrowLeft size={16} /> Voltar para a loja
      </Link>

      <div className="gift-header gift-header-centered">
        <h1 className="gift-title gift-title-hero">
          Monte seu presente
        </h1>
        <p className="gift-subtitle gift-subtitle-centered">
          Selecione os kits prontos ou escolha produtos avulsos abaixo para criar uma combinação especial.
        </p>
      </div>

      <div className="gift-layout">
        <section className="gift-catalog">
          {/* Passo 1: Kits prontos */}
          {activeKits.length > 0 && (
            <div className="gift-section">
              <h2 className="gift-section-title gift-section-title-center">
                <span className="section-label section-label-flex">
                  <Gift size={14} /> Passo 1
                </span>
                <span className="gift-section-heading">Escolha um kit pronto</span>
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
                            unoptimized={kit.imageUrl?.startsWith("data:")}
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
                        <div className="gift-card-price-wrap">
                          {hasSale && (
                            <span className="product-price-original gift-price-original">
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
            <h2 className="gift-section-title gift-section-title-center">
              <span className="section-label section-label-flex">
                <Plus size={14} /> Passo {activeKits.length > 0 ? "2" : "1"}
              </span>
              <span className="gift-section-heading">
                {activeKits.length > 0 ? "Ou adicione produtos avulsos" : "Escolha os produtos"}
              </span>
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
                  const activeVariantId = selectedVariants[p.id] !== undefined ? selectedVariants[p.id] : (p.variants && p.variants.length > 0 ? p.variants[0].id : "");
                  const selectionId = activeVariantId ? `${p.id}-${activeVariantId}` : p.id;
                  const qty = selection[selectionId] || 0;
                  
                  const activeVariant = p.variants?.find(v => v.id === activeVariantId);
                  const img = activeVariant?.imageUrl || p.imageUrl || p.images?.[0];
                  const price = activeVariant ? effectivePrice(activeVariant) : effectivePrice(p);
                  const vStatus = activeVariant ? (activeVariant.stockStatus || "IN_STOCK") : (p.stockStatus || "IN_STOCK");
                  const isAvailable = vStatus === "IN_STOCK" || vStatus === "IN_PRODUCTION";
                  const isReserva = vStatus === "IN_PRODUCTION";

                  return (
                    <div key={p.id} className={`gift-card ${qty > 0 ? "selected" : ""} ${!isAvailable ? "is-unavailable" : ""}`}>
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
                            unoptimized={img?.startsWith("data:")}
                          />
                        ) : (
                          <div className="product-image-placeholder">Sem imagem</div>
                        )}
                      </div>
                      <div className="gift-card-body">
                        <h3>{p.name}</h3>
                        {p.size && !p.variants?.length && <small className="text-muted">{p.size}</small>}
                        
                        {p.variants && p.variants.length > 0 && (
                          <div style={{ margin: '8px 0', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedVariants(prev => ({ ...prev, [p.id]: "" }));
                              }}
                              style={{
                                padding: '4px 8px',
                                fontSize: '0.75rem',
                                borderRadius: '4px',
                                border: `1px solid ${activeVariantId === "" ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                background: activeVariantId === "" ? 'var(--color-surface)' : 'transparent',
                                opacity: ((p.stockStatus || "IN_STOCK") === "IN_STOCK" || p.stockStatus === "IN_PRODUCTION") ? 1 : 0.5,
                                cursor: 'pointer'
                              }}
                            >
                              {p.size || "Padrão"}
                            </button>
                            {p.variants.map(v => {
                              const vAvailable = (v.stockStatus || "IN_STOCK") === "IN_STOCK" || v.stockStatus === "IN_PRODUCTION";
                              return (
                                <button
                                  key={v.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedVariants(prev => ({ ...prev, [p.id]: v.id }));
                                  }}
                                  style={{
                                    padding: '4px 8px',
                                    fontSize: '0.75rem',
                                    borderRadius: '4px',
                                    border: `1px solid ${activeVariantId === v.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                    background: activeVariantId === v.id ? 'var(--color-surface)' : 'transparent',
                                    opacity: vAvailable ? 1 : 0.5,
                                    cursor: 'pointer'
                                  }}
                                >
                                  {v.name}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        <strong className="gift-card-price">{formatBRL(price)}</strong>
                        <div className="gift-card-controls">
                          {!isAvailable ? (
                            <button className="btn btn-outline btn-sm w-full" disabled>Esgotado</button>
                          ) : qty === 0 ? (
                            <button
                              className="btn btn-outline btn-sm w-full"
                              onClick={() => adjustQty(selectionId, 1)}
                            >
                              <Plus size={14} /> {isReserva ? "Reservar" : "Adicionar"}
                            </button>
                          ) : (
                            <div className="qty-group">
                              <button onClick={() => adjustQty(selectionId, -1)} className="qty-btn" aria-label="Diminuir">
                                <Minus size={14} />
                              </button>
                              <span className="cart-item-qty">{qty}</span>
                              <button onClick={() => adjustQty(selectionId, 1)} className="qty-btn" aria-label="Aumentar">
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

          {bags && bags.length > 0 && (
            <section className="gift-section">
              <h2 className="gift-section-title gift-section-title-center">
                <span className="section-label section-label-flex">
                  <ShoppingBag size={14} /> Passo {activeKits.length > 0 ? "3" : "2"}
                </span>
                <span className="gift-section-heading">
                  Escolha a embalagem <span className="text-muted">(opcional)</span>
                </span>
              </h2>
              <div className="bag-grid">
                <div
                  className={`gift-card bag-card-no-bag ${!selectedBagId ? "selected" : ""}`}
                  onClick={() => setSelectedBagId(null)}
                >
                  {!selectedBagId && <span className="gift-card-check" aria-hidden><Check size={14} /></span>}
                  <div className="bag-card-no-bag-content">
                    <X size={24} className="bag-card-no-bag-icon" />
                    <h3 style={{ fontSize: "1rem" }}>Embalagem simples</h3>
                    <small className="text-muted">Apenas os produtos</small>
                  </div>
                </div>

                {bags.map(bag => {
                  const price = (bag.amountPaid / Math.max(1, bag.quantity)) * (1 + bag.margin / 100);
                  const isSelected = selectedBagId === bag.id;
                  return (
                    <div
                      key={bag.id}
                      className={`gift-card bag-card-selectable ${isSelected ? "selected" : ""}`}
                      onClick={() => setSelectedBagId(bag.id)}
                    >
                      {isSelected && <span className="gift-card-check" aria-hidden><Check size={14} /></span>}
                      <div className="gift-card-thumb bag-card-thumb-height">
                        {bag.imageUrl ? (
                          <Image src={bag.imageUrl} alt={bag.name} fill sizes="200px" className="object-cover" unoptimized={bag.imageUrl.startsWith("data:")} />
                        ) : (
                          <div className="product-image-placeholder"><ShoppingBag size={24} /></div>
                        )}
                      </div>
                      <div className="gift-card-body bag-card-body-flex">
                        <h3>{bag.name}</h3>
                        <strong className="gift-card-price bag-card-price-mt">+ {formatBRL(price)}</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </section>

        {/* Resumo do presente */}
        <aside className="gift-summary">
          <div className="gift-summary-header">
            <Gift size={20} />
            <h2>Seu presente</h2>
          </div>

          <div className="gift-summary-fields gift-summary-fields-top">
            <div className="gift-fields-divider">Seus dados</div>
            <label>
              Seu nome <span className="required-mark">*</span>
              <input
                ref={nameInputRef}
                type="text"
                className="admin-input"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Ex: Carla"
                required
              />
            </label>

            <div className="gift-fields-divider">Presente</div>
            <label>
              Nome de quem vai receber <span className="required-mark">*</span>
              <input
                id="recipientNameInput"
                type="text"
                className="admin-input"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Ex: Maria"
                required
              />
            </label>
            <label>
              Mensagem do cartão <span className="required-mark">*</span>
              <textarea
                id="cardMessageInput"
                className="admin-input admin-textarea"
                value={cardMessage}
                onChange={(e) => setCardMessage(e.target.value)}
                placeholder="Feliz aniversário com muito carinho ♡"
                maxLength={200}
                required
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
                {selectedItems.map((i) => (
                  <li key={i.product.id}>
                    <span>{i.qty}× {i.product.name}</span>
                    <strong>{formatBRL(effectivePrice(i.product) * i.qty)}</strong>
                  </li>
                ))}

                {selectedBag && (
                  <li className="bag-summary-li">
                    <span><ShoppingBag size={14} className="bag-summary-icon" /> {selectedBag.name}</span>
                    <strong>{formatBRL(bagPrice)}</strong>
                  </li>
                )}
              </ul>

              <div className="gift-summary-row total">
                <span>Total</span>
                <strong>{formatBRL(totalValue)}</strong>
              </div>
            </>
          )}

          <button
            onClick={enviarPresente}
            disabled={totalUnits === 0}
            className="btn btn-whatsapp gift-send-btn"
          >
            <MessageCircle size={18} /> Enviar pelo WhatsApp
          </button>
          {totalUnits > 0 && (!senderName.trim() || !recipientName.trim() || !cardMessage.trim()) && (
            <small className="text-muted gift-send-hint">
              Preencha todos os campos obrigatórios (*) para enviar.
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
          <button onClick={enviarPresente} className="btn btn-whatsapp">
            <MessageCircle size={18} /> Enviar
          </button>
        </div>
      )}

      {/* Notificação Toast Customizada Elegante */}
      {toastMessage && (
        <div className="lv-toast" role="status" aria-live="polite">
          <span className="lv-toast-icon" aria-hidden>🌿</span>
          <span className="lv-toast-msg">{toastMessage}</span>
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
                  unoptimized={(detailProduct.imageUrl || detailProduct.images?.[0])?.startsWith("data:")}
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
