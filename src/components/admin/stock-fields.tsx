"use client";

import { STOCK_STATUSES, type StockStatus } from "@/lib/types";
import { STOCK_LABEL } from "@/lib/labels";

const HELP: Record<StockStatus, string> = {
  IN_STOCK: "Pronto para entrega. Com quantidade 0, a loja não limita as vendas.",
  IN_PRODUCTION: "Cliente pode reservar; você produz depois de receber o pedido.",
  OUT_OF_STOCK: "Aparece na loja como esgotado e não pode ser comprado.",
};

export default function StockFields({
  status,
  quantity,
  onStatus,
  onQuantity,
  idPrefix,
  compact = false,
}: {
  status: StockStatus;
  quantity: string;
  onStatus: (s: StockStatus) => void;
  onQuantity: (q: string) => void;
  idPrefix: string;
  compact?: boolean;
}) {
  return (
    <div className={`form-row ${compact ? "is-compact" : ""}`}>
      <div className="field">
        <label htmlFor={`${idPrefix}-status`}>Disponibilidade</label>
        <select id={`${idPrefix}-status`} className="select" value={status} onChange={(e) => onStatus(e.target.value as StockStatus)}>
          {STOCK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STOCK_LABEL[s]}
            </option>
          ))}
        </select>
        {!compact && <span className="hint">{HELP[status]}</span>}
      </div>
      {status === "IN_STOCK" && (
        <div className="field">
          <label htmlFor={`${idPrefix}-qty`}>Quantidade em estoque</label>
          <input id={`${idPrefix}-qty`} className="input" inputMode="numeric" value={quantity} onChange={(e) => onQuantity(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="0" />
        </div>
      )}
    </div>
  );
}
