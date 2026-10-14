"use client";

import { useState } from "react";
import { Pencil, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { createBag, deleteBag, setBagActive, updateBag } from "@/actions/kits";
import { SingleImage } from "@/components/admin/image-uploader";
import { EmptyBlock } from "@/components/admin/ui";
import { useRun } from "@/components/admin/use-run";
import { useConfirm } from "@/components/ui/confirm";
import SmartImage from "@/components/ui/smart-image";
import { formatBRL, moneyToInput, parseMoney } from "@/lib/format";
import { bagSellingPrice } from "@/lib/pricing";
import type { AdminBagDTO } from "@/lib/admin-types";

type Draft = { id: string | null; name: string; imageUrl: string | null; amountPaid: string; quantity: string; margin: string; isActive: boolean; notes: string };

const blank: Draft = { id: null, name: "", imageUrl: null, amountPaid: "", quantity: "10", margin: "100", isActive: true, notes: "" };

export default function BagManager({ bags }: { bags: AdminBagDTO[] }) {
  const { run, busy, busyKey } = useRun();
  const confirm = useConfirm();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);

  const edit = (b: AdminBagDTO) =>
    setDraft({ id: b.id, name: b.name, imageUrl: b.imageUrl, amountPaid: moneyToInput(b.amountPaid), quantity: String(b.quantity), margin: String(b.margin), isActive: b.isActive, notes: b.notes ?? "" });

  const paid = draft ? parseMoney(draft.amountPaid) : NaN;
  const qty = draft ? Number(draft.quantity) : NaN;
  const margin = draft ? parseMoney(draft.margin) : NaN;
  const preview = Number.isFinite(paid) && qty >= 1 && Number.isFinite(margin) ? bagSellingPrice({ amountPaid: paid, quantity: qty, margin }) : null;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    setError(null);
    if (!Number.isFinite(paid)) return setError("Informe quanto você pagou pelo lote de sacolas.");
    if (!(qty >= 1)) return setError("Informe quantas sacolas vieram no lote.");
    const input = { name: draft.name, imageUrl: draft.imageUrl, amountPaid: paid, quantity: qty, margin: Number.isFinite(margin) ? margin : 0, isActive: draft.isActive, notes: draft.notes };
    await run(() => (draft.id ? updateBag(draft.id, input) : createBag(input)), { success: draft.id ? "Sacola salva." : "Sacola cadastrada.", onDone: () => setDraft(null), onError: setError });
  };

  const remove = async (b: AdminBagDTO) => {
    const ok = await confirm({ title: `Excluir “${b.name}”?`, confirmLabel: "Excluir", tone: "danger" });
    if (ok) await run(() => deleteBag(b.id), { success: "Sacola excluída." });
  };

  return (
    <div className="stack">
      <div>
        <button type="button" className="btn btn-primary" onClick={() => { setError(null); setDraft({ ...blank }); }}>
          <Plus size={17} /> Nova sacola
        </button>
      </div>

      {bags.length === 0 ? (
        <EmptyBlock icon={<ShoppingBag size={26} />} title="Nenhuma sacola cadastrada">
          As sacolas são o embrulho do “Monte seu presente”. Informe quanto pagou e a margem, e o preço de venda é calculado.
        </EmptyBlock>
      ) : (
        <ul className="product-rows">
          {bags.map((b) => (
            <li key={b.id} className={`prow card ${b.isActive ? "" : "is-hidden"}`}>
              <button type="button" className="prow-main" onClick={() => edit(b)}>
                <span className="prow-img">
                  <SmartImage src={b.imageUrl} alt="" fill sizes="72px" style={{ objectFit: "cover" }} />
                </span>
                <span className="prow-info">
                  <strong>{b.name}</strong>
                  <small>
                    Custo {formatBRL(b.amountPaid / Math.max(1, b.quantity))} cada · margem {b.margin}%
                  </small>
                  <span className="prow-meta">
                    <b>Venda {formatBRL(b.price)}</b>
                    {!b.isActive && <span className="badge badge-dark">Oculta</span>}
                  </span>
                </span>
              </button>
              <div className="prow-actions">
                <label className="switch" title="Disponível no site">
                  <input type="checkbox" checked={b.isActive} disabled={busyKey === b.id} onChange={(e) => run(() => setBagActive(b.id, e.target.checked), { success: e.target.checked ? "Sacola disponível." : "Sacola oculta." }, b.id)} />
                  <span className="sr-only">Disponível no site</span>
                </label>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => edit(b)}>
                  <Pencil size={14} /> Editar
                </button>
                <button type="button" className="btn btn-ghost btn-icon btn-danger-text" onClick={() => remove(b)} aria-label={`Excluir ${b.name}`}>
                  <Trash2 size={17} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {draft && (
        <div className="dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setDraft(null)}>
          <form className="dialog dialog-wide" role="dialog" aria-modal="true" aria-labelledby="bag-title" onSubmit={save} noValidate>
            <h3 id="bag-title">{draft.id ? "Editar sacola" : "Nova sacola"}</h3>
            <div className="bag-form">
              <SingleImage value={draft.imageUrl} onChange={(u) => setDraft({ ...draft, imageUrl: u })} label="Foto" />
              <div className="field grow">
                <label htmlFor="b-name">Nome</label>
                <input id="b-name" className="input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} maxLength={80} placeholder="Ex.: Sacola Kraft Lavena" />
              </div>
            </div>
            <div className="form-row is-compact">
              <div className="field">
                <label htmlFor="b-paid">Valor pago no lote (R$)</label>
                <input id="b-paid" className="input" inputMode="decimal" value={draft.amountPaid} onChange={(e) => setDraft({ ...draft, amountPaid: e.target.value })} />
              </div>
              <div className="field">
                <label htmlFor="b-qty">Sacolas no lote</label>
                <input id="b-qty" className="input" inputMode="numeric" value={draft.quantity} onChange={(e) => setDraft({ ...draft, quantity: e.target.value.replace(/\D/g, "") })} />
              </div>
              <div className="field">
                <label htmlFor="b-margin">Margem (%)</label>
                <input id="b-margin" className="input" inputMode="decimal" value={draft.margin} onChange={(e) => setDraft({ ...draft, margin: e.target.value })} />
              </div>
            </div>
            <p className="price-preview">
              Preço de venda: <strong>{preview !== null ? formatBRL(preview) : "—"}</strong>
            </p>
            <div className="field">
              <label htmlFor="b-notes">Observações</label>
              <input id="b-notes" className="input" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} maxLength={500} placeholder="Opcional" />
            </div>
            <label className="check">
              <input type="checkbox" checked={draft.isActive} onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })} />
              <span>Disponível no “Monte seu presente”</span>
            </label>
            {error && <p className="error-text" role="alert">{error}</p>}
            <div className="dialog-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setDraft(null)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? "Salvando…" : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
