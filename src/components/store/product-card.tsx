"use client";

import Link from "next/link";
import { ArrowRight, Check, Plus, Star } from "lucide-react";
import { useState } from "react";
import SmartImage from "@/components/ui/smart-image";
import { useCart } from "./cart";
import { kitLine, productLine } from "./cart-helpers";
import { discountPercent, effectivePrice, isOnSale } from "@/lib/pricing";
import { defaultOption, kitAvailability, productAvailability, productOptions, startingPrice } from "@/lib/stock";
import { formatBRL } from "@/lib/format";
import type { KitDTO, ProductDTO } from "@/lib/types";

function useJustAdded() {
  const [done, setDone] = useState(false);
  const flash = () => {
    setDone(true);
    window.setTimeout(() => setDone(false), 1400);
  };
  return [done, flash] as const;
}

export function ProductCard({ product, priority = false }: { product: ProductDTO; priority?: boolean }) {
  const { add } = useCart();
  const [added, flash] = useJustAdded();
  const availability = productAvailability(product);
  const options = productOptions(product);
  const hasChoices = product.variants.length > 0;
  const base = defaultOption(product);
  const pct = hasChoices ? 0 : discountPercent(base);
  const gallery = [product.imageUrl, ...product.images].filter(Boolean) as string[];
  const second = gallery[1];
  const sold = availability === "soldout";
  const price = hasChoices ? startingPrice(product) : effectivePrice(base);

  return (
    <article className={`pcard ${sold ? "is-sold" : ""}`}>
      <Link href={`/produto/${product.slug}`} className="pcard-media-link" tabIndex={-1} aria-hidden>
        <div className="pcard-media img-wrap">
          <SmartImage
            src={gallery[0]}
            alt=""
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 25vw"
            className="pcard-img"
            loading={priority ? "eager" : "lazy"}
          />
          {second && <SmartImage src={second} alt="" fill sizes="(max-width: 640px) 50vw, 25vw" className="pcard-img pcard-img-alt" />}
          <div className="pcard-badges">
            {pct > 0 && <span className="badge badge-sale">-{pct}%</span>}
            {product.isFeatured && !sold && (
              <span className="badge badge-gold">
                <Star size={11} fill="currentColor" /> Destaque
              </span>
            )}
            {availability === "reserve" && <span className="badge badge-sage">Sob encomenda</span>}
            {sold && <span className="badge badge-dark">Esgotado</span>}
          </div>
        </div>
      </Link>

      <div className="pcard-body">
        <Link href={`/produto/${product.slug}`} className="pcard-info">
          {product.category && <span className="pcard-cat">{product.category.name}</span>}
          <h3 className="pcard-name">{product.name}</h3>
          <p className="pcard-meta">{hasChoices ? `${options.length} opções` : product.size || "\u00a0"}</p>
        </Link>

        <div className="pcard-foot">
          <div className="pcard-price">
            {hasChoices && <span className="pcard-from">a partir de</span>}
            {!hasChoices && isOnSale(base) && <s>{formatBRL(base.price)}</s>}
            <strong>{formatBRL(price)}</strong>
          </div>

          {!sold &&
            (hasChoices ? (
              <Link href={`/produto/${product.slug}`} className="pcard-add" aria-label={`Ver opções de ${product.name}`} title="Ver opções">
                <ArrowRight size={20} />
              </Link>
            ) : (
              <button
                type="button"
                className={`pcard-add ${availability === "reserve" ? "is-text" : ""} ${added ? "is-done" : ""}`}
                aria-label={availability === "reserve" ? `Reservar ${product.name}` : `Adicionar ${product.name} à sacola`}
                onClick={() => {
                  add(productLine(product, base));
                  flash();
                }}
              >
                {added ? <Check size={18} /> : availability === "reserve" ? "Reservar" : <Plus size={20} />}
              </button>
            ))}
        </div>
      </div>
    </article>
  );
}

export function KitCard({ kit, items }: { kit: KitDTO; items: { id: string; name: string }[] }) {
  const { add } = useCart();
  const [added, flash] = useJustAdded();
  const availability = kitAvailability(kit);
  const pct = discountPercent(kit);
  const sold = availability === "soldout";
  const names = items.slice(0, 3).map((i) => i.name);
  const more = items.length - names.length;

  return (
    <article className={`pcard kcard ${sold ? "is-sold" : ""}`}>
      <Link href={`/kit/${kit.slug}`} className="pcard-media-link" tabIndex={-1} aria-hidden>
        <div className="pcard-media img-wrap">
          <SmartImage src={kit.imageUrl || kit.images[0]} alt="" fill sizes="(max-width: 640px) 100vw, 33vw" className="pcard-img" />
          <div className="pcard-badges">
            <span className="badge badge-gold">Kit</span>
            {pct > 0 && <span className="badge badge-sale">-{pct}%</span>}
            {sold && <span className="badge badge-dark">Esgotado</span>}
            {availability === "reserve" && <span className="badge badge-sage">Sob encomenda</span>}
          </div>
        </div>
      </Link>
      <div className="pcard-body">
        <Link href={`/kit/${kit.slug}`} className="pcard-info">
          <h3 className="pcard-name">{kit.name}</h3>
          <p className="pcard-meta">
            {names.join(" · ")}
            {more > 0 ? ` +${more}` : ""}
          </p>
        </Link>
        <div className="pcard-foot">
          <div className="pcard-price">
            {pct > 0 && <s>{formatBRL(kit.price)}</s>}
            <strong>{formatBRL(effectivePrice(kit))}</strong>
          </div>
          {!sold && (
            <button
              type="button"
              className={`pcard-add ${added ? "is-done" : ""}`}
              aria-label={`Adicionar kit ${kit.name} à sacola`}
              onClick={() => {
                add(kitLine(kit));
                flash();
              }}
            >
              {added ? <Check size={18} /> : <Plus size={20} />}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
