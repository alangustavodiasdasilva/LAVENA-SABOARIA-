"use client";

import { useState } from "react";
import { Boxes, Minus, Plus, Search } from "lucide-react";
import { adjustProductStock, adjustVariantStock, setProductStock, setProductStockStatus, setVariantStock, setVariantStockStatus } from "@/actions/catalog";
import { EmptyBlock } from "@/components/admin/ui";
import { useRun } from "@/components/admin/use-run";
import SmartImage from "@/components/ui/smart-image";
import { STOCK_LABEL } from "@/lib/labels";
import { STOCK_STATUSES, type ProductDTO, type StockStatus } from "@/lib/types";

type RowProps = {
  id: string;
  label: string | null;
  status: StockStatus;
  quantity: number;
  low: number;
  kind: "product" | "variant";
};

function StockRow({ id, label, status, quantity, low, kind }: RowProps) {
  const { run, busy } = useRun();
  const [draft, setDraft] = useState<string | null>(null);

  const adjust = (d: number) => run(() => (kind === "product" ? adjustProductStock(id, d) : adjustVariantStock(id, d)));
  const commit = async () => {
    if (draft === null) return;
    const n = draft.trim() === "" ? 0 : Number(draft);
    setDraft(null);
    if (!Number.isInteger(n) || n < 0 || n === quantity) return;
    await run(() => (kind === "product" ? setProductStock(id, n) : setVariantStock(id, n)), { success: "Estoque atualizado." });
  };
  const changeStatus = (s: StockStatus) => run(() => (kind === "product" ? setProductStockStatus(id, s) : setVariantStockStatus(id, s)), { success: "Disponibilidade atualizada." });

  const isLow = status === "IN_STOCK" && quantity > 0 && quantity <= Math.max(1, low);
  return (
    <div className={`srow ${isLow ? "is-low" : ""}`}>
      <span className="srow-label">{label ?? "Único"}</span>
      <select className="select select-sm" value={status} disabled={busy} onChange={(e) => changeStatus(e.target.value as StockStatus)} aria-label={`Disponibilidade${label ? ` de ${label}` : ""}`}>
        {STOCK_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STOCK_LABEL[s]}
          </option>
        ))}
      </select>
      {status === "IN_STOCK" ? (
        <div className="stock-stepper" role="group" aria-label={`Quantidade${label ? ` de ${label}` : ""}`}>
          <button type="button" onClick={() => adjust(-1)} disabled={busy || quantity <= 0} aria-label="Diminuir">
            <Minus size={15} />
          </button>
          <input
            inputMode="numeric"
            value={draft ?? String(quantity)}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setDraft(e.target.value.replace(/\D/g, "").slice(0, 6))}
            onBlur={commit}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            aria-label="Quantidade em estoque"
          />
          <button type="button" onClick={() => adjust(1)} disabled={busy} aria-label="Aumentar">
            <Plus size={15} />
          </button>
        </div>
      ) : (
        <span className="stock-none">—</span>
      )}
    </div>
  );
}

export default function StockManager({ products }: { products: ProductDTO[] }) {
  const [q, setQ] = useState("");
  const list = products.filter((p) => !q.trim() || p.name.toLowerCase().includes(q.trim().toLowerCase()));

  if (products.length === 0) {
    return (
      <EmptyBlock icon={<Boxes size={26} />} title="Sem produtos para controlar">
        Cadastre produtos para acompanhar o estoque aqui.
      </EmptyBlock>
    );
  }
  return (
    <>
      <div className="toolbar">
        <div className="search-field">
          <Search size={17} aria-hidden />
          <input className="input" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar produto" aria-label="Buscar produto" />
        </div>
      </div>
      <p className="hint stock-hint">Quantidade 0 com “Em estoque” significa venda sem limite. Defina uma quantidade para a loja avisar quando estiver acabando.</p>
      <ul className="stock-list">
        {list.map((p) => (
          <li key={p.id} className="card stock-card">
            <div className="stock-card-head">
              <span className="prow-img is-sm">
                <SmartImage src={p.imageUrl || p.images[0]} alt="" fill sizes="48px" style={{ objectFit: "cover" }} />
              </span>
              <div>
                <strong>{p.name}</strong>
                <small>{p.category?.name}</small>
              </div>
            </div>
            <StockRow id={p.id} kind="product" label={p.variants.length > 0 ? p.size || "Padrão" : null} status={p.stockStatus} quantity={p.stockQuantity} low={p.lowStockAlert} />
            {p.variants.map((v) => (
              <StockRow key={v.id} id={v.id} kind="variant" label={v.name} status={v.stockStatus} quantity={v.stockQuantity} low={p.lowStockAlert} />
            ))}
          </li>
        ))}
      </ul>
    </>
  );
}
