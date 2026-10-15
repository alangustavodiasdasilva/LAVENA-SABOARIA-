"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createKit, deleteKit, updateKit } from "@/actions/kits";
import { GalleryUploader } from "@/components/admin/image-uploader";
import StockFields from "@/components/admin/stock-fields";
import { useRun } from "@/components/admin/use-run";
import { useConfirm } from "@/components/ui/confirm";
import SmartImage from "@/components/ui/smart-image";
import { formatBRL, moneyToInput, parseMoney } from "@/lib/format";
import { effectivePrice } from "@/lib/pricing";
import type { KitDTO, ProductDTO, StockStatus } from "@/lib/types";

export default function KitForm({ kit, products }: { kit?: KitDTO; products: ProductDTO[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const { run, busy } = useRun();

  const [name, setName] = useState(kit?.name ?? "");
  const [description, setDescription] = useState(kit?.description ?? "");
  const [price, setPrice] = useState(kit ? moneyToInput(kit.price) : "");
  const [salePrice, setSalePrice] = useState(kit?.salePrice ? moneyToInput(kit.salePrice) : "");
  const [gallery, setGallery] = useState<string[]>(() => (kit ? [...new Set([kit.imageUrl, ...kit.images].filter((x): x is string => !!x))] : []));
  const [productIds, setProductIds] = useState<string[]>(kit?.productIds ?? []);
  const [isActive, setIsActive] = useState(kit?.isActive ?? true);
  const [isFeatured, setIsFeatured] = useState(kit?.isFeatured ?? false);
  const [stockStatus, setStockStatus] = useState<StockStatus>(kit?.stockStatus ?? "IN_STOCK");
  const [stockQuantity, setStockQuantity] = useState(String(kit?.stockQuantity ?? 0));
  const [error, setError] = useState<string | null>(null);

  const sum = products.filter((p) => productIds.includes(p.id)).reduce((s, p) => s + effectivePrice(p), 0);
  const toggle = (id: string) => setProductIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const p = parseMoney(price);
    if (!Number.isFinite(p) || p <= 0) return setError("Informe o preço do kit (ex.: 79,90).");
    const sale = salePrice.trim() ? parseMoney(salePrice) : null;
    if (sale !== null && !Number.isFinite(sale)) return setError("Preço promocional inválido.");
    const input = {
      name,
      description,
      price: p,
      salePrice: sale,
      imageUrl: gallery[0] ?? null,
      images: gallery.slice(1),
      productIds,
      isActive,
      isFeatured,
      stockStatus,
      stockQuantity: stockQuantity.trim() ? Number(stockQuantity) : 0,
    };
    await run(() => (kit ? updateKit(kit.id, input) : createKit(input)), {
      success: kit ? "Kit salvo." : "Kit criado!",
      refresh: false,
      onError: setError,
      onDone: () => {
        router.push("/admin/kits");
        router.refresh();
      },
    });
  };

  const remove = async () => {
    if (!kit) return;
    const ok = await confirm({ title: `Excluir o kit “${kit.name}”?`, confirmLabel: "Excluir kit", tone: "danger" });
    if (ok) await run(() => deleteKit(kit.id), { success: "Kit excluído.", refresh: false, onDone: () => { router.push("/admin/kits"); router.refresh(); } });
  };

  return (
    <form className="form-stack" onSubmit={submit} noValidate>
      <section className="card panel">
        <div className="panel-head">
          <h2>Fotos</h2>
        </div>
        <GalleryUploader value={gallery} onChange={setGallery} max={8} aspect="land" />
      </section>

      <section className="card panel">
        <div className="panel-head">
          <h2>Informações</h2>
        </div>
        <div className="field">
          <label htmlFor="k-name">
            Nome <span className="req">*</span>
          </label>
          <input id="k-name" className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} placeholder="Ex.: Kit Spa em Casa" />
        </div>
        <div className="field">
          <label htmlFor="k-desc">Descrição</label>
          <textarea id="k-desc" className="textarea" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} />
        </div>
        <div className="form-row">
          <div className="field">
            <label htmlFor="k-price">
              Preço do kit (R$) <span className="req">*</span>
            </label>
            <input id="k-price" className="input" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="79,90" />
            {productIds.length > 0 && <span className="hint">Os produtos escolhidos somam {formatBRL(sum)} separados.</span>}
          </div>
          <div className="field">
            <label htmlFor="k-sale">Preço promocional (R$)</label>
            <input id="k-sale" className="input" inputMode="decimal" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} placeholder="Opcional" />
          </div>
        </div>
        <StockFields idPrefix="k" status={stockStatus} quantity={stockQuantity} onStatus={setStockStatus} onQuantity={setStockQuantity} />
      </section>

      <section className="card panel">
        <div className="panel-head">
          <h2>
            Produtos do kit <span className="count-pill">{productIds.length}</span>
          </h2>
        </div>
        {products.length === 0 ? (
          <p className="soft small">
            Cadastre produtos primeiro. <Link href="/admin/produtos/novo">Novo produto</Link>
          </p>
        ) : (
          <ul className="pick-list">
            {products.map((p) => (
              <li key={p.id}>
                <label className={`pick ${productIds.includes(p.id) ? "is-on" : ""}`}>
                  <input type="checkbox" checked={productIds.includes(p.id)} onChange={() => toggle(p.id)} />
                  <span className="pick-img">
                    <SmartImage src={p.imageUrl || p.images[0]} alt="" fill sizes="48px" style={{ objectFit: "cover" }} />
                  </span>
                  <span className="pick-name">{p.name}</span>
                  <small>{formatBRL(effectivePrice(p))}</small>
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card panel">
        <div className="panel-head">
          <h2>Exibição na loja</h2>
        </div>
        <label className="check">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          <span>Mostrar este kit na loja</span>
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
        {kit && (
          <button type="button" className="btn btn-ghost btn-danger-text" onClick={remove} disabled={busy}>
            <Trash2 size={16} /> Excluir
          </button>
        )}
        <span className="spacer" />
        <Link href="/admin/kits" className="btn btn-ghost">
          Cancelar
        </Link>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Salvando…" : kit ? "Salvar kit" : "Criar kit"}
        </button>
      </div>
    </form>
  );
}
