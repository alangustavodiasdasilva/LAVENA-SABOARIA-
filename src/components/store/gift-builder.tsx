"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { AlertTriangle, Check, Gift, MessageCircle, Package, Plus, ShoppingBag, X } from "lucide-react";
import { placeOrder } from "@/actions/orders";
import { loadCustomer, maskPhone, saveCustomer, saveLastOrder, type LastOrder } from "./checkout-utils";
import OrderDone from "./order-done";
import QtyStepper from "@/components/ui/qty-stepper";
import SmartImage from "@/components/ui/smart-image";
import { useToast } from "@/components/ui/toast";
import { discountPercent, effectivePrice, isOnSale } from "@/lib/pricing";
import { availableUnits, defaultOption, isPurchasableStatus, optionDisplayName, productOptions, type ProductOption } from "@/lib/stock";
import { formatBRL } from "@/lib/format";
import { buildOrderMessage, whatsappLink } from "@/lib/whatsapp";
import type { BagDTO, DeliveryMethod, KitDTO, OrderItem, ProductDTO } from "@/lib/types";

type Cat = { id: string; name: string; slug: string; count: number };
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function StepHead({ n, title, text, done }: { n: number; title: string; text?: string; done?: boolean }) {
  return (
    <header className="gstep-head">
      <span className={`gstep-num ${done ? "is-done" : ""}`}>{done ? <Check size={16} /> : n}</span>
      <div>
        <h2>{title}</h2>
        {text && <p>{text}</p>}
      </div>
    </header>
  );
}

export default function GiftBuilder({
  products,
  kits,
  bags,
  categories,
  whatsappNumber,
}: {
  products: ProductDTO[];
  kits: KitDTO[];
  bags: BagDTO[];
  categories: Cat[];
  whatsappNumber: string | null;
}) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState<LastOrder | null>(null);

  const [tab, setTab] = useState<"kits" | "products">(kits.length > 0 ? "kits" : "products");
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [kitQty, setKitQty] = useState<Record<string, number>>({});
  const [prodQty, setProdQty] = useState<Record<string, number>>({});
  const [chosen, setChosen] = useState<Record<string, string>>({});
  const [detailId, setDetailId] = useState<string | null>(null);
  const [bagId, setBagId] = useState<string | null>(null);

  const [sender, setSender] = useState("");
  const [phone, setPhone] = useState("");
  const [recipient, setRecipient] = useState("");
  const [card, setCard] = useState("");
  const [delivery, setDelivery] = useState<DeliveryMethod>("TO_ARRANGE");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");

  const clearError = (key: string) => setErrors((cur) => (key in cur ? Object.fromEntries(Object.entries(cur).filter(([k]) => k !== key)) : cur));
  const senderRef = useRef<HTMLInputElement>(null);
  const recipientRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLTextAreaElement>(null);
  const addressRef = useRef<HTMLTextAreaElement>(null);
  const summaryRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const c = loadCustomer();
    setSender(c.name);
    setPhone(c.phone);
  }, []);

  useEffect(() => {
    if (!detailId) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDetailId(null);
    window.addEventListener("keydown", onKey);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = prev;
    };
  }, [detailId]);

  const available = useMemo(() => products.filter((p) => productOptions(p).some((o) => isPurchasableStatus(o.stockStatus))), [products]);
  const activeCategories = categories.filter((c) => available.some((p) => p.category?.slug === c.slug));
  const shown = useMemo(() => {
    const q = norm(query.trim());
    return available.filter((p) => (!category || p.category?.slug === category) && (!q || norm(`${p.name} ${p.description}`).includes(q)));
  }, [available, category, query]);

  const optionFor = (p: ProductDTO): ProductOption => {
    const opts = productOptions(p);
    return opts.find((o) => o.id === chosen[p.id] && isPurchasableStatus(o.stockStatus)) ?? defaultOption(p);
  };
  const keyOf = (p: ProductDTO, o: ProductOption) => `${p.id}|${o.id}`;

  const setQty = (setter: typeof setProdQty, key: string, qty: number) =>
    setter((cur) => {
      const next = { ...cur };
      if (qty <= 0) delete next[key];
      else next[key] = Math.min(99, qty);
      return next;
    });

  const selectedKits = kits.filter((k) => (kitQty[k.id] || 0) > 0).map((k) => ({ kit: k, qty: kitQty[k.id] }));
  const selectedProducts = useMemo(() => {
    const out: { key: string; product: ProductDTO; option: ProductOption; qty: number }[] = [];
    for (const [key, qty] of Object.entries(prodQty)) {
      const [pid, oid] = key.split("|");
      const product = products.find((p) => p.id === pid);
      const option = product && productOptions(product).find((o) => o.id === oid);
      if (product && option) out.push({ key, product, option, qty });
    }
    return out;
  }, [prodQty, products]);
  const bag = bags.find((b) => b.id === bagId) ?? null;

  const itemCount = selectedKits.reduce((s, k) => s + k.qty, 0) + selectedProducts.reduce((s, p) => s + p.qty, 0);
  const total =
    selectedKits.reduce((s, k) => s + effectivePrice(k.kit) * k.qty, 0) +
    selectedProducts.reduce((s, p) => s + effectivePrice(p.option) * p.qty, 0) +
    (bag?.price ?? 0);

  const detail = detailId ? products.find((p) => p.id === detailId) ?? null : null;
  const peek = (() => {
    if (!detail) return null;
    const opts = productOptions(detail);
    const opt = optionFor(detail);
    const k = keyOf(detail, opt);
    const qty = prodQty[k] || 0;
    const reserve = opt.stockStatus === "IN_PRODUCTION";
    const max = availableUnits(opt);
    const bullets = (t: string | null) =>
      (t ?? "")
        .split(/\r?\n/)
        .map((l) => l.replace(/^\s*[-•*–]\s*/, "").trim())
        .filter(Boolean);
    const benefits = bullets(detail.benefits);
    return (
      <div className="dialog-backdrop" onClick={() => setDetailId(null)}>
        <div className="dialog peek" role="dialog" aria-modal="true" aria-label={detail.name} onClick={(e) => e.stopPropagation()}>
          <button type="button" className="peek-close" onClick={() => setDetailId(null)} aria-label="Fechar">
            <X size={20} />
          </button>
          <div className="peek-media img-wrap">
            <SmartImage src={opt.imageUrl || detail.imageUrl || detail.images[0]} alt={detail.name} fill sizes="(max-width: 640px) 100vw, 480px" />
          </div>
          {detail.category && <span className="peek-cat">{detail.category.name}</span>}
          <h3>{detail.name}</h3>
          <div className="gcard-price">
            {isOnSale(opt) && <s>{formatBRL(opt.price)}</s>}
            <strong>{formatBRL(effectivePrice(opt))}</strong>
          </div>
          {opts.length > 1 && (
            <div className="gpills" role="group" aria-label={`Opções de ${detail.name}`}>
              {opts.map((o) => (
                <button key={o.id || "base"} type="button" className={`gpill ${o.id === opt.id ? "is-active" : ""}`} disabled={!isPurchasableStatus(o.stockStatus)} aria-pressed={o.id === opt.id} onClick={() => setChosen((c) => ({ ...c, [detail.id]: o.id }))}>
                  {o.label}
                </button>
              ))}
            </div>
          )}
          <p className="peek-desc">{detail.description}</p>
          {benefits.length > 0 && (
            <ul className="peek-list">
              {benefits.map((b) => (
                <li key={b}>
                  <Check size={14} /> {b}
                </li>
              ))}
            </ul>
          )}
          {detail.ingredients && (
            <p className="peek-ing">
              <strong>Ingredientes:</strong> {detail.ingredients}
            </p>
          )}
          <div className="dialog-actions peek-actions">
            {qty === 0 ? (
              <button type="button" className="btn btn-primary" onClick={() => setQty(setProdQty, k, 1)}>
                <Plus size={16} /> {reserve ? "Reservar para o presente" : "Adicionar ao presente"}
              </button>
            ) : (
              <>
                <QtyStepper size="sm" value={qty} max={max} onChange={(n) => setQty(setProdQty, k, n)} label={`Quantidade de ${detail.name}`} />
                <button type="button" className="btn btn-outline" onClick={() => setQty(setProdQty, k, 0)}>
                  <X size={16} /> Remover
                </button>
              </>
            )}
            <button type="button" className="btn" onClick={() => setDetailId(null)}>
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  })();

  const scrollTo = (el: HTMLElement | null) => {
    if (!el) return;
    el.focus({ preventScroll: true });
    window.setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "center" }), 120);
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    setFormError("");
    const e: Record<string, string> = {};
    if (itemCount === 0) {
      setFormError("Escolha pelo menos um kit ou produto para o presente.");
      summaryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (!whatsappNumber) {
      setFormError("O WhatsApp da loja ainda não foi configurado. Volte em breve.");
      return;
    }
    if (sender.trim().length < 2) e.sender = "Informe o seu nome.";
    if (recipient.trim().length < 2) e.recipient = "Informe o nome de quem vai receber.";
    if (!card.trim()) e.card = "Escreva uma mensagem para o cartão.";
    const digits = phone.replace(/\D/g, "");
    if (digits && (digits.length < 10 || digits.length > 11)) e.phone = "Telefone inválido. Use DDD + número.";
    if (delivery === "DELIVERY" && address.trim().length < 5) e.address = "Informe o endereço para entrega.";
    setErrors(e);
    if (Object.keys(e).length > 0) {
      scrollTo(e.sender ? senderRef.current : e.recipient ? recipientRef.current : e.card ? cardRef.current : e.address ? addressRef.current : null);
      return;
    }

    startTransition(async () => {
      saveCustomer({ name: sender.trim(), phone });
      const lines = [
        ...selectedKits.map((k) => ({ kind: "kit" as const, kitId: k.kit.id, quantity: k.qty })),
        ...selectedProducts.map((p) => ({ kind: "product" as const, productId: p.product.id, variantId: p.option.id || null, quantity: p.qty })),
      ];
      const res = await placeOrder({
        type: "GIFT",
        customerName: sender.trim(),
        customerPhone: digits || null,
        deliveryMethod: delivery,
        address: delivery === "DELIVERY" ? address.trim() : null,
        notes: notes.trim() || null,
        recipientName: recipient.trim(),
        cardMessage: card.trim(),
        bagId,
        website,
        lines,
      });

      if (res.ok) {
        const order = { code: res.data.code === "LV-00000" ? null : res.data.code, total: res.data.total, whatsappUrl: res.data.whatsappUrl };
        saveLastOrder(order);
        setDone({ ...order, at: Date.now() });
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (res.transient) {
        const items: OrderItem[] = [
          ...selectedKits.map((k) => ({ kind: "kit" as const, name: `Kit ${k.kit.name}`, unitPrice: effectivePrice(k.kit), quantity: k.qty })),
          ...selectedProducts.map((p) => ({ kind: "product" as const, name: optionDisplayName(p.product, p.option), unitPrice: effectivePrice(p.option), quantity: p.qty, reserve: p.option.stockStatus === "IN_PRODUCTION" })),
          ...(bag ? [{ kind: "bag" as const, name: `Embalagem: ${bag.name}`, unitPrice: bag.price, quantity: 1 }] : []),
        ];
        const message = buildOrderMessage({ type: "GIFT", customerName: sender.trim(), customerPhone: digits || null, deliveryMethod: delivery, address: delivery === "DELIVERY" ? address.trim() : null, notes: notes.trim() || null, recipientName: recipient.trim(), cardMessage: card.trim(), items, total });
        toast.error("Não conseguimos registrar no sistema, mas você pode enviar o pedido pelo WhatsApp.");
        setDone({ code: null, total, whatsappUrl: whatsappLink(whatsappNumber, message), at: Date.now() });
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setFormError(res.error);
      toast.error(res.error);
    });
  };

  if (done) return <OrderDone order={done} autoOpen />;

  const hasChoice = itemCount > 0;
  const hasCard = recipient.trim().length >= 2 && card.trim().length > 0 && sender.trim().length >= 2;

  return (
    <form className="gift-layout" onSubmit={submit} noValidate>
      {peek}
      <div className="gift-main">
        {/* 1 — presentes */}
        <section className="card gstep" aria-labelledby="g1">
          <StepHead n={1} title="Escolha o presente" text="Combine kits prontos ou monte do seu jeito, produto por produto." done={hasChoice} />
          <span id="g1" className="sr-only">
            Escolha o presente
          </span>

          {kits.length > 0 && (
            <div className="gtabs" role="tablist" aria-label="Tipo de presente">
              <button type="button" role="tab" aria-selected={tab === "kits"} className={tab === "kits" ? "is-active" : ""} onClick={() => setTab("kits")}>
                <Gift size={16} /> Kits prontos
              </button>
              <button type="button" role="tab" aria-selected={tab === "products"} className={tab === "products" ? "is-active" : ""} onClick={() => setTab("products")}>
                <Package size={16} /> Produtos avulsos
              </button>
            </div>
          )}

          {tab === "kits" && kits.length > 0 && (
            <div className="ggrid">
              {kits.map((k) => {
                const qty = kitQty[k.id] || 0;
                const sold = k.stockStatus === "OUT_OF_STOCK";
                const items = products.filter((p) => k.productIds.includes(p.id));
                const max = k.stockStatus === "IN_STOCK" && k.stockQuantity > 0 ? k.stockQuantity : null;
                const pct = discountPercent(k);
                return (
                  <article key={k.id} className={`gcard ${qty > 0 ? "is-selected" : ""} ${sold ? "is-sold" : ""}`}>
                    <div className="gcard-media img-wrap">
                      <SmartImage src={k.imageUrl || k.images[0]} alt={`Kit ${k.name}`} fill sizes="(max-width: 640px) 50vw, 220px" />
                      <span className="badge badge-gold gcard-tag">Kit</span>
                      {pct > 0 && <span className="badge badge-sale gcard-tag is-right">-{pct}%</span>}
                      {qty > 0 && (
                        <span className="gcard-check">
                          <Check size={14} />
                        </span>
                      )}
                    </div>
                    <div className="gcard-body">
                      <h3>{k.name}</h3>
                      <p className="gcard-meta">
                        {items.length} {items.length === 1 ? "item" : "itens"}: {items.slice(0, 3).map((i) => i.name).join(", ")}
                        {items.length > 3 ? "…" : ""}
                      </p>
                      <div className="gcard-price">
                        {isOnSale(k) && <s>{formatBRL(k.price)}</s>}
                        <strong>{formatBRL(effectivePrice(k))}</strong>
                      </div>
                      {sold ? (
                        <button type="button" className="btn btn-sm btn-block" disabled>
                          Esgotado
                        </button>
                      ) : qty === 0 ? (
                        <button type="button" className="btn btn-outline btn-sm btn-block" onClick={() => setQty(setKitQty, k.id, 1)}>
                          <Plus size={15} /> Adicionar
                        </button>
                      ) : (
                        <QtyStepper size="sm" value={qty} max={max} onChange={(n) => setQty(setKitQty, k.id, n)} label={`Quantidade do kit ${k.name}`} />
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {(tab === "products" || kits.length === 0) && (
            <>
              <div className="gfilters">
                <input className="input" type="search" placeholder="Buscar produto…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Buscar produto" />
                <div className="shop-chips" role="group" aria-label="Categorias">
                  <button type="button" className="chip" aria-pressed={category === null} onClick={() => setCategory(null)}>
                    Todos
                  </button>
                  {activeCategories.map((c) => (
                    <button key={c.id} type="button" className="chip" aria-pressed={category === c.slug} onClick={() => setCategory(c.slug)}>
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
              {shown.length === 0 ? (
                <p className="soft gempty">Nenhum produto encontrado.</p>
              ) : (
                <div className="ggrid">
                  {shown.map((p) => {
                    const opts = productOptions(p);
                    const opt = optionFor(p);
                    const k = keyOf(p, opt);
                    const qty = prodQty[k] || 0;
                    const inGift = Object.entries(prodQty).reduce((n, [key, q]) => (key.startsWith(`${p.id}|`) ? n + q : n), 0);
                    const reserve = opt.stockStatus === "IN_PRODUCTION";
                    const max = availableUnits(opt);
                    return (
                      <article key={p.id} className={`gcard ${inGift > 0 ? "is-selected" : ""}`}>
                        <div className="gcard-media img-wrap">
                          <SmartImage src={opt.imageUrl || p.imageUrl || p.images[0]} alt={p.name} fill sizes="(max-width: 640px) 50vw, 220px" />
                          <button type="button" className="gcard-open" onClick={() => setDetailId(p.id)} aria-label={`Ver detalhes de ${p.name}`} />
                          {reserve && <span className="badge badge-sage gcard-tag">Sob encomenda</span>}
                          {inGift > 0 && (
                            <span className="gcard-check">
                              <Check size={14} />
                            </span>
                          )}
                        </div>
                        <div className="gcard-body">
                          <h3>
                            <button type="button" className="gcard-name" onClick={() => setDetailId(p.id)}>
                              {p.name}
                            </button>
                          </h3>
                          {opts.length > 1 ? (
                            <div className="gpills" role="group" aria-label={`Opções de ${p.name}`}>
                              {opts.map((o) => (
                                <button key={o.id || "base"} type="button" className={`gpill ${o.id === opt.id ? "is-active" : ""}`} disabled={!isPurchasableStatus(o.stockStatus)} aria-pressed={o.id === opt.id} onClick={() => setChosen((c) => ({ ...c, [p.id]: o.id }))}>
                                  {o.label}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <p className="gcard-meta">{p.size || " "}</p>
                          )}
                          {inGift > 0 && qty === 0 && <p className="gcard-meta">{inGift} no presente (outra opção)</p>}
                          <div className="gcard-price">
                            {isOnSale(opt) && <s>{formatBRL(opt.price)}</s>}
                            <strong>{formatBRL(effectivePrice(opt))}</strong>
                          </div>
                          {qty === 0 ? (
                            <button type="button" className="btn btn-outline btn-sm btn-block" onClick={() => setQty(setProdQty, k, 1)}>
                              <Plus size={15} /> {reserve ? "Reservar" : "Adicionar"}
                            </button>
                          ) : (
                            <>
                              <QtyStepper size="sm" value={qty} max={max} onChange={(n) => setQty(setProdQty, k, n)} label={`Quantidade de ${p.name}`} />
                              <button type="button" className="gcard-remove" onClick={() => setQty(setProdQty, k, 0)}>
                                <X size={14} /> Remover do presente
                              </button>
                            </>
                          )}
                          <button type="button" className="gcard-more" onClick={() => setDetailId(p.id)}>
                            Ver detalhes
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </section>

        {/* 2 — embalagem */}
        <section className="card gstep" aria-labelledby="g2">
          <StepHead n={2} title="Escolha a embalagem" text="Opcional: deixe o presente ainda mais especial." done={hasChoice && (bagId !== null || bags.length === 0)} />
          <span id="g2" className="sr-only">
            Escolha a embalagem
          </span>
          <div className="bag-grid" role="radiogroup" aria-label="Embalagem">
            <label className={`bag-opt ${bagId === null ? "is-active" : ""}`}>
              <input type="radio" name="bag" checked={bagId === null} onChange={() => setBagId(null)} />
              <span className="bag-media bag-none">
                <X size={22} />
              </span>
              <strong>Embalagem simples</strong>
              <small>Só os produtos, sem custo</small>
            </label>
            {bags.map((b) => (
              <label key={b.id} className={`bag-opt ${bagId === b.id ? "is-active" : ""}`}>
                <input type="radio" name="bag" checked={bagId === b.id} onChange={() => setBagId(b.id)} />
                <span className="bag-media img-wrap">
                  <SmartImage src={b.imageUrl} alt="" fill sizes="140px" />
                </span>
                <strong>{b.name}</strong>
                <small>+ {formatBRL(b.price)}</small>
              </label>
            ))}
          </div>
        </section>

        {/* 3 — cartão e dados */}
        <section className="card gstep" aria-labelledby="g3">
          <StepHead n={3} title="Cartão e entrega" text="Escreva um recado com carinho e diga como prefere receber." done={hasCard} />
          <span id="g3" className="sr-only">
            Cartão e entrega
          </span>
          <div className="cart-fields">
            <div className="field">
              <label htmlFor="g-sender">
                Seu nome <span className="req">*</span>
              </label>
              <input ref={senderRef} id="g-sender" className="input" value={sender} onChange={(e) => { setSender(e.target.value); clearError("sender"); }} autoComplete="name" maxLength={80} aria-invalid={!!errors.sender} placeholder="Ex.: Carla" />
              {errors.sender && <span className="error-text">{errors.sender}</span>}
            </div>
            <div className="field">
              <label htmlFor="g-phone">Seu WhatsApp (opcional)</label>
              <input id="g-phone" className="input" type="tel" inputMode="tel" value={phone} onChange={(e) => { setPhone(maskPhone(e.target.value)); clearError("phone"); }} autoComplete="tel-national" aria-invalid={!!errors.phone} placeholder="(11) 99999-8888" />
              {errors.phone && <span className="error-text">{errors.phone}</span>}
            </div>
            <div className="field">
              <label htmlFor="g-recipient">
                Quem vai receber? <span className="req">*</span>
              </label>
              <input ref={recipientRef} id="g-recipient" className="input" value={recipient} onChange={(e) => { setRecipient(e.target.value); clearError("recipient"); }} maxLength={80} aria-invalid={!!errors.recipient} placeholder="Ex.: Maria" />
              {errors.recipient && <span className="error-text">{errors.recipient}</span>}
            </div>
            <div className="field gwide">
              <label htmlFor="g-card">
                Mensagem do cartão <span className="req">*</span>
              </label>
              <textarea ref={cardRef} id="g-card" className="textarea" value={card} onChange={(e) => { setCard(e.target.value); clearError("card"); }} maxLength={200} rows={3} aria-invalid={!!errors.card} placeholder="Feliz aniversário, com muito carinho ♡" />
              <span className="hint gcount">{card.length}/200</span>
              {errors.card && <span className="error-text">{errors.card}</span>}
            </div>

            <fieldset className="field delivery-field gwide">
              <legend className="field-label">Como prefere receber?</legend>
              <div className="delivery-options">
                {(
                  [
                    ["TO_ARRANGE", "A combinar", "Definimos pelo WhatsApp"],
                    ["PICKUP", "Retirada", "Você busca com a gente"],
                    ["DELIVERY", "Entrega", "No endereço de quem recebe"],
                  ] as const
                ).map(([value, label, hint]) => (
                  <label key={value} className={`delivery-opt ${delivery === value ? "is-active" : ""}`}>
                    <input type="radio" name="g-delivery" checked={delivery === value} onChange={() => setDelivery(value)} />
                    <span>
                      <strong>{label}</strong>
                      <small>{hint}</small>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {delivery === "DELIVERY" && (
              <div className="field gwide">
                <label htmlFor="g-address">
                  Endereço de entrega <span className="req">*</span>
                </label>
                <textarea ref={addressRef} id="g-address" className="textarea" value={address} onChange={(e) => { setAddress(e.target.value); clearError("address"); }} maxLength={300} rows={3} aria-invalid={!!errors.address} placeholder="Rua, número, bairro, cidade e complemento" />
                {errors.address && <span className="error-text">{errors.address}</span>}
              </div>
            )}

            <div className="field gwide">
              <label htmlFor="g-notes">Observações para a loja (opcional)</label>
              <textarea id="g-notes" className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} rows={2} placeholder="Quero retirar no sábado, embrulhar para presente…" />
            </div>

            <div className="honeypot" aria-hidden>
              <label>
                Não preencha este campo
                <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
              </label>
            </div>
          </div>
        </section>
      </div>

      {/* 4 — resumo */}
      <aside ref={summaryRef} id="resumo" className="card gift-summary" aria-labelledby="g4">
        <h2 id="g4">
          <ShoppingBag size={22} /> Seu presente
        </h2>
        {itemCount === 0 ? (
          <p className="gift-empty">Nenhum item escolhido ainda. Selecione kits ou produtos ao lado.</p>
        ) : (
          <ul className="gift-lines">
            {selectedKits.map(({ kit, qty }) => (
              <li key={kit.id}>
                <span>
                  <strong>{qty}×</strong> Kit {kit.name}
                </span>
                <span>{formatBRL(effectivePrice(kit) * qty)}</span>
                <button type="button" onClick={() => setQty(setKitQty, kit.id, 0)} aria-label={`Remover kit ${kit.name}`}>
                  <X size={14} />
                </button>
              </li>
            ))}
            {selectedProducts.map(({ key, product, option, qty }) => (
              <li key={key}>
                <span>
                  <strong>{qty}×</strong> {optionDisplayName(product, option)}
                </span>
                <span>{formatBRL(effectivePrice(option) * qty)}</span>
                <button type="button" onClick={() => setQty(setProdQty, key, 0)} aria-label={`Remover ${product.name}`}>
                  <X size={14} />
                </button>
              </li>
            ))}
            {bag && (
              <li className="is-bag">
                <span>{bag.name}</span>
                <span>{formatBRL(bag.price)}</span>
                <button type="button" onClick={() => setBagId(null)} aria-label="Remover embalagem">
                  <X size={14} />
                </button>
              </li>
            )}
          </ul>
        )}

        <div className="gift-total">
          <span>Total</span>
          <strong>{formatBRL(total)}</strong>
        </div>
        <p className="hint">Frete a combinar pelo WhatsApp.</p>

        {formError && (
          <p className="form-alert" role="alert">
            <AlertTriangle size={16} /> {formError}
          </p>
        )}
        {!whatsappNumber && (
          <p className="form-alert" role="alert">
            <AlertTriangle size={16} /> O WhatsApp da loja ainda não foi configurado.
          </p>
        )}
        <button type="submit" className="btn btn-whatsapp btn-lg btn-block" disabled={pending || !whatsappNumber}>
          {pending ? <span className="spinner" aria-hidden /> : <MessageCircle size={20} />} {pending ? "Enviando…" : "Enviar pelo WhatsApp"}
        </button>
        <Link href="/loja" className="summary-continue">
          Prefere comprar sem presente? Ver a loja
        </Link>
      </aside>

      {itemCount > 0 && (
        <div className="cart-sticky hide-desktop">
          <div>
            <small>
              {itemCount} {itemCount === 1 ? "item" : "itens"}
            </small>
            <strong>{formatBRL(total)}</strong>
          </div>
          <button type="button" className="btn btn-primary btn-lg" onClick={() => summaryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>
            Revisar e enviar
          </button>
        </div>
      )}
    </form>
  );
}
