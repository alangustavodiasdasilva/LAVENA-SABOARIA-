"use client";

import { useMemo, useState } from "react";
import { Calculator, Pencil, Plus, Trash2, X } from "lucide-react";
import { createMaterial, createRecipe, deleteMaterial, deleteRecipe, updateMaterial, updateRecipe } from "@/actions/pricing";
import { EmptyBlock } from "@/components/admin/ui";
import { useRun } from "@/components/admin/use-run";
import { useConfirm } from "@/components/ui/confirm";
import { formatBRL, moneyToInput, parseMoney } from "@/lib/format";
import { baseUnitLabel, calcRecipe, costPerBaseUnit } from "@/lib/pricing";
import type { MaterialDTO, RecipeDTO } from "@/lib/admin-types";

type ProductOpt = { id: string; name: string };
type MatDraft = { id: string | null; name: string; amountPaid: string; quantity: string; unit: string; notes: string };
type RecipeDraft = {
  id: string | null;
  name: string;
  productId: string;
  batchYield: string;
  profitMargin: string;
  laborCost: string;
  packagingCost: string;
  notes: string;
  items: { materialId: string; quantity: string }[];
};

const UNITS = [
  { v: "g", l: "gramas (g)" },
  { v: "kg", l: "quilos (kg)" },
  { v: "ml", l: "mililitros (ml)" },
  { v: "l", l: "litros (L)" },
  { v: "un", l: "unidades" },
];

const num = (s: string) => {
  const n = parseMoney(s);
  return Number.isFinite(n) ? n : 0;
};

export default function PricingManager({ materials, recipes, products }: { materials: MaterialDTO[]; recipes: RecipeDTO[]; products: ProductOpt[] }) {
  const { run, busy } = useRun();
  const confirm = useConfirm();
  const [mat, setMat] = useState<MatDraft | null>(null);
  const [rec, setRec] = useState<RecipeDraft | null>(null);
  const [error, setError] = useState<string | null>(null);

  const matById = useMemo(() => new Map(materials.map((m) => [m.id, m])), [materials]);

  const live = useMemo(() => {
    if (!rec) return null;
    return calcRecipe({
      items: rec.items.map((i) => ({ materialId: i.materialId, quantity: num(i.quantity) })),
      materials,
      batchYield: Math.max(1, Number(rec.batchYield) || 1),
      profitMargin: num(rec.profitMargin),
      laborCost: num(rec.laborCost),
      packagingCost: num(rec.packagingCost),
    });
  }, [rec, materials]);

  const saveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mat) return;
    setError(null);
    const input = { name: mat.name, amountPaid: num(mat.amountPaid), quantity: num(mat.quantity), unit: mat.unit as "g", notes: mat.notes };
    await run(() => (mat.id ? updateMaterial(mat.id, input) : createMaterial(input)), { success: "Matéria-prima salva.", onDone: () => setMat(null), onError: setError });
  };

  const saveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rec) return;
    setError(null);
    const input = {
      name: rec.name,
      productId: rec.productId || null,
      batchYield: Number(rec.batchYield) || 0,
      profitMargin: num(rec.profitMargin),
      laborCost: num(rec.laborCost),
      packagingCost: num(rec.packagingCost),
      notes: rec.notes,
      items: rec.items.filter((i) => i.materialId && num(i.quantity) > 0).map((i) => ({ materialId: i.materialId, quantity: num(i.quantity) })),
    };
    await run(() => (rec.id ? updateRecipe(rec.id, input) : createRecipe(input)), { success: "Receita salva.", onDone: () => setRec(null), onError: setError });
  };

  const delMat = async (m: MaterialDTO) => {
    if (await confirm({ title: `Excluir “${m.name}”?`, message: "Receitas que usam esta matéria-prima deixam de contá-la.", confirmLabel: "Excluir", tone: "danger" })) await run(() => deleteMaterial(m.id), { success: "Matéria-prima excluída." });
  };
  const delRec = async (r: RecipeDTO) => {
    if (await confirm({ title: `Excluir a receita “${r.name}”?`, confirmLabel: "Excluir", tone: "danger" })) await run(() => deleteRecipe(r.id), { success: "Receita excluída." });
  };

  const recipeSummary = (r: RecipeDTO) =>
    calcRecipe({ items: r.items, materials, batchYield: r.batchYield, profitMargin: r.profitMargin, laborCost: r.laborCost, packagingCost: r.packagingCost });

  return (
    <div className="stack">
      <section className="card panel">
        <div className="panel-head">
          <h2>Matérias-primas</h2>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setError(null); setMat({ id: null, name: "", amountPaid: "", quantity: "", unit: "g", notes: "" }); }}>
            <Plus size={15} /> Adicionar
          </button>
        </div>
        {materials.length === 0 ? (
          <p className="soft small">Cadastre o que você compra (óleos, essências, base, corantes) com o valor pago e a quantidade. O custo por grama/ml é calculado sozinho.</p>
        ) : (
          <ul className="simple-list">
            {materials.map((m) => (
              <li key={m.id}>
                <div className="grow">
                  <strong>{m.name}</strong>
                  <small>
                    {formatBRL(m.amountPaid)} por {m.quantity} {m.unit} · {formatBRL(costPerBaseUnit(m))} por {baseUnitLabel(m.unit)}
                  </small>
                </div>
                <button type="button" className="btn btn-ghost btn-icon" aria-label={`Editar ${m.name}`} onClick={() => { setError(null); setMat({ id: m.id, name: m.name, amountPaid: moneyToInput(m.amountPaid), quantity: String(m.quantity), unit: m.unit, notes: m.notes ?? "" }); }}>
                  <Pencil size={17} />
                </button>
                <button type="button" className="btn btn-ghost btn-icon btn-danger-text" aria-label={`Excluir ${m.name}`} onClick={() => delMat(m)}>
                  <Trash2 size={17} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card panel">
        <div className="panel-head">
          <h2>Receitas e preço sugerido</h2>
          <button type="button" className="btn btn-primary btn-sm" disabled={materials.length === 0} onClick={() => { setError(null); setRec({ id: null, name: "", productId: "", batchYield: "10", profitMargin: "100", laborCost: "", packagingCost: "", notes: "", items: [{ materialId: materials[0]?.id ?? "", quantity: "" }] }); }}>
            <Plus size={15} /> Nova receita
          </button>
        </div>
        {recipes.length === 0 ? (
          <EmptyBlock icon={<Calculator size={24} />} title="Nenhuma receita ainda">
            {materials.length === 0 ? "Cadastre as matérias-primas primeiro." : "Monte uma receita para descobrir o custo de cada unidade e o preço de venda ideal."}
          </EmptyBlock>
        ) : (
          <ul className="simple-list">
            {recipes.map((r) => {
              const c = recipeSummary(r);
              return (
                <li key={r.id}>
                  <div className="grow">
                    <strong>{r.name}</strong>
                    <small>
                      Rende {r.batchYield} · custo {formatBRL(c.costPerUnit)} cada · margem {r.profitMargin}%
                    </small>
                  </div>
                  <div className="recipe-price">
                    <small>Preço sugerido</small>
                    <b>{formatBRL(c.suggestedPrice)}</b>
                  </div>
                  <button type="button" className="btn btn-ghost btn-icon" aria-label={`Editar ${r.name}`} onClick={() => { setError(null); setRec({ id: r.id, name: r.name, productId: r.productId ?? "", batchYield: String(r.batchYield), profitMargin: String(r.profitMargin), laborCost: r.laborCost ? moneyToInput(r.laborCost) : "", packagingCost: r.packagingCost ? moneyToInput(r.packagingCost) : "", notes: r.notes ?? "", items: r.items.map((i) => ({ materialId: i.materialId, quantity: String(i.quantity).replace(".", ",") })) }); }}>
                    <Pencil size={17} />
                  </button>
                  <button type="button" className="btn btn-ghost btn-icon btn-danger-text" aria-label={`Excluir ${r.name}`} onClick={() => delRec(r)}>
                    <Trash2 size={17} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {mat && (
        <div className="dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setMat(null)}>
          <form className="dialog dialog-wide" role="dialog" aria-modal="true" aria-labelledby="mat-title" onSubmit={saveMaterial} noValidate>
            <h3 id="mat-title">{mat.id ? "Editar matéria-prima" : "Nova matéria-prima"}</h3>
            <div className="field">
              <label htmlFor="m-name">Nome</label>
              <input id="m-name" className="input" value={mat.name} onChange={(e) => setMat({ ...mat, name: e.target.value })} maxLength={80} placeholder="Ex.: Base de glicerina" />
            </div>
            <div className="form-row is-compact">
              <div className="field">
                <label htmlFor="m-paid">Valor pago (R$)</label>
                <input id="m-paid" className="input" inputMode="decimal" value={mat.amountPaid} onChange={(e) => setMat({ ...mat, amountPaid: e.target.value })} />
              </div>
              <div className="field">
                <label htmlFor="m-qty">Quantidade comprada</label>
                <input id="m-qty" className="input" inputMode="decimal" value={mat.quantity} onChange={(e) => setMat({ ...mat, quantity: e.target.value })} />
              </div>
              <div className="field">
                <label htmlFor="m-unit">Unidade</label>
                <select id="m-unit" className="select" value={mat.unit} onChange={(e) => setMat({ ...mat, unit: e.target.value })}>
                  {UNITS.map((u) => (
                    <option key={u.v} value={u.v}>
                      {u.l}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {num(mat.quantity) > 0 && (
              <p className="price-preview">
                Custo por {baseUnitLabel(mat.unit)}: <strong>{formatBRL(costPerBaseUnit({ amountPaid: num(mat.amountPaid), quantity: num(mat.quantity), unit: mat.unit }))}</strong>
              </p>
            )}
            {error && <p className="error-text" role="alert">{error}</p>}
            <div className="dialog-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setMat(null)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? "Salvando…" : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      )}

      {rec && live && (
        <div className="dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setRec(null)}>
          <form className="dialog dialog-wide dialog-scroll" role="dialog" aria-modal="true" aria-labelledby="rec-title" onSubmit={saveRecipe} noValidate>
            <h3 id="rec-title">{rec.id ? "Editar receita" : "Nova receita"}</h3>
            <div className="form-row is-compact">
              <div className="field">
                <label htmlFor="r-name">Nome</label>
                <input id="r-name" className="input" value={rec.name} onChange={(e) => setRec({ ...rec, name: e.target.value })} maxLength={80} placeholder="Ex.: Sabonete de lavanda (lote)" />
              </div>
              <div className="field">
                <label htmlFor="r-prod">Produto relacionado</label>
                <select id="r-prod" className="select" value={rec.productId} onChange={(e) => setRec({ ...rec, productId: e.target.value })}>
                  <option value="">Nenhum</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field">
              <span className="field-label">Ingredientes usados no lote</span>
              <div className="recipe-items">
                {rec.items.map((it, idx) => {
                  const m = matById.get(it.materialId);
                  return (
                    <div className="recipe-item" key={idx}>
                      <select className="select" value={it.materialId} onChange={(e) => setRec({ ...rec, items: rec.items.map((x, i) => (i === idx ? { ...x, materialId: e.target.value } : x)) })} aria-label="Matéria-prima">
                        {materials.map((mm) => (
                          <option key={mm.id} value={mm.id}>
                            {mm.name}
                          </option>
                        ))}
                      </select>
                      <div className="with-unit">
                        <input className="input" inputMode="decimal" value={it.quantity} onChange={(e) => setRec({ ...rec, items: rec.items.map((x, i) => (i === idx ? { ...x, quantity: e.target.value } : x)) })} placeholder="0" aria-label="Quantidade usada" />
                        <span>{m ? baseUnitLabel(m.unit) : ""}</span>
                      </div>
                      <button type="button" className="btn btn-ghost btn-icon" aria-label="Remover ingrediente" onClick={() => setRec({ ...rec, items: rec.items.filter((_, i) => i !== idx) })}>
                        <X size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRec({ ...rec, items: [...rec.items, { materialId: materials[0]?.id ?? "", quantity: "" }] })}>
                <Plus size={15} /> Adicionar ingrediente
              </button>
            </div>

            <div className="form-row is-compact">
              <div className="field">
                <label htmlFor="r-yield">Quantas unidades rende</label>
                <input id="r-yield" className="input" inputMode="numeric" value={rec.batchYield} onChange={(e) => setRec({ ...rec, batchYield: e.target.value.replace(/\D/g, "") })} />
              </div>
              <div className="field">
                <label htmlFor="r-labor">Mão de obra (R$)</label>
                <input id="r-labor" className="input" inputMode="decimal" value={rec.laborCost} onChange={(e) => setRec({ ...rec, laborCost: e.target.value })} placeholder="0,00" />
              </div>
              <div className="field">
                <label htmlFor="r-pack">Embalagem (R$)</label>
                <input id="r-pack" className="input" inputMode="decimal" value={rec.packagingCost} onChange={(e) => setRec({ ...rec, packagingCost: e.target.value })} placeholder="0,00" />
              </div>
              <div className="field">
                <label htmlFor="r-margin">Margem (%)</label>
                <input id="r-margin" className="input" inputMode="decimal" value={rec.profitMargin} onChange={(e) => setRec({ ...rec, profitMargin: e.target.value })} />
              </div>
            </div>

            <dl className="calc-result" aria-live="polite">
              <div>
                <dt>Custo do lote</dt>
                <dd>{formatBRL(live.batchTotal)}</dd>
              </div>
              <div>
                <dt>Custo por unidade</dt>
                <dd>{formatBRL(live.costPerUnit)}</dd>
              </div>
              <div className="is-main">
                <dt>Preço sugerido</dt>
                <dd>{formatBRL(live.suggestedPrice)}</dd>
              </div>
              <div>
                <dt>Lucro por unidade</dt>
                <dd>{formatBRL(live.profitPerUnit)}</dd>
              </div>
            </dl>

            {error && <p className="error-text" role="alert">{error}</p>}
            <div className="dialog-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setRec(null)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? "Salvando…" : "Salvar receita"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
