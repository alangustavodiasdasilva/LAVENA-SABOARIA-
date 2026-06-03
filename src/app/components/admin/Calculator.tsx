"use client";

import React, { useState, useMemo } from "react";
import {
  getMaterials, createMaterial, updateMaterial, deleteMaterial,
  getRecipes, createRecipe, updateRecipe, deleteRecipe,
} from "../../actions";
import {
  Plus, Trash2, Edit2, Save, X, Calculator as CalcIcon,
  Beaker, ChevronDown, FileText,
} from "lucide-react";

type Unit = "g" | "kg" | "ml" | "l" | "un";

type Material = {
  id: string;
  name: string;
  amountPaid: number;
  quantity: number;
  unit: string;
  notes?: string | null;
};

type RecipeItem = { materialId: string; quantity: number };

type Recipe = {
  id: string;
  name: string;
  productId?: string | null;
  batchYield: number;
  profitMargin: number;
  itemsJson: RecipeItem[] | any;
  laborCost: number;
  packagingCost: number;
  notes?: string | null;
};

type Product = { id: string; name: string };

const emptyMaterial = { id: "", name: "", amountPaid: "", quantity: "", unit: "g" as Unit, notes: "" };
const emptyRecipe = {
  id: "",
  name: "",
  productId: "",
  batchYield: "1",
  profitMargin: "100",
  items: [] as RecipeItem[],
  laborCost: "0",
  packagingCost: "0",
  notes: "",
};

const UNIT_OPTIONS: { value: Unit; label: string }[] = [
  { value: "g", label: "g (gramas)" },
  { value: "kg", label: "kg (quilos)" },
  { value: "ml", label: "ml (mililitros)" },
  { value: "l", label: "l (litros)" },
  { value: "un", label: "un (unidades)" },
];

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

// Normaliza unidade pra base (g ou ml ou un)
function toBaseUnit(qty: number, unit: string): { value: number; baseUnit: string } {
  if (unit === "kg") return { value: qty * 1000, baseUnit: "g" };
  if (unit === "l") return { value: qty * 1000, baseUnit: "ml" };
  return { value: qty, baseUnit: unit };
}

function costPerBaseUnit(m: Material): number {
  const base = toBaseUnit(m.quantity, m.unit).value;
  if (base === 0) return 0;
  return m.amountPaid / base;
}

function baseLabel(unit: string): string {
  if (unit === "g" || unit === "kg") return "g";
  if (unit === "ml" || unit === "l") return "ml";
  return "un";
}

export default function Calculator({
  initialMaterials,
  initialRecipes,
  products,
  showToast,
}: {
  initialMaterials: Material[];
  initialRecipes: Recipe[];
  products: Product[];
  showToast: (type: "success" | "error", msg: string) => void;
}) {
  const [materials, setMaterials] = useState<Material[]>(initialMaterials);
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
  const [section, setSection] = useState<"materials" | "recipes">("recipes");

  const [matForm, setMatForm] = useState({ ...emptyMaterial });
  const [matEditing, setMatEditing] = useState(false);

  const [recipeForm, setRecipeForm] = useState({ ...emptyRecipe });
  const [recipeModal, setRecipeModal] = useState(false);
  const [recipeError, setRecipeError] = useState("");

  async function refreshMats() {
    const data = await getMaterials();
    setMaterials(data as any);
  }
  async function refreshRecs() {
    const data = await getRecipes();
    setRecipes(data as any);
  }

  // ─── MATERIAIS ───
  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountPaid = parseFloat(matForm.amountPaid.replace(",", "."));
    const quantity = parseFloat(matForm.quantity.replace(",", "."));
    if (Number.isNaN(amountPaid) || amountPaid < 0) {
      showToast("error", "Valor pago inválido.");
      return;
    }
    if (Number.isNaN(quantity) || quantity <= 0) {
      showToast("error", "Quantidade deve ser maior que zero.");
      return;
    }
    const payload = {
      name: matForm.name.trim(),
      amountPaid,
      quantity,
      unit: matForm.unit,
      notes: matForm.notes.trim() || undefined,
    };
    try {
      if (matForm.id) {
        await updateMaterial(matForm.id, payload);
        showToast("success", "Matéria-prima atualizada.");
      } else {
        await createMaterial(payload);
        showToast("success", "Matéria-prima adicionada.");
      }
      setMatForm({ ...emptyMaterial });
      setMatEditing(false);
      await refreshMats();
    } catch (err: any) {
      showToast("error", err?.message || "Erro ao salvar.");
    }
  };

  const editMaterial = (m: Material) => {
    setMatForm({
      id: m.id,
      name: m.name,
      amountPaid: m.amountPaid.toString().replace(".", ","),
      quantity: m.quantity.toString().replace(".", ","),
      unit: m.unit as Unit,
      notes: m.notes || "",
    });
    setMatEditing(true);
  };

  const deleteMaterialById = async (id: string, name: string) => {
    if (!confirm(`Excluir "${name}"?`)) return;
    try {
      await deleteMaterial(id);
      await refreshMats();
      showToast("success", "Matéria-prima excluída.");
    } catch (err: any) {
      showToast("error", err?.message || "Erro.");
    }
  };

  // ─── RECEITAS ───
  const openRecipeModal = (r?: Recipe) => {
    setRecipeError("");
    if (r) {
      const items: RecipeItem[] = Array.isArray(r.itemsJson) ? r.itemsJson : [];
      setRecipeForm({
        id: r.id,
        name: r.name,
        productId: r.productId || "",
        batchYield: r.batchYield.toString(),
        profitMargin: r.profitMargin.toString().replace(".", ","),
        items,
        laborCost: r.laborCost.toString().replace(".", ","),
        packagingCost: r.packagingCost.toString().replace(".", ","),
        notes: r.notes || "",
      });
    } else {
      setRecipeForm({ ...emptyRecipe });
    }
    setRecipeModal(true);
  };

  const closeRecipeModal = () => {
    setRecipeModal(false);
    setRecipeError("");
  };

  const updateItem = (idx: number, patch: Partial<RecipeItem>) => {
    setRecipeForm((f) => ({
      ...f,
      items: f.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    }));
  };
  const addItem = () => {
    setRecipeForm((f) => ({
      ...f,
      items: [...f.items, { materialId: materials[0]?.id || "", quantity: 0 }],
    }));
  };
  const removeItem = (idx: number) => {
    setRecipeForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  };

  // Cálculo do preço
  const calc = useMemo(() => {
    const yieldN = Math.max(1, parseInt(recipeForm.batchYield || "1", 10) || 1);
    const margin = parseFloat(recipeForm.profitMargin.replace(",", ".")) || 0;
    const labor = parseFloat(recipeForm.laborCost.replace(",", ".")) || 0;
    const pkg = parseFloat(recipeForm.packagingCost.replace(",", ".")) || 0;

    let materialsTotal = 0;
    const breakdown: { name: string; cost: number }[] = [];
    for (const it of recipeForm.items) {
      const m = materials.find((mm) => mm.id === it.materialId);
      if (!m) continue;
      const cpu = costPerBaseUnit(m);
      const cost = cpu * (Number(it.quantity) || 0);
      materialsTotal += cost;
      breakdown.push({ name: m.name, cost });
    }
    const batchTotal = materialsTotal + labor + pkg;
    const costPerUnit = batchTotal / yieldN;
    const suggested = costPerUnit * (1 + margin / 100);
    const profitPerUnit = suggested - costPerUnit;
    return { materialsTotal, batchTotal, costPerUnit, suggested, profitPerUnit, breakdown };
  }, [recipeForm, materials]);

  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecipeError("");
    if (!recipeForm.name.trim()) {
      setRecipeError("Nome obrigatório.");
      return;
    }
    const yieldN = parseInt(recipeForm.batchYield, 10);
    if (Number.isNaN(yieldN) || yieldN <= 0) {
      setRecipeError("Quantidade produzida inválida.");
      return;
    }
    const margin = parseFloat(recipeForm.profitMargin.replace(",", "."));
    const labor = parseFloat(recipeForm.laborCost.replace(",", ".")) || 0;
    const pkg = parseFloat(recipeForm.packagingCost.replace(",", ".")) || 0;
    const validItems = recipeForm.items.filter(
      (it) => it.materialId && Number(it.quantity) > 0
    );

    const payload = {
      name: recipeForm.name.trim(),
      productId: recipeForm.productId || null,
      batchYield: yieldN,
      profitMargin: margin,
      items: validItems,
      laborCost: labor,
      packagingCost: pkg,
      notes: recipeForm.notes.trim() || undefined,
    };
    try {
      if (recipeForm.id) {
        await updateRecipe(recipeForm.id, payload);
        showToast("success", "Receita atualizada!");
      } else {
        await createRecipe(payload);
        showToast("success", "Receita criada!");
      }
      closeRecipeModal();
      await refreshRecs();
    } catch (err: any) {
      setRecipeError(err?.message || "Erro ao salvar.");
    }
  };

  const handleDeleteRecipe = async (id: string, name: string) => {
    if (!confirm(`Excluir receita "${name}"?`)) return;
    try {
      await deleteRecipe(id);
      await refreshRecs();
      showToast("success", "Receita excluída.");
    } catch (err: any) {
      showToast("error", err?.message || "Erro.");
    }
  };

  return (
    <div className="admin-panel-card">
      <div className="admin-panel-header">
        <h1 className="admin-title">Calculadora de preços</h1>
        <p className="admin-subtitle">
          Cadastre suas matérias-primas e use receitas para descobrir o preço ideal.
        </p>
      </div>

      <div className="calc-tabs">
        <button
          className={`calc-tab ${section === "recipes" ? "active" : ""}`}
          onClick={() => setSection("recipes")}
        >
          <CalcIcon size={14} /> Receitas
          <span className="admin-nav-count">{recipes.length}</span>
        </button>
        <button
          className={`calc-tab ${section === "materials" ? "active" : ""}`}
          onClick={() => setSection("materials")}
        >
          <Beaker size={14} /> Matérias-primas
          <span className="admin-nav-count">{materials.length}</span>
        </button>
      </div>

      {section === "materials" && (
        <>
          <form onSubmit={handleSaveMaterial} className="admin-quick-form">
            <label>{matEditing ? "Editar matéria-prima" : "Nova matéria-prima"}</label>
            <div className="material-form-grid">
              <input
                type="text"
                className="admin-input"
                placeholder="Nome (ex: Glicerina vegetal)"
                value={matForm.name}
                onChange={(e) => setMatForm({ ...matForm, name: e.target.value })}
                required
              />
              <input
                type="text"
                inputMode="decimal"
                className="admin-input"
                placeholder="Valor pago (R$)"
                value={matForm.amountPaid}
                onChange={(e) => setMatForm({ ...matForm, amountPaid: e.target.value })}
                required
              />
              <input
                type="text"
                inputMode="decimal"
                className="admin-input"
                placeholder="Quantidade comprada"
                value={matForm.quantity}
                onChange={(e) => setMatForm({ ...matForm, quantity: e.target.value })}
                required
              />
              <div className="admin-select-wrap">
                <select
                  className="admin-input"
                  value={matForm.unit}
                  onChange={(e) => setMatForm({ ...matForm, unit: e.target.value as Unit })}
                >
                  {UNIT_OPTIONS.map((u) => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="admin-select-chev" />
              </div>
            </div>
            <input
              type="text"
              className="admin-input"
              placeholder="Anotações (fornecedor, marca, etc.)"
              value={matForm.notes}
              onChange={(e) => setMatForm({ ...matForm, notes: e.target.value })}
              style={{ marginTop: 10 }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button type="submit" className="btn btn-primary">
                <Save size={16} /> {matEditing ? "Salvar" : "Adicionar"}
              </button>
              {matEditing && (
                <button
                  type="button"
                  onClick={() => {
                    setMatForm({ ...emptyMaterial });
                    setMatEditing(false);
                  }}
                  className="btn btn-outline"
                >
                  <X size={16} /> Cancelar
                </button>
              )}
            </div>
          </form>

          {materials.length === 0 ? (
            <p className="admin-empty">Nenhuma matéria-prima cadastrada.</p>
          ) : (
            <div className="material-list">
              {materials.map((m) => {
                const cpu = costPerBaseUnit(m);
                return (
                  <div key={m.id} className="material-item">
                    <div className="material-item-info">
                      <strong>{m.name}</strong>
                      <small>
                        {formatBRL(m.amountPaid)} pago por {m.quantity.toString().replace(".", ",")} {m.unit}
                      </small>
                      {m.notes && <small style={{ fontStyle: "italic" }}>{m.notes}</small>}
                    </div>
                    <div className="material-item-cost">
                      <small>Custo por {baseLabel(m.unit)}</small>
                      <strong>{formatBRL(cpu)}</strong>
                    </div>
                    <div className="material-item-actions">
                      <button onClick={() => editMaterial(m)} className="btn-icon-only" aria-label="Editar">
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => deleteMaterialById(m.id, m.name)}
                        className="btn-icon-only danger"
                        aria-label="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {section === "recipes" && (
        <>
          <div className="admin-products-header" style={{ marginBottom: 18 }}>
            <p className="admin-subtitle" style={{ margin: 0 }}>
              Receitas calculam o preço ideal a partir das matérias-primas usadas.
            </p>
            <button
              onClick={() => openRecipeModal()}
              className="btn btn-primary"
              disabled={materials.length === 0}
              title={materials.length === 0 ? "Cadastre matérias-primas primeiro" : ""}
            >
              <Plus size={16} /> Nova receita
            </button>
          </div>

          {materials.length === 0 && (
            <div className="admin-warn">
              Cadastre matérias-primas antes de criar receitas.
            </div>
          )}

          {recipes.length === 0 ? (
            <p className="admin-empty">Nenhuma receita criada.</p>
          ) : (
            <div className="recipe-list">
              {recipes.map((r) => {
                const items: RecipeItem[] = Array.isArray(r.itemsJson) ? r.itemsJson : [];
                const product = products.find((p) => p.id === r.productId);
                let total = 0;
                for (const it of items) {
                  const m = materials.find((mm) => mm.id === it.materialId);
                  if (m) total += costPerBaseUnit(m) * Number(it.quantity || 0);
                }
                total += r.laborCost + r.packagingCost;
                const perUnit = total / Math.max(1, r.batchYield);
                const suggested = perUnit * (1 + r.profitMargin / 100);
                return (
                  <div key={r.id} className="recipe-card">
                    <div className="recipe-card-header">
                      <div>
                        <strong>{r.name}</strong>
                        {product && (
                          <small style={{ display: "block", color: "var(--color-text-muted)" }}>
                            Produto: {product.name}
                          </small>
                        )}
                      </div>
                      <div className="recipe-card-actions">
                        <button onClick={() => openRecipeModal(r)} className="btn-icon-only">
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteRecipe(r.id, r.name)}
                          className="btn-icon-only danger"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="recipe-card-body">
                      <div className="recipe-stat">
                        <small>Rendimento</small>
                        <strong>{r.batchYield} un.</strong>
                      </div>
                      <div className="recipe-stat">
                        <small>Custo total</small>
                        <strong>{formatBRL(total)}</strong>
                      </div>
                      <div className="recipe-stat">
                        <small>Custo unitário</small>
                        <strong>{formatBRL(perUnit)}</strong>
                      </div>
                      <div className="recipe-stat highlight">
                        <small>Preço sugerido ({r.profitMargin}% lucro)</small>
                        <strong>{formatBRL(suggested)}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {recipeModal && (
            <div className="admin-modal-overlay" onClick={closeRecipeModal}>
              <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                <div className="admin-modal-header">
                  <h2>{recipeForm.id ? "Editar receita" : "Nova receita"}</h2>
                  <button onClick={closeRecipeModal} className="btn-icon-only" aria-label="Fechar">
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleSaveRecipe} className="admin-modal-body">
                  <div className="admin-grid-2">
                    <div className="admin-form-group">
                      <label>Nome da receita *</label>
                      <input
                        required
                        type="text"
                        className="admin-input"
                        value={recipeForm.name}
                        onChange={(e) => setRecipeForm({ ...recipeForm, name: e.target.value })}
                        placeholder="Sabonete de Mel"
                      />
                    </div>
                    <div className="admin-form-group">
                      <label>Produto vinculado (opcional)</label>
                      <div className="admin-select-wrap">
                        <select
                          className="admin-input"
                          value={recipeForm.productId}
                          onChange={(e) =>
                            setRecipeForm({ ...recipeForm, productId: e.target.value })
                          }
                        >
                          <option value="">Nenhum</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="admin-select-chev" />
                      </div>
                    </div>
                  </div>

                  <div className="admin-grid-2">
                    <div className="admin-form-group">
                      <label>Rendimento (quantos saem) *</label>
                      <input
                        required
                        type="number"
                        inputMode="numeric"
                        className="admin-input"
                        min={1}
                        value={recipeForm.batchYield}
                        onChange={(e) =>
                          setRecipeForm({ ...recipeForm, batchYield: e.target.value })
                        }
                      />
                    </div>
                    <div className="admin-form-group">
                      <label>Margem de lucro (%) *</label>
                      <input
                        required
                        type="text"
                        inputMode="decimal"
                        className="admin-input"
                        value={recipeForm.profitMargin}
                        onChange={(e) =>
                          setRecipeForm({ ...recipeForm, profitMargin: e.target.value })
                        }
                        placeholder="100"
                      />
                    </div>
                  </div>

                  <div className="admin-grid-2">
                    <div className="admin-form-group">
                      <label>Custo de mão de obra (R$)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        className="admin-input"
                        value={recipeForm.laborCost}
                        onChange={(e) =>
                          setRecipeForm({ ...recipeForm, laborCost: e.target.value })
                        }
                        placeholder="0"
                      />
                    </div>
                    <div className="admin-form-group">
                      <label>Custo de embalagem (R$)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        className="admin-input"
                        value={recipeForm.packagingCost}
                        onChange={(e) =>
                          setRecipeForm({ ...recipeForm, packagingCost: e.target.value })
                        }
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="admin-form-group">
                    <label>Matérias-primas usadas</label>
                    {recipeForm.items.length === 0 && (
                      <small className="admin-hint" style={{ marginTop: 0, marginBottom: 8 }}>
                        Adicione os ingredientes que entram nessa receita.
                      </small>
                    )}
                    <div className="recipe-items">
                      {recipeForm.items.map((it, idx) => {
                        const m = materials.find((mm) => mm.id === it.materialId);
                        const cpu = m ? costPerBaseUnit(m) : 0;
                        const cost = cpu * Number(it.quantity || 0);
                        return (
                          <div key={idx} className="recipe-item">
                            <div className="admin-select-wrap" style={{ flex: 2 }}>
                              <select
                                className="admin-input"
                                value={it.materialId}
                                onChange={(e) =>
                                  updateItem(idx, { materialId: e.target.value })
                                }
                              >
                                {materials.map((mm) => (
                                  <option key={mm.id} value={mm.id}>
                                    {mm.name}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown size={14} className="admin-select-chev" />
                            </div>
                            <input
                              type="number"
                              inputMode="decimal"
                              className="admin-input"
                              style={{ flex: 1, minWidth: 90 }}
                              value={it.quantity}
                              step="0.01"
                              min={0}
                              onChange={(e) =>
                                updateItem(idx, { quantity: parseFloat(e.target.value) || 0 })
                              }
                              placeholder="Qtd"
                            />
                            <span className="recipe-item-unit">
                              {m ? baseLabel(m.unit) : ""}
                            </span>
                            <span className="recipe-item-cost">{formatBRL(cost)}</span>
                            <button
                              type="button"
                              onClick={() => removeItem(idx)}
                              className="btn-icon-only danger"
                              aria-label="Remover"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    <button type="button" onClick={addItem} className="btn btn-outline" style={{ marginTop: 10 }}>
                      <Plus size={16} /> Adicionar ingrediente
                    </button>
                  </div>

                  <div className="admin-form-group">
                    <label><FileText size={14} /> Anotações</label>
                    <textarea
                      className="admin-input admin-textarea"
                      value={recipeForm.notes}
                      onChange={(e) => setRecipeForm({ ...recipeForm, notes: e.target.value })}
                      placeholder="Modo de preparo, observações..."
                    />
                  </div>

                  {/* Resumo do cálculo */}
                  <div className="recipe-summary">
                    <h4>Resumo do cálculo</h4>
                    <div className="recipe-summary-row">
                      <span>Total em matérias-primas</span>
                      <strong>{formatBRL(calc.materialsTotal)}</strong>
                    </div>
                    <div className="recipe-summary-row">
                      <span>Mão de obra + embalagem</span>
                      <strong>
                        {formatBRL(
                          (parseFloat(recipeForm.laborCost.replace(",", ".")) || 0) +
                            (parseFloat(recipeForm.packagingCost.replace(",", ".")) || 0)
                        )}
                      </strong>
                    </div>
                    <div className="recipe-summary-row total-row">
                      <span>Custo total da batelada</span>
                      <strong>{formatBRL(calc.batchTotal)}</strong>
                    </div>
                    <div className="recipe-summary-row">
                      <span>Custo por unidade ({recipeForm.batchYield} produzidos)</span>
                      <strong>{formatBRL(calc.costPerUnit)}</strong>
                    </div>
                    <div className="recipe-summary-row highlight">
                      <span>💰 Preço sugerido (+{recipeForm.profitMargin}% margem)</span>
                      <strong>{formatBRL(calc.suggested)}</strong>
                    </div>
                    <div className="recipe-summary-row">
                      <span>Lucro por unidade</span>
                      <strong style={{ color: "var(--color-success)" }}>
                        {formatBRL(calc.profitPerUnit)}
                      </strong>
                    </div>
                  </div>

                  {recipeError && <p className="admin-error">{recipeError}</p>}

                  <div className="admin-modal-footer">
                    <button type="button" onClick={closeRecipeModal} className="btn btn-outline">
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary">
                      <Save size={16} /> Salvar receita
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
