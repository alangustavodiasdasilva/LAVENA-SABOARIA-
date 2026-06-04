"use client";

import React, { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Edit2, Image as ImageIcon, Check, X, Upload } from "lucide-react";
import Image from "next/image";
import { getBags, createBag, updateBag, deleteBag, uploadImage } from "../../actions";

type Bag = {
  id: string;
  name: string;
  imageUrl?: string | null;
  amountPaid: number;
  quantity: number;
  margin: number;
  isActive: boolean;
  notes?: string | null;
};

const emptyBag: Bag = {
  id: "",
  name: "",
  imageUrl: "",
  amountPaid: 0,
  quantity: 1,
  margin: 100,
  isActive: true,
  notes: "",
};

export default function BagManager({ showToast }: { showToast: (type: "success" | "error", msg: string) => void }) {
  const [bags, setBags] = useState<Bag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<Bag>({ ...emptyBag });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadBags();
  }, []);

  async function loadBags() {
    setIsLoading(true);
    try {
      const data = await getBags();
      setBags(data as any[]);
    } catch (e: any) {
      showToast("error", "Erro ao carregar sacolas: " + e.message);
    } finally {
      setIsLoading(false);
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    e.target.value = "";
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const url = await uploadImage(fd);
      if (url) {
        setForm((f) => ({ ...f, imageUrl: url }));
        showToast("success", "Imagem da sacola enviada!");
      }
    } catch (err: any) {
      showToast("error", err.message || "Erro no upload");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return showToast("error", "Preencha o nome da sacola.");
    if (form.quantity < 1) return showToast("error", "Quantidade deve ser maior que zero.");

    try {
      if (form.id) {
        await updateBag(form.id, {
          name: form.name,
          imageUrl: form.imageUrl,
          amountPaid: Number(form.amountPaid),
          quantity: Number(form.quantity),
          margin: Number(form.margin),
          isActive: form.isActive,
          notes: form.notes,
        });
        showToast("success", "Sacola atualizada!");
      } else {
        await createBag({
          name: form.name,
          imageUrl: form.imageUrl || undefined,
          amountPaid: Number(form.amountPaid),
          quantity: Number(form.quantity),
          margin: Number(form.margin),
          isActive: form.isActive,
          notes: form.notes || undefined,
        });
        showToast("success", "Sacola criada!");
      }
      setIsModalOpen(false);
      loadBags();
    } catch (err: any) {
      showToast("error", err.message || "Erro ao salvar sacola.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta sacola?")) return;
    try {
      await deleteBag(id);
      showToast("success", "Sacola excluída!");
      loadBags();
    } catch (err: any) {
      showToast("error", err.message || "Erro ao excluir.");
    }
  };

  const openNew = () => {
    setForm({ ...emptyBag });
    setIsModalOpen(true);
  };

  const openEdit = (bag: Bag) => {
    setForm({ ...bag });
    setIsModalOpen(true);
  };

  const calcSellingPrice = (amountPaid: number, qty: number, margin: number) => {
    if (qty <= 0) return 0;
    const costPerUnit = amountPaid / qty;
    return costPerUnit * (1 + margin / 100);
  };

  return (
    <div className="admin-section">
      <div className="admin-header">
        <div>
          <h2>Sacolas de Presente</h2>
          <p className="text-muted">Gerencie os tipos de sacolas que os clientes podem adicionar aos presentes.</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={16} /> Nova Sacola
        </button>
      </div>

      {isLoading ? (
        <div className="loading-state">Carregando sacolas...</div>
      ) : bags.length === 0 ? (
        <div className="empty-state">
          Nenhuma sacola cadastrada.
        </div>
      ) : (
        <div className="admin-grid">
          {bags.map((bag) => {
            const sellingPrice = calcSellingPrice(bag.amountPaid, bag.quantity, bag.margin);
            return (
              <div key={bag.id} className={`admin-card ${!bag.isActive ? "is-inactive" : ""}`}>
                <div className="admin-card-thumb">
                  {bag.imageUrl ? (
                    <Image src={bag.imageUrl} alt={bag.name} fill className="object-cover" unoptimized={bag.imageUrl.startsWith("data:")} />
                  ) : (
                    <div className="product-image-placeholder"><ImageIcon size={24} /></div>
                  )}
                  {!bag.isActive && <span className="admin-card-status product-status-danger">Inativa</span>}
                </div>
                <div className="admin-card-body">
                  <h3 className="admin-card-title">{bag.name}</h3>
                  <div className="admin-card-stats bag-stats-mt">
                    <div className="admin-card-stat">
                      <span className="stat-label">Custo Unitário</span>
                      <span className="stat-value text-red">R$ {(bag.amountPaid / bag.quantity).toFixed(2).replace(".", ",")}</span>
                    </div>
                    <div className="admin-card-stat">
                      <span className="stat-label">Preço de Venda</span>
                      <span className="stat-value text-green bag-price-lg">R$ {sellingPrice.toFixed(2).replace(".", ",")}</span>
                    </div>
                  </div>
                </div>
                <div className="admin-card-actions">
                  <button className="btn-icon" onClick={() => openEdit(bag)} title="Editar"><Edit2 size={16} /></button>
                  <button className="btn-icon text-red" onClick={() => handleDelete(bag.id)} title="Excluir"><Trash2 size={16} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal admin-modal-lg">
            <div className="admin-modal-header">
              <h3>{form.id ? "Editar Sacola" : "Nova Sacola"}</h3>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)} title="Fechar" aria-label="Fechar"><X size={20} /></button>
            </div>
            <div className="admin-modal-body">
              <form onSubmit={handleSave}>
                <div className="admin-form-group">
                  <label>Nome da Sacola</label>
                  <input required className="admin-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ex: Sacola Kraft Pequena" />
                </div>

                <div className="admin-grid-2">
                  <div className="admin-form-group">
                    <label>Imagem da Sacola</label>
                    <div className="admin-image-upload-area" onClick={() => fileInputRef.current?.click()}>
                      {form.imageUrl ? (
                        <Image src={form.imageUrl} alt="Preview" fill className="object-contain" unoptimized={form.imageUrl.startsWith("data:")} />
                      ) : (
                        <div className="upload-placeholder">
                          {isUploading ? <span className="loading-spinner"></span> : <><Upload size={20} /><span>Clique para enviar foto</span></>}
                        </div>
                      )}
                    </div>
                    <input type="file" hidden ref={fileInputRef} accept="image/png, image/jpeg, image/webp" onChange={handleUpload} />
                  </div>
                  <div>
                    <div className="admin-form-group">
                      <label>Total Pago (Custo Total)</label>
                      <input required type="number" step="0.01" min="0" className="admin-input" value={form.amountPaid} onChange={e => setForm({...form, amountPaid: Number(e.target.value)})} placeholder="Ex: 50.00" />
                    </div>
                    <div className="admin-form-group">
                      <label>Quantidade Comprada</label>
                      <input required type="number" min="1" className="admin-input" value={form.quantity} onChange={e => setForm({...form, quantity: Number(e.target.value)})} placeholder="Ex: 10" />
                    </div>
                    <div className="admin-form-group">
                      <label>Margem de Lucro (%)</label>
                      <input required type="number" step="1" className="admin-input" value={form.margin} onChange={e => setForm({...form, margin: Number(e.target.value)})} placeholder="Ex: 100" />
                    </div>
                  </div>
                </div>

                <div className="admin-form-group bag-summary-box">
                  <p className="bag-summary-title">Resumo Financeiro:</p>
                  <div className="bag-summary-flex">
                    <span>Custo por unidade: <strong>R$ {(form.amountPaid / Math.max(1, form.quantity)).toFixed(2).replace(".", ",")}</strong></span>
                    <span>Preço Final de Venda: <strong className="bag-summary-price">R$ {calcSellingPrice(form.amountPaid, form.quantity, form.margin).toFixed(2).replace(".", ",")}</strong></span>
                  </div>
                </div>

                <div className="admin-form-group admin-mt-16">
                  <label>Observações internas (opcional)</label>
                  <textarea className="admin-textarea" value={form.notes || ""} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Ex: Comprado no Mercado Livre loja XPTO" rows={2} />
                </div>

                <div className="admin-form-group admin-mt-16">
                  <label className="admin-checkbox-label">
                    <input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} />
                    <span>Sacola Ativa (aparece para o cliente)</span>
                  </label>
                </div>

                <div className="admin-modal-footer admin-mt-24">
                  <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary"><Check size={16} /> Salvar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
