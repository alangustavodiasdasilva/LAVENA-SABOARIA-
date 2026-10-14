"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Check, Leaf, MessageCircle, PackageCheck, ShoppingBag, Sparkles, Truck } from "lucide-react";
import Gallery from "./gallery";
import { useCart } from "./cart";
import { kitLine, productLine } from "./cart-helpers";
import QtyStepper from "@/components/ui/qty-stepper";
import SmartImage from "@/components/ui/smart-image";
import { discountPercent, effectivePrice, isOnSale } from "@/lib/pricing";
import { availableUnits, defaultOption, kitAvailability, lowStockNote, productOptions } from "@/lib/stock";
import { formatBRL } from "@/lib/format";
import { whatsappLink } from "@/lib/whatsapp";
import type { KitDTO, ProductDTO } from "@/lib/types";

/** "- item\n- item" vira lista; texto corrido continua parágrafo. */
function TextBlock({ text }: { text: string }) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*[-•*–]\s*/, "").trim())
    .filter(Boolean);
  const bulleted = /^\s*[-•*–]/m.test(text) || lines.length > 1;
  if (!bulleted) return <p>{text}</p>;
  return (
    <ul className="pd-bullets">
      {lines.map((l, i) => (
        <li key={i}>
          <Leaf size={14} aria-hidden /> {l}
        </li>
      ))}
    </ul>
  );
}

function AskWhatsapp({ number, text }: { number: string | null; text: string }) {
  if (!number) return null;
  return (
    <a className="btn btn-outline btn-lg btn-block" href={whatsappLink(number, text)} target="_blank" rel="noopener noreferrer">
      <MessageCircle size={19} /> Perguntar no WhatsApp
    </a>
  );
}

export function ProductDetail({
  product,
  url,
  whatsappNumber,
  deliveryInfo,
}: {
  product: ProductDTO;
  url: string;
  whatsappNumber: string | null;
  deliveryInfo: string | null;
}) {
  const { add } = useCart();
  const options = useMemo(() => productOptions(product), [product]);
  const [optionId, setOptionId] = useState(defaultOption(product).id);
  const [qty, setQty] = useState(1);
  const selected = options.find((o) => o.id === optionId) ?? options[0];
  const units = availableUnits(selected);
  const sold = selected.stockStatus === "OUT_OF_STOCK";
  const reserve = selected.stockStatus === "IN_PRODUCTION";
  const pct = discountPercent(selected);
  const note = lowStockNote(selected, product.lowStockAlert);

  useEffect(() => setQty((q) => Math.min(q, units ?? 99)), [units]);

  const images = useMemo(() => {
    const list = [selected.imageUrl, product.imageUrl, ...product.images].filter((x): x is string => !!x);
    return [...new Set(list)];
  }, [selected.imageUrl, product]);

  return (
    <div className="pd">
      <Gallery
        images={images}
        alt={product.name}
        badges={
          <>
            {pct > 0 && <span className="badge badge-sale">-{pct}%</span>}
            {reserve && <span className="badge badge-sage">Sob encomenda</span>}
            {sold && <span className="badge badge-dark">Esgotado</span>}
          </>
        }
      />

      <div className="pd-info">
        {product.category && (
          <Link href={`/loja?categoria=${product.category.slug}`} className="pd-cat">
            {product.category.name}
          </Link>
        )}
        <h1 className="pd-title">{product.name}</h1>

        <div className="pd-price">
          {isOnSale(selected) && <s>{formatBRL(selected.price)}</s>}
          <strong>{formatBRL(effectivePrice(selected))}</strong>
          {pct > 0 && <span className="badge badge-sale">Economize {pct}%</span>}
        </div>

        <p className="pd-desc">{product.description}</p>

        {options.length > 1 && (
          <fieldset className="pd-options">
            <legend>Escolha a opção</legend>
            <div className="pd-pills">
              {options.map((o) => {
                const out = o.stockStatus === "OUT_OF_STOCK";
                return (
                  <button
                    key={o.id || "base"}
                    type="button"
                    className={`pill ${o.id === optionId ? "is-active" : ""}`}
                    aria-pressed={o.id === optionId}
                    disabled={out}
                    onClick={() => setOptionId(o.id)}
                  >
                    <span>{o.label}</span>
                    <small>{out ? "Esgotado" : formatBRL(effectivePrice(o))}</small>
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        {!sold && (
          <div className="pd-buy">
            <QtyStepper value={qty} onChange={setQty} max={units} />
            <button
              type="button"
              className="btn btn-primary btn-lg pd-add"
              onClick={() => add(productLine(product, selected), qty)}
            >
              <ShoppingBag size={19} /> {reserve ? "Reservar" : "Adicionar à sacola"}
            </button>
          </div>
        )}
        {sold && (
          <button type="button" className="btn btn-lg btn-block" disabled>
            Produto esgotado
          </button>
        )}

        {note && (
          <p className="pd-note is-warn">
            <Sparkles size={15} /> {note}
          </p>
        )}
        {reserve && (
          <p className="pd-note">
            <PackageCheck size={15} /> Produto sob encomenda: combinamos o prazo de preparo com você pelo WhatsApp.
          </p>
        )}
        {units != null && units > 1 && qty >= units && (
          <p className="pd-note is-warn">Quantidade máxima disponível: {units}.</p>
        )}

        <AskWhatsapp number={whatsappNumber} text={`Olá! Tenho interesse no produto ${product.name}${options.length > 1 ? ` (${selected.label})` : ""}.\n${url}`} />

        <div className="pd-details">
          {product.benefits && (
            <details open>
              <summary>Benefícios</summary>
              <div className="pd-detail-body">
                <TextBlock text={product.benefits} />
              </div>
            </details>
          )}
          {product.ingredients && (
            <details open={!product.benefits}>
              <summary>Ingredientes</summary>
              <div className="pd-detail-body">
                <TextBlock text={product.ingredients} />
              </div>
            </details>
          )}
          <details>
            <summary>
              <Truck size={16} aria-hidden /> Entrega e pagamento
            </summary>
            <div className="pd-detail-body">
              <p>
                {deliveryInfo ||
                  "Pagamento e entrega são combinados pelo WhatsApp, de acordo com a sua região. O frete é informado antes da confirmação do pedido."}
              </p>
            </div>
          </details>
        </div>

        <ul className="pd-assure" aria-label="Diferenciais">
          <li>
            <Check size={15} /> Feito à mão
          </li>
          <li>
            <Check size={15} /> Ingredientes selecionados
          </li>
          <li>
            <Check size={15} /> Fórmula suave
          </li>
        </ul>
      </div>
    </div>
  );
}

export function KitDetail({
  kit,
  items,
  url,
  whatsappNumber,
}: {
  kit: KitDTO;
  items: ProductDTO[];
  url: string;
  whatsappNumber: string | null;
}) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const availability = kitAvailability(kit);
  const sold = availability === "soldout";
  const reserve = availability === "reserve";
  const pct = discountPercent(kit);
  const units = kit.stockStatus === "IN_STOCK" && kit.stockQuantity > 0 ? kit.stockQuantity : null;
  const images = [...new Set([kit.imageUrl, ...kit.images].filter((x): x is string => !!x))];
  const full = items.reduce((s, p) => s + effectivePrice(defaultOption(p)), 0);

  return (
    <div className="pd">
      <Gallery
        images={images}
        alt={`Kit ${kit.name}`}
        badges={
          <>
            <span className="badge badge-gold">Kit</span>
            {pct > 0 && <span className="badge badge-sale">-{pct}%</span>}
            {reserve && <span className="badge badge-sage">Sob encomenda</span>}
            {sold && <span className="badge badge-dark">Esgotado</span>}
          </>
        }
      />
      <div className="pd-info">
        <span className="pd-cat is-static">Kit especial</span>
        <h1 className="pd-title">{kit.name}</h1>
        <div className="pd-price">
          {isOnSale(kit) && <s>{formatBRL(kit.price)}</s>}
          <strong>{formatBRL(effectivePrice(kit))}</strong>
          {pct > 0 && <span className="badge badge-sale">Economize {pct}%</span>}
        </div>
        {kit.description && <p className="pd-desc">{kit.description}</p>}
        {full > effectivePrice(kit) + 0.5 && items.length > 1 && (
          <p className="pd-note is-good">
            <Sparkles size={15} /> Comprando separado: {formatBRL(full)}. No kit você economiza {formatBRL(full - effectivePrice(kit))}.
          </p>
        )}

        {!sold ? (
          <div className="pd-buy">
            <QtyStepper value={qty} onChange={setQty} max={units} />
            <button type="button" className="btn btn-primary btn-lg pd-add" onClick={() => add(kitLine(kit), qty)}>
              <ShoppingBag size={19} /> {reserve ? "Reservar kit" : "Adicionar à sacola"}
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn-lg btn-block" disabled>
            Kit esgotado
          </button>
        )}

        <AskWhatsapp number={whatsappNumber} text={`Olá! Tenho interesse no Kit ${kit.name}.\n${url}`} />

        <div className="kit-items">
          <h2>Este kit inclui</h2>
          <ul>
            {items.map((p) => (
              <li key={p.id}>
                <Link href={`/produto/${p.slug}`} className="kit-item">
                  <span className="kit-item-img img-wrap">
                    <SmartImage src={p.imageUrl || p.images[0]} alt="" fill sizes="64px" />
                  </span>
                  <span>
                    <strong>{p.name}</strong>
                    {p.size && <small>{p.size}</small>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
