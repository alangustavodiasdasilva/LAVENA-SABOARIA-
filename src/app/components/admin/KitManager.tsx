"use client";

import React, { useState, useRef } from "react";
import {
  getKits, createKit, updateKit, deleteKit, toggleKitActive, uploadImage,
} from "../../actions";
import {
  Plus, Trash2, Edit2, Save, X, Upload, Star, Search,
  Package, ToggleLeft, ToggleRight, Eye, EyeOff, ChevronDown,
} from "lucide-react";

type Product = {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  category?: { id: string; name: string } | null;
};

type Kit = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  salePrice?: number | null;
  imageUrl?: string | null;
  images?: string[];
  productIds: string[];
  isActive: boolean;
  isFeatured: boolean;
  stockQuantity?: number;
  stockStatus?: string;
};

const emptyKitForm = {
  id: "",
  name: "",
  description: "",
  price: "",
  salePrice: "",
  imageUrl: "",
  productIds: [] as string[],
  isActive: true,
  isFeatured: false,
  stockQuantity: "0",
};

export default function KitManager({
  initialKits,
  products,
  onChange,
  showToast,
}: {
  initialKits: Kit[];
  products: Product[];
  onChange: () => void;
  showToast: (type: "success" | "error", msg: string) => void;
}) {
  const [kits, setKits] = useState<Kit[]>(initialKits);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyKitForm });
  const [search, setSearch] = useState("");
  const [productPickerQuery, setProductPickerQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [formError, setFormError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    const data = await getKits();
    setKits(data as any);
    onChange();
  }

  const openModal = (kit?: Kit) => {
    setFormError("");
    if (kit) {
      setForm({
        id: kit.id,
        name: kit.name,
        description: kit.description || "",
        price: kit.price.toString().replace(".", ","),
        salePrice: kit.salePrice ? kit.salePrice.toString().replace(".", ",") : "",
        imageUrl: kit.imageUrl || "",
        productIds: kit.productIds || [],
        isActive: kit.isActive,
        isFeatured: kit.isFeatured,
        stockQuantity: (kit.stockQuantity ?? 0).toString(),
      });
    } else {
      setForm({ ...emptyKitForm });
    }
    setIsModalOpen(true);
  };

  const close = () => {
    setIsModalOpen(false);
    setProductPickerQuery("");
    setFormError("");
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const url = await uploadImage(fd);
      setForm((f) => ({ ...f, imageUrl: url }));
      showToast("success", "Imagem enviada!");
    } catch (err: any) {
      showToast("error", err?.message || "Erro ao enviar.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    await uploadFile(e.target.files[0]);
    e.target.value = "";
  };

  const toggleProduct = (id: string) => {
    setForm((f) => {
      const exists = f.productIds.includes(id);
      return {
        ...f,
        productIds: exists ? f.productIds.filter((p) => p !== id) : [...f.productIds, id],
      };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const priceNum = parseFloat(form.price.replace(",", "."));
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setFormError("Preço inválido.");
      return;
    }
    let saleNum: number | null = null;
    if (form.salePrice.trim()) {
      const sp = parseFloat(form.salePrice.replace(",", "."));
      if (Number.isNaN(sp) || sp < 0 || sp >= priceNum) {
        setFormError("Preço promocional deve ser positivo e menor que o normal.");
        return;
      }
      saleNum = sp;
    }
    if (form.productIds.length === 0) {
      setFormError("Selecione ao menos 1 produto para o kit.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: priceNum,
      salePrice: saleNum,
      imageUrl: form.imageUrl,
      productIds: form.productIds,
      isActive: form.isActive,
      isFeatured: form.isFeatured,
      stockQuantity: parseInt(form.stockQuantity || "0", 10) || 0,
    };
    try {
      if (form.id) {
        await updateKit(form.id, payload);
        showToast("success", "Kit atualizado!");
      } else {
        await createKit(payload);
        showToast("success", "Kit criado!");
      }
      close();
      await refresh();
    } catch (err: any) {
      setFormError(err?.message || "Erro ao salvar.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Excluir kit "${name}"?`)) return;
    try {
      await deleteKit(id);
      await refresh();
      showToast("success", "Kit excluído.");
    } catch (err: any) {
      showToast("error", err?.message || "Erro.");
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      await toggleKitActive(id, !current);
      await refresh();
    } catch (err: any) {
      showToast("error", err?.message || "Erro.");
    }
  };

  const filtered = kits.filter((k) =>
    search ? k.name.toLowerCase().includes(search.toLowerCase()) : true
  );

  const filteredProducts = products.filter((p) =>
    productPickerQuery
      ? p.name.toLowerCase().includes(productPickerQuery.toLowerCase())
      : true
  );

  const activeCount = kits.filter((k) => k.isActive).length;

  return (
    <div className="admin-panel-card">
      <div className="admin-panel-header admin-products-header">
        <div>
          <h1 className="admin-title">Kits</h1>
          <p className="admin-subtitle">
            {kits.length} kits · {activeCount} ativos. Especificações do site são montadas automaticamente
            com os produtos selecionados.
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="btn btn-primary"
          disabled={products.length === 0}
          title={products.length === 0 ? "Crie produtos primeiro" : ""}
        >
          <Plus size={16} /> Novo kit
        </button>
      </div>

      {products.length === 0 && (
        <div className="admin-warn">
          Crie produtos antes de montar kits.
        </div>
      )}

      <div className="admin-toolbar">
        <div className="admin-search">
          <Search size={14} />
          <input
            type="search"
            placeholder="Buscar kit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="admin-empty">
          {kits.length === 0 ? "Nenhum kit cadastrado." : "Nenhum kit encontrado."}
        </p>
      ) : (
        <div className="admin-products-grid">
          {filtered.map((kit) => {
            const productsInKit = products.filter((p) => kit.productIds.includes(p.id));
            const hasSale =
              !!kit.salePrice && kit.salePrice > 0 && kit.salePrice < kit.price;
            const pct = hasSale
              ? Math.round(((kit.price - (kit.salePrice as number)) / kit.price) * 100)
              : 0;
            return (
              <div
                key={kit.id}
                className={`admin-product-card ${!kit.isActive ? "unavailable" : ""}`}
              >
                <div className="admin-product-thumb">
                  {kit.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={kit.imageUrl} alt={kit.name} />
                  ) : (
                    <span>Sem imagem</span>
                  )}
                  {kit.isFeatured && (
                    <button
                      className="admin-feature-toggle active"
                      style={{ pointerEvents: "none" }}
                      aria-hidden
                    >
                      <Star size={14} fill="currentColor" />
                    </button>
                  )}
                  {!kit.isActive && (
                    <div className="admin-product-status-pill danger">Desativado</div>
                  )}
                </div>
                <div className="admin-product-info">
                  <span className="admin-product-cat">
                    {productsInKit.length} {productsInKit.length === 1 ? "produto" : "produtos"}
                  </span>
                  <h3>{kit.name}</h3>
                  <div>
                    {hasSale && (
                      <span className="admin-product-price-original">
                        R$ {kit.price.toFixed(2).replace(".", ",")}
                      </span>
                    )}
                    <strong className="admin-product-price">
                      R$ {(hasSale ? (kit.salePrice as number) : kit.price)
                        .toFixed(2)
                        .replace(".", ",")}
                    </strong>
                    {hasSale && <span className="admin-product-promo">-{pct}%</span>}
                  </div>
                  <small style={{ display: "block", marginTop: 6, color: "var(--color-text-muted)" }}>
                    {productsInKit.slice(0, 3).map((p) => p.name).join(", ")}
                    {productsInKit.length > 3 ? ` +${productsInKit.length - 3}` : ""}
                  </small>
                </div>
                <div className="admin-product-actions">
                  <button
                    onClick={() => handleToggleActive(kit.id, kit.isActive)}
                    className="btn btn-outline btn-sm"
                    title={kit.isActive ? "Desativar" : "Ativar"}
                  >
                    {kit.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                    {kit.isActive ? "Ativo" : "Inativo"}
                  </button>
                  <button onClick={() => openModal(kit)} className="btn-icon-only" aria-label="Editar">
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(kit.id, kit.name)}
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

      {isModalOpen && (
        <div className="admin-modal-overlay" onClick={close}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{form.id ? "Editar kit" : "Novo kit"}</h2>
              <button onClick={close} className="btn-icon-only" aria-label="Fechar">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="admin-modal-body">
              <div className="admin-form-group">
                <label>Imagem do kit</label>
                <div
                  className={`admin-dropzone ${form.imageUrl ? "has-image" : ""}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {form.imageUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={form.imageUrl} alt="Kit" />
                      <span className="admin-dropzone-overlay">
                        <Upload size={18} /> Trocar imagem
                      </span>
                    </>
                  ) : (
                    <div className="admin-dropzone-empty">
                      <Upload size={28} />
                      <span>{isUploading ? "Enviando..." : "Clique para enviar"}</span>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleFileSelect}
                    disabled={isUploading}
                  />
                </div>
              </div>

              <div className="admin-grid-2">
                <div className="admin-form-group">
                  <label>Nome *</label>
                  <input
                    required
                    type="text"
                    className="admin-input"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Kit Dia dos Namorados"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Quantidade disponível</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    className="admin-input"
                    value={form.stockQuantity}
                    min={0}
                    onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-grid-2">
                <div className="admin-form-group">
                  <label>Preço (R$) *</label>
                  <input
                    required
                    type="text"
                    inputMode="decimal"
                    className="admin-input"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="120,00"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Preço promocional (R$)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="admin-input"
                    value={form.salePrice}
                    onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label>Descrição</label>
                <textarea
                  className="admin-input admin-textarea"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Sobre o kit, ocasião, etc."
                  maxLength={300}
                />
              </div>

              <div className="admin-form-group">
                <label>Produtos do kit ({form.productIds.length} selecionados) *</label>
                <small className="admin-hint" style={{ marginBottom: 8, marginTop: 0 }}>
                  As especificações do kit no site serão a soma dos benefícios e ingredientes destes produtos.
                </small>
                <div className="admin-search" style={{ marginBottom: 10 }}>
                  <Search size={14} />
                  <input
                    type="search"
                    placeholder="Filtrar produtos..."
                    value={productPickerQuery}
                    onChange={(e) => setProductPickerQuery(e.target.value)}
                  />
                </div>
                <div className="kit-product-picker">
                  {filteredProducts.map((p) => {
                    const selected = form.productIds.includes(p.id);
                    return (
                      <button
                        type="button"
                        key={p.id}
                        className={`kit-product-pick ${selected ? "selected" : ""}`}
                        onClick={() => toggleProduct(p.id)}
                      >
                        <div className="kit-product-pick-thumb">
                          {p.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.imageUrl} alt={p.name} />
                          ) : (
                            <Package size={20} />
                          )}
                        </div>
                        <div className="kit-product-pick-info">
                          <strong>{p.name}</strong>
                          <small>
                            {p.category?.name || "—"} · R${" "}
                            {p.price.toFixed(2).replace(".", ",")}
                          </small>
                        </div>
                        <span className={`kit-product-pick-check ${selected ? "selected" : ""}`}>
                          {selected ? "✓" : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="kit-toggle-row">
                <label className="admin-checkbox">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                  <span>
                    {form.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                    {form.isActive ? "Kit ativo" : "Kit desativado"}
                    <small style={{ fontWeight: 400, marginLeft: 6 }}>
                      {form.isActive ? "(aparece no site)" : "(escondido do site)"}
                    </small>
                  </span>
                </label>
                <label className="admin-checkbox">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                  />
                  <span><Star size={14} /> Em destaque</span>
                </label>
              </div>

              {formError && <p className="admin-error">{formError}</p>}

              <div className="admin-modal-footer">
                <button type="button" onClick={close} className="btn btn-outline">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={isUploading}>
                  <Save size={16} /> Salvar kit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
