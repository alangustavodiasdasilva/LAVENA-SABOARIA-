"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { AlertTriangle, Home, MapPin, MessageCircle, ShoppingBag, Store, Trash2, Truck } from "lucide-react";
import { quoteCart, placeOrder } from "@/actions/orders";
import { useCart } from "./cart";
import { clearLastOrder, loadCustomer, loadLastOrder, maskPhone, saveCustomer, saveLastOrder, type LastOrder } from "./checkout-utils";
import OrderDone from "./order-done";
import QtyStepper from "@/components/ui/qty-stepper";
import SmartImage from "@/components/ui/smart-image";
import { useToast } from "@/components/ui/toast";
import { formatBRL } from "@/lib/format";
import { buildOrderMessage, whatsappLink } from "@/lib/whatsapp";
import type { DeliveryMethod } from "@/lib/types";

const DELIVERY: { value: DeliveryMethod; label: string; hint: string; icon: typeof Truck }[] = [
  { value: "TO_ARRANGE", label: "A combinar", hint: "Definimos juntos pelo WhatsApp", icon: MessageCircle },
  { value: "PICKUP", label: "Retirada", hint: "Você busca com a gente", icon: Store },
  { value: "DELIVERY", label: "Entrega", hint: "Receba no seu endereço", icon: Truck },
];

export default function CartView({ whatsappNumber, deliveryInfo }: { whatsappNumber: string | null; deliveryInfo: string | null }) {
  const toast = useToast();
  const { lines, hydrated, subtotal, count, quotes, setQuantity, remove, clear, applyQuote } = useCart();
  const [pending, startTransition] = useTransition();
  const [last, setLast] = useState<LastOrder | null>(null);
  const [justDone, setJustDone] = useState<LastOrder | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [delivery, setDelivery] = useState<DeliveryMethod>("TO_ARRANGE");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const clearError = (key: string) => setErrors((cur) => (key in cur ? Object.fromEntries(Object.entries(cur).filter(([k]) => k !== key)) : cur));
  const nameRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const c = loadCustomer();
    setName(c.name);
    setPhone(c.phone);
    setLast(loadLastOrder());
  }, []);

  // Atualiza preços e disponibilidade com o catálogo atual
  const signature = useMemo(() => lines.map((l) => `${l.key}x${l.quantity}`).join("|"), [lines]);
  useEffect(() => {
    if (!hydrated || lines.length === 0) return;
    const id = window.setTimeout(async () => {
      const res = await quoteCart(
        lines.map((l) => ({ key: l.key, kind: l.kind, productId: l.productId, variantId: l.variantId ?? null, kitId: l.kitId, quantity: l.quantity }))
      );
      if (res.ok) applyQuote(res.data);
    }, 250);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, signature]);

  const problems = lines.filter((l) => quotes[l.key] && (!quotes[l.key].ok || (quotes[l.key].maxQty != null && l.quantity > (quotes[l.key].maxQty as number))));
  const hasBlocking = problems.length > 0;

  if (!hydrated) {
    return (
      <div className="cart-layout" aria-busy="true">
        <div className="skeleton" style={{ height: 360 }} />
        <div className="skeleton" style={{ height: 320 }} />
      </div>
    );
  }

  if (justDone) return <OrderDone order={justDone} autoOpen />;

  if (lines.length === 0) {
    if (last) {
      return (
        <div className="cart-empty-wrap">
          <OrderDone
            order={last}
            onDismiss={() => {
              clearLastOrder();
              setLast(null);
            }}
          />
        </div>
      );
    }
    return (
      <div className="empty-state">
        <ShoppingBag size={36} strokeWidth={1.3} />
        <h3>Sua sacola está vazia</h3>
        <p>Que tal conhecer os aromas da Lavena? Escolha o que combina com você.</p>
        <div className="done-actions">
          <Link href="/loja" className="btn btn-primary">
            Explorar produtos
          </Link>
          <Link href="/presente" className="btn btn-outline">
            Montar um presente
          </Link>
        </div>
      </div>
    );
  }

  const validate = () => {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = "Informe seu nome.";
    const digits = phone.replace(/\D/g, "");
    if (digits && (digits.length < 10 || digits.length > 11)) e.phone = "Telefone inválido. Use DDD + número.";
    if (delivery === "DELIVERY" && address.trim().length < 5) e.address = "Informe o endereço para entrega.";
    setErrors(e);
    if (e.name) nameRef.current?.focus();
    else if (e.address) addressRef.current?.focus();
    return Object.keys(e).length === 0;
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    setFormError("");
    if (!whatsappNumber) {
      setFormError("O WhatsApp da loja ainda não foi configurado. Volte em breve.");
      return;
    }
    if (hasBlocking) {
      setFormError("Ajuste os itens destacados antes de finalizar.");
      return;
    }
    if (!validate()) return;

    startTransition(async () => {
      saveCustomer({ name: name.trim(), phone });
      const payload = {
        type: "CART" as const,
        customerName: name.trim(),
        customerPhone: phone.replace(/\D/g, "") || null,
        deliveryMethod: delivery,
        address: delivery === "DELIVERY" ? address.trim() : null,
        notes: notes.trim() || null,
        website,
        lines: lines.map((l) => ({ kind: l.kind, productId: l.productId, variantId: l.variantId ?? null, kitId: l.kitId, quantity: l.quantity })),
      };
      const res = await placeOrder(payload);

      if (res.ok) {
        const order = { code: res.data.code === "LV-00000" ? null : res.data.code, total: res.data.total, whatsappUrl: res.data.whatsappUrl };
        saveLastOrder(order);
        setJustDone({ ...order, at: Date.now() });
        clear();
        return;
      }
      if (res.transient) {
        // Não deu para registrar no sistema, mas o cliente pode enviar o pedido pelo WhatsApp mesmo assim.
        const message = buildOrderMessage({
          type: "CART",
          customerName: name.trim(),
          customerPhone: phone.replace(/\D/g, "") || null,
          deliveryMethod: delivery,
          address: delivery === "DELIVERY" ? address.trim() : null,
          notes: notes.trim() || null,
          items: lines.map((l) => ({ kind: l.kind, name: l.name, unitPrice: l.price, quantity: l.quantity, reserve: l.reserve })),
          total: subtotal,
        });
        const order = { code: null, total: subtotal, whatsappUrl: whatsappLink(whatsappNumber, message) };
        setJustDone({ ...order, at: Date.now() });
        toast.error("Não conseguimos registrar no sistema, mas você pode enviar o pedido pelo WhatsApp.");
        clear();
        return;
      }
      setFormError(res.error);
      toast.error(res.error);
      const q = await quoteCart(lines.map((l) => ({ key: l.key, kind: l.kind, productId: l.productId, variantId: l.variantId ?? null, kitId: l.kitId, quantity: l.quantity })));
      if (q.ok) applyQuote(q.data);
    });
  };

  return (
    <form className="cart-layout" onSubmit={submit} noValidate id="checkout-form">
      <div className="cart-main">
        <ul className="cart-lines" aria-label="Itens da sacola">
          {lines.map((l) => {
            const q = quotes[l.key];
            const max = q?.maxQty ?? null;
            const bad = q && !q.ok;
            const over = q && q.ok && max != null && l.quantity > max;
            return (
              <li key={l.key} className={`cart-line ${bad || over ? "has-problem" : ""}`}>
                {l.slug ? (
                  <Link href={l.kind === "kit" ? `/kit/${l.slug}` : `/produto/${l.slug}`} className="cart-line-img img-wrap" tabIndex={-1} aria-hidden>
                    <SmartImage src={l.imageUrl} alt="" fill sizes="96px" />
                  </Link>
                ) : (
                  <span className="cart-line-img img-wrap" aria-hidden>
                    <SmartImage src={l.imageUrl} alt="" fill sizes="96px" />
                  </span>
                )}
                <div className="cart-line-info">
                  <h3>{l.name}</h3>
                  <div className="cart-line-tags">
                    {l.kind === "kit" && <span className="badge badge-gold">Kit</span>}
                    {l.reserve && <span className="badge badge-sage">Sob encomenda</span>}
                  </div>
                  <span className="cart-line-unit">{formatBRL(l.price)} cada</span>
                  {bad && (
                    <p className="cart-line-problem">
                      <AlertTriangle size={14} /> {q.problem} Remova este item para continuar.
                    </p>
                  )}
                  {over && (
                    <p className="cart-line-problem">
                      <AlertTriangle size={14} /> Só temos {max} {max === 1 ? "unidade" : "unidades"} disponível. Ajuste a quantidade.
                    </p>
                  )}
                </div>
                <div className="cart-line-side">
                  <strong className="cart-line-total">{formatBRL(l.price * l.quantity)}</strong>
                  <QtyStepper size="sm" value={l.quantity} max={max ?? 99} onChange={(n) => setQuantity(l.key, n)} label={`Quantidade de ${l.name}`} />
                  <button type="button" className="cart-line-remove" onClick={() => remove(l.key)} aria-label={`Remover ${l.name}`}>
                    <Trash2 size={15} /> Remover
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        <section className="card cart-form" aria-labelledby="dados-title">
          <h2 id="dados-title">Seus dados</h2>
          <p className="soft">Usamos só para identificar o seu pedido e combinar a entrega pelo WhatsApp.</p>

          <div className="cart-fields">
            <div className="field">
              <label htmlFor="c-name">
                Seu nome <span className="req">*</span>
              </label>
              <input ref={nameRef} id="c-name" className="input" value={name} onChange={(e) => { setName(e.target.value); clearError("name"); }} autoComplete="name" aria-invalid={!!errors.name} aria-describedby={errors.name ? "c-name-err" : undefined} placeholder="Como podemos te chamar?" maxLength={80} />
              {errors.name && (
                <span id="c-name-err" className="error-text">
                  {errors.name}
                </span>
              )}
            </div>

            <div className="field">
              <label htmlFor="c-phone">Seu WhatsApp (opcional)</label>
              <input id="c-phone" className="input" type="tel" inputMode="tel" value={phone} onChange={(e) => { setPhone(maskPhone(e.target.value)); clearError("phone"); }} autoComplete="tel-national" aria-invalid={!!errors.phone} placeholder="(11) 99999-8888" />
              {errors.phone ? <span className="error-text">{errors.phone}</span> : <span className="hint">Ajuda a gente a te encontrar se a conversa se perder.</span>}
            </div>

            <fieldset className="field delivery-field">
              <legend className="field-label">Como prefere receber?</legend>
              <div className="delivery-options">
                {DELIVERY.map(({ value, label, hint, icon: Icon }) => (
                  <label key={value} className={`delivery-opt ${delivery === value ? "is-active" : ""}`}>
                    <input type="radio" name="delivery" value={value} checked={delivery === value} onChange={() => setDelivery(value)} />
                    <Icon size={20} aria-hidden />
                    <span>
                      <strong>{label}</strong>
                      <small>{hint}</small>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {delivery === "DELIVERY" && (
              <div className="field">
                <label htmlFor="c-address">
                  <MapPin size={15} /> Endereço de entrega <span className="req">*</span>
                </label>
                <textarea ref={addressRef} id="c-address" className="textarea" value={address} onChange={(e) => { setAddress(e.target.value); clearError("address"); }} aria-invalid={!!errors.address} placeholder="Rua, número, bairro, cidade e complemento" maxLength={300} rows={3} />
                {errors.address && <span className="error-text">{errors.address}</span>}
              </div>
            )}

            <div className="field">
              <label htmlFor="c-notes">Observações (opcional)</label>
              <textarea id="c-notes" className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Algum aroma de preferência, horário para retirar, presente…" maxLength={500} rows={3} />
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

      <aside className="cart-summary card" aria-labelledby="resumo-title">
        <h2 id="resumo-title">Resumo</h2>
        <dl className="summary-rows">
          <div>
            <dt>
              Subtotal ({count} {count === 1 ? "item" : "itens"})
            </dt>
            <dd>{formatBRL(subtotal)}</dd>
          </div>
          <div>
            <dt>Frete</dt>
            <dd className="muted">A combinar</dd>
          </div>
          <div className="is-total">
            <dt>Total</dt>
            <dd>{formatBRL(subtotal)}</dd>
          </div>
        </dl>

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
          {pending ? <span className="spinner" aria-hidden /> : <MessageCircle size={20} />} {pending ? "Enviando…" : "Finalizar pelo WhatsApp"}
        </button>
        <p className="hint summary-note">
          Ao finalizar, registramos o seu pedido e abrimos o WhatsApp com o resumo pronto. Pagamento e entrega são combinados por lá.
        </p>
        {deliveryInfo && (
          <p className="summary-delivery">
            <Home size={15} /> {deliveryInfo}
          </p>
        )}
        <Link href="/loja" className="summary-continue">
          ← Continuar comprando
        </Link>
      </aside>

      <div className="cart-sticky hide-desktop">
        <div>
          <small>Total</small>
          <strong>{formatBRL(subtotal)}</strong>
        </div>
        <button type="submit" className="btn btn-whatsapp btn-lg" disabled={pending || !whatsappNumber}>
          {pending ? <span className="spinner" aria-hidden /> : <MessageCircle size={20} />} Finalizar
        </button>
      </div>
    </form>
  );
}
