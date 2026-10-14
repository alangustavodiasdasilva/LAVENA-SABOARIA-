"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { createCategory, createProduct, deleteProduct, updateProduct } from "@/actions/catalog";
import { GalleryUploader, SingleImage } from "@/components/admin/image-uploader";
import StockFields from "@/components/admin/stock-fields";
import { useRun } from "@/components/admin/use-run";
import { useConfirm } from "@/components/ui/confirm";
import { moneyToInput, parseMoney } from "@/lib/format";
import type { AdminCategoryDTO } from "@/lib/admin-types";
import type { ProductDTO, StockStatus } from "@/lib/types";

type VariantForm = { id: string | null; key: string; name: string; price: string; salePrice: string; imageUrl: string | null; stockStatus: StockStatus; stockQuantity: string };

let seq = 0;
const newKey = () => `v${++seq}`;

const moneyOrZero = (s: string) => {
  if (!s.trim()) return 0;
  const n = parseMoney(s);
  return Number.isFinite(n) ? n : NaN;
};
const salePriceOrNull = (s: string) => (s.trim() ? parseMoney(s) : null);
const intOrZero = (s: string) => (s.trim() ? Number(s) : 0);

export default function ProductForm({ product, categories }: { product?: ProductDTO; categories: AdminCategoryDTO[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const { run, busy } = useRun();

  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [benefits, setBenefits] = useState(product?.benefits ?? "");
  const [ingredients, setIngredients] = useState(product?.ingredients ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? categories[0]?.id ?? "");
  const [price, setPrice] = useState(product ? moneyToInput(product.price) : "");
  const [salePrice, setSalePrice] = useState(product?.salePrice ? moneyToInput(product.salePrice) : "");
  const [size, setSize] = useState(product?.size ?? "");
  const [stockStatus, setStockStatus] = useState<StockStatus>(product?.stockStatus ?? "IN_STOCK");
  const [stockQuantity, setStockQuantity] = useState(String(product?.stockQuantity ?? 0));
  const [lowStockAlert, setLowStockAlert] = useState(String(product?.lowStockAlert ?? 3));
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false);
  const [isVisible, setIsVisible] = useState(product?.isVisible ?? true);
  const [gallery, setGallery] = useState<string[]>(() => (product ? [...new Set([product.imageUrl, ...product.images].filter((x): x is string => !!x))] : []));
  const [variants, setVariants] = useState<VariantForm[]>(() =>
    (product?.variants ?? []).map((v) => ({
      id: v.id,
      key: newKey(),
      name: v.name,
      price: moneyToInput(v.price),
      salePrice: v.salePrice ? moneyToInput(v.salePrice) : "",
      imageUrl: v.imageUrl,
      stockStatus: v.stockStatus,
      stockQuantity: String(v.stockQuantity),
    }))
  );
  const [newCat, setNewCat] = useState("");
  const [error, setError] = useState<string | null>(null);

  const setVariant = (key: string, patch: Partial<VariantForm>) => setVariants((vs) => vs.map((v) => (v.key === key ? { ...v, ...patch } : v)));

  const addCategory = async () => {
    const n = newCat.trim();
    if (!n) return;
    await run(() => createCategory(n), {
      success: "Categoria criada.",
      onDone: (d) => {
        setCategoryId(d.id);
        setNewCat("");
      },
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const p = moneyOrZero(price);
    if (!price.trim() || !Number.isFinite(p) || p <= 0) return setError("Informe o preço do produto (ex.: 25,90).");
    const sale = salePriceOrNull(salePrice);
    if (sale !== null && !Number.isFinite(sale)) return setError("Preço promocional inválido.");

    const input = {
      name,
      description,
      benefits,
      ingredients,
      price: p,
      salePrice: sale,
      size,
      imageUrl: gallery[0] ?? null,
      images: gallery.slice(1),
      categoryId,
      isFeatured,
      isVisible,
      stockStatus,
      stockQuantity: intOrZero(stockQuantity),
      lowStockAlert: intOrZero(lowStockAlert),
      variants: variants.map((v) => ({
        id: v.id,
        name: v.name,
        price: moneyOrZero(v.price),
        salePrice: salePriceOrNull(v.salePrice),
        imageUrl: v.imageUrl,
        stockStatus: v.stockStatus,
        stockQuantity: intOrZero(v.stockQuantity),
      })),
    };
    if (input.variants.some((v) => !Number.isFinite(v.price) || v.price <= 0)) return setError("Informe o preço de cada variação.");
    if (input.variants.some((v) => v.salePrice !== null && !Number.isFinite(v.salePrice))) return setError("Preço promocional de variação inválido.");

    await run(() => (product ? updateProduct(product.id, input) : createProduct(input)), {
      success: product ? "Produto salvo." : "Produto cadastrado!",
      refresh: false,
      onError: setError,
      onDone: () => {
        router.push("/admin/produtos");
        router.refresh();
      },
    });
  };

  const remove = async () => {
    if (!product) return;
    const ok = await confirm({
      title: `Excluir “${product.name}”?`,
      message: "O produto sai da loja e dos kits. Pedidos antigos continuam guardados.",
      confirmLabel: "Excluir produto",
      tone: "danger",
    });
    if (!ok) return;
    await run(() => deleteProduct(product.id), { success: "Produto excluído.", refresh: false, onDone: () => { router.push("/admin/produtos"); router.refresh(); } });
  };

  if (categories.length === 0) {
    return (
      <div className="card panel">
        <h2>Antes, crie uma categoria</h2>
        <p className="soft">Todo produto fica em uma categoria (ex.: Sabonetes, Geleia de banho).</p>
        <div className="inline-add">
          <input className="input" placeholder="Nome da categoria" value={newCat} onChange={(e) => setNewCat(e.target.value)} maxLength={60} />
          <button type="button" className="btn btn-primary" onClick={addCategory} disabled={busy || !newCat.trim()}>
            Criar categoria
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="form-stack" onSubmit={submit} noValidate>
      <section className="card panel">
        <div className="panel-head">
          <h2>Fotos</h2>
        </div>
        <GalleryUploader value={gallery} onChange={setGallery} />
        <p className="hint">A primeira foto é a capa. Use fotos claras, com boa luz. Elas são reduzidas automaticamente.</p>
      </section>

      <section className="card panel">
        <div className="panel-head">
          <h2>Informações</h2>
        </div>
        <div className="field">
          <label htmlFor="p-name">
            Nome <span className="req">*</span>
          </label>
          <input id="p-name" className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} placeholder="Ex.: Sabonete de Lavanda" />
        </div>
        <div className="field">
          <label htmlFor="p-cat">
            Categoria <span className="req">*</span>
          </label>
          <select id="p-cat" className="select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <div className="inline-add">
            <input className="input" placeholder="Ou crie uma categoria nova" value={newCat} onChange={(e) => setNewCat(e.target.value)} maxLength={60} aria-label="Nova categoria" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCategory(); } }} />
            <button type="button" className="btn btn-outline" onClick={addCategory} disabled={busy || !newCat.trim()}>
              Criar
            </button>
          </div>
        </div>
        <div className="field">
          <label htmlFor="p-desc">
            Descrição <span className="req">*</span>
          </label>
          <textarea id="p-desc" className="textarea" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} placeholder="Conte o que torna este produto especial: aroma, textura, para quem é ideal…" />
        </div>
        <div className="form-row">
          <div className="field">
            <label htmlFor="p-ben">Benefícios</label>
            <textarea id="p-ben" className="textarea" rows={3} value={benefits} onChange={(e) => setBenefits(e.target.value)} maxLength={2000} placeholder="Um por linha. Ex.: Hidrata a pele" />
          </div>
          <div className="field">
            <label htmlFor="p-ing">Ingredientes</label>
            <textarea id="p-ing" className="textarea" rows={3} value={ingredients} onChange={(e) => setIngredients(e.target.value)} maxLength={2000} placeholder="Ex.: Base vegetal, óleo de coco, óleo essencial de lavanda" />
          </div>
        </div>
      </section>

      <section className="card panel">
        <div className="panel-head">
          <h2>Preço e estoque</h2>
        </div>
        <div className="form-row">
          <div className="field">
            <label htmlFor="p-price">
              Preço (R$) <span className="req">*</span>
            </label>
            <input id="p-price" className="input" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="25,90" />
          </div>
          <div className="field">
            <label htmlFor="p-sale">Preço promocional (R$)</label>
            <input id="p-sale" className="input" inputMode="decimal" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} placeholder="Opcional" />
          </div>
          <div className="field">
            <label htmlFor="p-size">Tamanho / peso (ex.: 90g)</label>
            <input id="p-size" className="input" value={size} onChange={(e) => setSize(e.target.value)} maxLength={40} placeholder="Ex.: 90g" />
          </div>
        </div>
        <StockFields idPrefix="p" status={stockStatus} quantity={stockQuantity} onStatus={setStockStatus} onQuantity={setStockQuantity} />
        {stockStatus === "IN_STOCK" && (
          <div className="field narrow">
            <label htmlFor="p-low">Avisar quando restar até</label>
            <input id="p-low" className="input" inputMode="numeric" value={lowStockAlert} onChange={(e) => setLowStockAlert(e.target.value.replace(/\D/g, "").slice(0, 4))} />
            <span className="hint">Aparece no painel como “estoque baixo”.</span>
          </div>
        )}
      </section>

      <section className="card panel">
        <div className="panel-head">
          <h2>Variações</h2>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setVariants((vs) => [...vs, { id: null, key: newKey(), name: "", price: price, salePrice: "", imageUrl: null, stockStatus: "IN_STOCK", stockQuantity: "0" }])} disabled={variants.length >= 12}>
            <Plus size={15} /> Adicionar
          </button>
        </div>
        {variants.length === 0 ? (
          <p className="soft small">Opcional. Use para o mesmo produto em outros aromas/essências ou tamanhos (ex.: Lavanda, Maracujá, 200g, 500g). Cada variação tem nome, preço e estoque próprios e aparece como botão na página do produto.</p>
        ) : (
          <div className="variant-list">
            {variants.map((v) => (
              <div className="variant" key={v.key}>
                <SingleImage value={v.imageUrl} onChange={(u) => setVariant(v.key, { imageUrl: u })} label="Foto" />
                <div className="variant-fields">
                  <div className="form-row is-compact">
                    <div className="field">
                      <label htmlFor={`${v.key}-n`}>Nome</label>
                      <input id={`${v.key}-n`} className="input" value={v.name} onChange={(e) => setVariant(v.key, { name: e.target.value })} maxLength={40} placeholder="Ex.: 200g" />
                    </div>
                    <div className="field">
                      <label htmlFor={`${v.key}-p`}>Preço (R$)</label>
                      <input id={`${v.key}-p`} className="input" inputMode="decimal" value={v.price} onChange={(e) => setVariant(v.key, { price: e.target.value })} />
                    </div>
                    <div className="field">
                      <label htmlFor={`${v.key}-s`}>Promoção (R$)</label>
                      <input id={`${v.key}-s`} className="input" inputMode="decimal" value={v.salePrice} onChange={(e) => setVariant(v.key, { salePrice: e.target.value })} placeholder="Opcional" />
                    </div>
                  </div>
                  <StockFields compact idPrefix={v.key} status={v.stockStatus} quantity={v.stockQuantity} onStatus={(s) => setVariant(v.key, { stockStatus: s })} onQuantity={(q) => setVariant(v.key, { stockQuantity: q })} />
                </div>
                <button type="button" className="btn btn-ghost btn-icon btn-danger-text" onClick={() => setVariants((vs) => vs.filter((x) => x.key !== v.key))} aria-label="Remover variação">
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card panel">
        <div className="panel-head">
          <h2>Exibição na loja</h2>
        </div>
        <label className="check">
          <input type="checkbox" checked={isVisible} onChange={(e) => setIsVisible(e.target.checked)} />
          <span>Mostrar este produto na loja</span>
        </label>
        <label className="check">
          <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
          <span>Destacar na página inicial</span>
        </label>
      </section>

      {error && (
        <p className="error-text form-error" role="alert">
          {error}
        </p>
      )}

      <div className="form-actions">
        {product && (
          <button type="button" className="btn btn-ghost btn-danger-text" onClick={remove} disabled={busy}>
            <Trash2 size={16} /> Excluir
          </button>
        )}
        <span className="spacer" />
        <Link href="/admin/produtos" className="btn btn-ghost">
          Cancelar
        </Link>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Salvando…" : product ? "Salvar produto" : "Cadastrar produto"}
        </button>
      </div>
    </form>
  );
}
