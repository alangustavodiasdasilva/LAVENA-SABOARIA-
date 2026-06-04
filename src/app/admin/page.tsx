"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  getSettings, updateSettings, updateHeroImages, uploadImage,
  getCategories, createCategory, updateCategory, deleteCategory,
  getProducts, createProduct, updateProduct, deleteProduct, toggleFeatured,
  updateStockStatus, updateStockQuantity, adjustStock,
  getKits, getMaterials, getRecipes,
  loginAdmin, logoutAdmin, checkAdmin,
} from "../actions";
import {
  Settings as SettingsIcon, LayoutGrid, Package, LogOut, Boxes, Gift, Calculator as CalcIcon,
  Plus, Trash2, Edit2, Save, Image as ImageIcon, Phone, Check, X,
  Upload, Star, Search, Lock, ChevronDown, ArrowLeft, ArrowRight,
  Minus, AlertTriangle, TrendingDown,
} from "lucide-react";
import KitManager from "../components/admin/KitManager";
import Calculator from "../components/admin/Calculator";

type StockStatus = "IN_STOCK" | "IN_PRODUCTION" | "OUT_OF_STOCK";
type Cat = { id: string; name: string; slug: string };
type Prod = {
  id: string; name: string; slug: string; description: string;
  benefits?: string | null; ingredients?: string | null; price: number;
  salePrice?: number | null;
  size?: string | null; imageUrl?: string | null;
  images?: string[];
  categoryId: string;
  isFeatured?: boolean;
  stockStatus?: string;
  stockQuantity?: number;
  lowStockAlert?: number;
  category?: Cat | null;
};

const emptyForm = {
  id: "",
  name: "",
  price: "",
  salePrice: "",
  size: "",
  description: "",
  benefits: "",
  ingredients: "",
  categoryId: "",
  imageUrl: "",
  images: [] as string[],
  isFeatured: false,
  stockStatus: "IN_STOCK" as StockStatus,
  stockQuantity: "0",
  lowStockAlert: "3",
};

const STATUS_OPTIONS: { value: StockStatus; label: string; key: string }[] = [
  { value: "IN_STOCK", label: "Em estoque", key: "in_stock" },
  { value: "IN_PRODUCTION", label: "Em produção", key: "in_production" },
  { value: "OUT_OF_STOCK", label: "Esgotado", key: "out_of_stock" },
];

export default function AdminPage() {
  const [authChecking, setAuthChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<"config" | "categorias" | "produtos" | "estoque" | "kits" | "calculadora">("produtos");
  const [stockEdits, setStockEdits] = useState<Record<string, string>>({});
  const [kits, setKits] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Settings
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [heroImageUrlLink, setHeroImageUrlLink] = useState("");
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [heroImageLinks, setHeroImageLinks] = useState<string[]>([]);

  // Categories
  const [categories, setCategories] = useState<Cat[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<Cat | null>(null);

  // Products
  const [products, setProducts] = useState<Prod[]>([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [productCatFilter, setProductCatFilter] = useState<string>("");
  const [prodForm, setProdForm] = useState({ ...emptyForm });
  const [formError, setFormError] = useState<string>("");
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const heroGalleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const ok = await checkAdmin();
        setIsAuthenticated(ok);
      } finally {
        setAuthChecking(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadData();
  }, [isAuthenticated]);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }

  async function loadData() {
    setIsLoading(true);
    try {
      const [settingsData, catsData, prodsData, kitsData, matsData, recsData] = await Promise.all([
        getSettings(),
        getCategories(),
        getProducts(),
        getKits(),
        getMaterials(),
        getRecipes(),
      ]);
      if (settingsData) {
        setWhatsappNumber(settingsData.whatsappNumber || "");
        setHeroImageUrl(settingsData.heroImageUrl || "");
        setHeroImageUrlLink(settingsData.heroImageUrlLink || "");
        setHeroImages(settingsData.heroImages || []);
        setHeroImageLinks(settingsData.heroImageLinks || []);
      }
      setCategories(catsData as Cat[]);
      setProducts(prodsData as unknown as Prod[]);
      setKits(kitsData as any[]);
      setMaterials(matsData as any[]);
      setRecipes(recsData as any[]);
    } catch (e: any) {
      showToast("error", e?.message || "Erro ao carregar dados.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    try {
      const ok = await loginAdmin(password);
      if (ok) setIsAuthenticated(true);
      else setLoginError("Senha incorreta.");
    } catch {
      setLoginError("Erro ao autenticar.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutAdmin();
    setIsAuthenticated(false);
    setPassword("");
  };

  const doUpload = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const url = await uploadImage(fd);
      return url;
    } catch (err: any) {
      showToast("error", err?.message || "Erro ao enviar imagem.");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSingleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "hero" | "productMain"
  ) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    e.target.value = "";
    const url = await doUpload(file);
    if (!url) return;
    if (field === "hero") setHeroImageUrl(url);
    else setProdForm((p) => ({ ...p, imageUrl: url }));
    showToast("success", "Imagem enviada!");
  };

  // Galeria de produto: aceita múltiplos arquivos
  const handleGalleryAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    e.target.value = "";
    const urls: string[] = [];
    for (const f of files) {
      const url = await doUpload(f);
      if (url) urls.push(url);
    }
    if (urls.length > 0) {
      setProdForm((p) => ({ ...p, images: [...(p.images || []), ...urls] }));
      showToast("success", `${urls.length} imagem(ns) adicionada(s).`);
    }
  };

  const removeGalleryImage = (idx: number) => {
    setProdForm((p) => ({
      ...p,
      images: (p.images || []).filter((_, i) => i !== idx),
    }));
  };

  const moveGalleryImage = (idx: number, dir: -1 | 1) => {
    setProdForm((p) => {
      const arr = [...(p.images || [])];
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= arr.length) return p;
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return { ...p, images: arr };
    });
  };

  // Galeria do hero
  const handleHeroGalleryAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    e.target.value = "";
    const urls: string[] = [];
    for (const f of files) {
      const url = await doUpload(f);
      if (url) urls.push(url);
    }
    if (urls.length > 0) {
      const next = [...heroImages, ...urls];
      const nextLinks = [...heroImageLinks, ...urls.map(() => "")];
      setHeroImages(next);
      setHeroImageLinks(nextLinks);
      try {
        await updateHeroImages(next, nextLinks);
        showToast("success", `${urls.length} imagem(ns) adicionada(s) ao hero.`);
      } catch (err: any) {
        showToast("error", err?.message || "Erro ao salvar galeria.");
      }
    }
  };

  const removeHeroImage = async (idx: number) => {
    const next = heroImages.filter((_, i) => i !== idx);
    const nextLinks = heroImageLinks.filter((_, i) => i !== idx);
    setHeroImages(next);
    setHeroImageLinks(nextLinks);
    try {
      await updateHeroImages(next, nextLinks);
      showToast("success", "Imagem removida.");
    } catch (err: any) {
      showToast("error", err?.message || "Erro.");
    }
  };

  const moveHeroImage = async (idx: number, dir: -1 | 1) => {
    const arr = [...heroImages];
    const arrLinks = [...heroImageLinks];
    while (arrLinks.length < arr.length) arrLinks.push("");
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= arr.length) return;
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    [arrLinks[idx], arrLinks[newIdx]] = [arrLinks[newIdx], arrLinks[idx]];
    setHeroImages(arr);
    setHeroImageLinks(arrLinks);
    try {
      await updateHeroImages(arr, arrLinks);
    } catch (err: any) {
      showToast("error", err?.message || "Erro.");
    }
  };

  const handleSaveConfig = async () => {
    try {
      await updateSettings({
        whatsappNumber,
        heroImageUrl,
        heroImageUrlLink,
        heroImageLinks,
      });
      showToast("success", "Configurações salvas!");
    } catch (e: any) {
      showToast("error", e?.message || "Erro ao salvar.");
    }
  };

  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, newCategoryName);
        setEditingCategory(null);
      } else {
        await createCategory(newCategoryName);
      }
      setNewCategoryName("");
      await loadData();
      showToast("success", "Categoria salva!");
    } catch (e: any) {
      showToast("error", e?.message || "Erro ao salvar categoria.");
    }
  };

  const handleEditCategory = (cat: Cat) => {
    setEditingCategory(cat);
    setNewCategoryName(cat.name);
  };

  const handleCancelCategory = () => {
    setEditingCategory(null);
    setNewCategoryName("");
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Excluir esta categoria também removerá todos os produtos dela. Tem certeza?")) return;
    try {
      await deleteCategory(id);
      await loadData();
      showToast("success", "Categoria excluída.");
    } catch (e: any) {
      showToast("error", e?.message || "Erro ao excluir.");
    }
  };

  const openProductModal = (prod?: Prod) => {
    setFormError("");
    if (prod) {
      setProdForm({
        id: prod.id,
        name: prod.name,
        price: prod.price.toString().replace(".", ","),
        salePrice: prod.salePrice ? prod.salePrice.toString().replace(".", ",") : "",
        size: prod.size || "",
        description: prod.description || "",
        benefits: prod.benefits || "",
        ingredients: prod.ingredients || "",
        categoryId: prod.categoryId || "",
        imageUrl: prod.imageUrl || "",
        images: prod.images || [],
        isFeatured: !!prod.isFeatured,
        stockStatus: (prod.stockStatus as StockStatus) || "IN_STOCK",
        stockQuantity: (prod.stockQuantity ?? 0).toString(),
        lowStockAlert: (prod.lowStockAlert ?? 3).toString(),
      });
    } else {
      setProdForm({ ...emptyForm, categoryId: categories[0]?.id || "" });
    }
    setIsProductModalOpen(true);
  };

  const closeProductModal = () => {
    setIsProductModalOpen(false);
    setFormError("");
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const priceNum = parseFloat(prodForm.price.replace(",", "."));
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setFormError("Preço inválido.");
      return;
    }
    let saleNum: number | null = null;
    if (prodForm.salePrice.trim()) {
      const sp = parseFloat(prodForm.salePrice.replace(",", "."));
      if (Number.isNaN(sp) || sp < 0) {
        setFormError("Preço promocional inválido.");
        return;
      }
      if (sp >= priceNum) {
        setFormError("Preço promocional deve ser menor que o preço normal.");
        return;
      }
      saleNum = sp;
    }

    const qty = parseInt(prodForm.stockQuantity || "0", 10);
    const lowAlert = parseInt(prodForm.lowStockAlert || "3", 10);
    if (Number.isNaN(qty) || qty < 0) {
      setFormError("Quantidade em estoque inválida.");
      return;
    }
    const payload = {
      name: prodForm.name.trim(),
      description: prodForm.description.trim(),
      benefits: prodForm.benefits.trim(),
      ingredients: prodForm.ingredients.trim(),
      price: priceNum,
      salePrice: saleNum,
      size: prodForm.size.trim(),
      imageUrl: prodForm.imageUrl,
      images: prodForm.images,
      categoryId: prodForm.categoryId,
      isFeatured: prodForm.isFeatured,
      stockStatus: prodForm.stockStatus,
      stockQuantity: qty,
      lowStockAlert: Number.isNaN(lowAlert) ? 3 : Math.max(0, lowAlert),
    };
    try {
      if (prodForm.id) {
        await updateProduct(prodForm.id, payload);
        showToast("success", "Produto atualizado!");
      } else {
        await createProduct(payload);
        showToast("success", "Produto criado!");
      }
      closeProductModal();
      await loadData();
    } catch (err: any) {
      setFormError(err?.message || "Erro ao salvar.");
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Excluir "${name}"?`)) return;
    try {
      await deleteProduct(id);
      await loadData();
      showToast("success", "Produto excluído.");
    } catch (e: any) {
      showToast("error", e?.message || "Erro ao excluir.");
    }
  };

  const handleToggleFeatured = async (id: string, current: boolean) => {
    try {
      await toggleFeatured(id, !current);
      await loadData();
    } catch (e: any) {
      showToast("error", e?.message || "Erro ao atualizar.");
    }
  };

  const handleQuickStockChange = async (id: string, status: StockStatus) => {
    try {
      await updateStockStatus(id, status);
      await loadData();
    } catch (e: any) {
      showToast("error", e?.message || "Erro ao atualizar estoque.");
    }
  };

  const handleAdjustStock = async (id: string, delta: number) => {
    try {
      await adjustStock(id, delta);
      await loadData();
    } catch (e: any) {
      showToast("error", e?.message || "Erro ao ajustar estoque.");
    }
  };

  const handleSaveStockEdit = async (id: string) => {
    const raw = stockEdits[id];
    if (raw === undefined) return;
    const n = parseInt(raw, 10);
    if (Number.isNaN(n) || n < 0) {
      showToast("error", "Quantidade inválida.");
      return;
    }
    try {
      await updateStockQuantity(id, n);
      setStockEdits((s) => {
        const { [id]: _, ...rest } = s;
        return rest;
      });
      await loadData();
      showToast("success", "Estoque atualizado!");
    } catch (e: any) {
      showToast("error", e?.message || "Erro ao salvar estoque.");
    }
  };

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDraggingFile(true); };
  const onDragLeave = () => setIsDraggingFile(false);
  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const url = await doUpload(file);
      if (url) {
        setProdForm((p) => ({ ...p, imageUrl: url }));
        showToast("success", "Imagem enviada!");
      }
    }
  };

  if (authChecking) {
    return <div className="admin-loading-screen">Verificando sessão...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="admin-login">
        <div className="admin-login-card">
          <div className="admin-login-icon">
            <Lock size={30} />
          </div>
          <h1>Área Restrita</h1>
          <p>Informe a senha para acessar o painel.</p>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              className="admin-input"
              placeholder="Senha de acesso"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              disabled={loginLoading}
            />
            {loginError && <p className="admin-error">{loginError}</p>}
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loginLoading || !password}
            >
              {loginLoading ? "Entrando..." : "Entrar no Painel"}
            </button>
          </form>
          <div style={{ marginTop: "20px", textAlign: "center", borderTop: "1px solid var(--color-bg-dark)", paddingTop: "15px" }}>
            <a
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                color: "var(--color-gold-dark)",
                fontSize: "0.9rem",
                textDecoration: "none",
                fontWeight: "500",
                transition: "color 0.2s"
              }}
              className="hover-gold"
            >
              <ArrowLeft size={16} /> Voltar para a Loja
            </a>
          </div>
        </div>
      </div>
    );
  }

  const filteredProducts = products.filter((p) => {
    const q = productSearch.trim().toLowerCase();
    const matchSearch = q
      ? p.name.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q)
      : true;
    const matchCat = productCatFilter ? p.categoryId === productCatFilter : true;
    return matchSearch && matchCat;
  });

  const linkOptions = useMemo(() => {
    const list = [
      { value: "", label: "Nenhum link (não clicável)" },
      { value: "/presente", label: "Monte seu Presente (página)" },
      { value: "/carrinho", label: "Sacola de Compras" },
    ];
    kits.forEach((k) => {
      list.push({ value: `/?kit=${k.id}`, label: `Kit: ${k.name}` });
    });
    products.forEach((p) => {
      list.push({ value: `/?product=${p.id}`, label: `Produto: ${p.name}` });
    });
    return list;
  }, [products, kits]);

  const featuredCount = products.filter((p) => p.isFeatured).length;
  const unavailableCount = products.filter((p) => p.stockStatus && p.stockStatus !== "IN_STOCK").length;

  return (
    <div className="admin-layout">
      {/* Topbar mobile */}
      <div className="admin-topbar mobile-only">
        <h2 className="admin-topbar-logo">Lavena <span>Admin</span></h2>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <a href="/" className="btn-icon-only" aria-label="Ir para a loja" style={{ color: "var(--color-gold-dark)" }}>
            <ArrowLeft size={18} />
          </a>
          <button onClick={handleLogout} className="btn-icon-only" aria-label="Sair">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header desktop-only">
          <h2>Lavena <span>Admin</span></h2>
        </div>
        <nav className="admin-sidebar-nav">
          <button
            className={`admin-nav-item ${activeTab === "produtos" ? "active" : ""}`}
            onClick={() => setActiveTab("produtos")}
          >
            <Package size={18} /> <span>Produtos</span>
            <span className="admin-nav-count">{products.length}</span>
          </button>
          <button
            className={`admin-nav-item ${activeTab === "kits" ? "active" : ""}`}
            onClick={() => setActiveTab("kits")}
          >
            <Gift size={18} /> <span>Kits</span>
            <span className="admin-nav-count">{kits.length}</span>
          </button>
          <button
            className={`admin-nav-item ${activeTab === "estoque" ? "active" : ""}`}
            onClick={() => setActiveTab("estoque")}
          >
            <Boxes size={18} /> <span>Estoque</span>
            <span className="admin-nav-count">{products.reduce((s, p) => s + (p.stockQuantity ?? 0), 0)}</span>
          </button>
          <button
            className={`admin-nav-item ${activeTab === "categorias" ? "active" : ""}`}
            onClick={() => setActiveTab("categorias")}
          >
            <LayoutGrid size={18} /> <span>Categorias</span>
            <span className="admin-nav-count">{categories.length}</span>
          </button>
          <button
            className={`admin-nav-item ${activeTab === "calculadora" ? "active" : ""}`}
            onClick={() => setActiveTab("calculadora")}
          >
            <CalcIcon size={18} /> <span>Calculadora</span>
            <span className="admin-nav-count">{recipes.length}</span>
          </button>
          <button
            className={`admin-nav-item ${activeTab === "config" ? "active" : ""}`}
            onClick={() => setActiveTab("config")}
          >
            <SettingsIcon size={18} /> <span>Configurações</span>
          </button>
        </nav>
        <div className="admin-sidebar-footer desktop-only" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <a
            href="/"
            className="btn btn-outline w-full"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              textDecoration: "none",
              fontSize: "0.9rem"
            }}
          >
            <ArrowLeft size={16} /> Ir para a Loja
          </a>
          <button
            onClick={handleLogout}
            className="btn btn-outline w-full"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              borderColor: "rgba(220, 53, 69, 0.2)",
              color: "#dc3545",
              fontSize: "0.9rem"
            }}
          >
            <LogOut size={16} /> Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="admin-main">
        {isLoading ? (
          <div className="admin-loading">Carregando dados...</div>
        ) : (
          <div className="admin-content-fade">
            {/* ═══ CONFIG ═══ */}
            {activeTab === "config" && (
              <div className="admin-panel-card">
                <div className="admin-panel-header">
                  <h1 className="admin-title">Configurações</h1>
                  <p className="admin-subtitle">Informações gerais e galeria do topo.</p>
                </div>

                <div className="admin-form-group">
                  <label htmlFor="whatsapp">
                    <Phone size={14} /> Número do WhatsApp
                  </label>
                  <input
                    id="whatsapp"
                    type="tel"
                    className="admin-input"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, ""))}
                    placeholder="5511999999999"
                  />
                  <small className="admin-hint">DDI + DDD + número, sem espaços.</small>
                </div>

                <div className="admin-form-group">
                  <label>
                    <ImageIcon size={14} /> Logo padrão (imagem única usada quando não há galeria)
                  </label>
                  <div className="admin-upload-row">
                    <div className="admin-upload-preview">
                      {heroImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={heroImageUrl} alt="Logo" />
                      ) : (
                        <span className="admin-upload-empty">Sem imagem</span>
                      )}
                    </div>
                    <label className="btn btn-outline admin-upload-btn">
                      <Upload size={16} />
                      {isUploading ? "Enviando..." : "Selecionar imagem"}
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => handleSingleUpload(e, "hero")}
                        disabled={isUploading}
                      />
                    </label>
                  </div>
                  <small className="admin-hint">
                    Otimizada automaticamente (WEBP de alta qualidade até 2000px).
                  </small>
                  <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>Link ao clicar na logo padrão:</label>
                    <select
                      className="admin-input"
                      style={{ maxWidth: "400px" }}
                      value={heroImageUrlLink}
                      onChange={(e) => setHeroImageUrlLink(e.target.value)}
                    >
                      {linkOptions.map((opt: { value: string; label: string }) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button onClick={handleSaveConfig} className="btn btn-primary admin-save-btn" disabled={isUploading}>
                  <Save size={16} /> Salvar configurações
                </button>

                <div className="admin-panel-header" style={{ marginTop: 28 }}>
                  <h2 className="admin-title" style={{ fontSize: "1.3rem" }}>
                    Galeria do topo (carrossel)
                  </h2>
                  <p className="admin-subtitle">
                    Adicione múltiplas imagens — elas vão passar automaticamente no topo do site.
                    Se ficar vazio, usa a logo padrão acima.
                  </p>
                </div>

                <div className="admin-gallery" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px" }}>
                  {heroImages.map((url, idx) => (
                    <div key={`${url}-${idx}`} className="admin-gallery-item" style={{ height: "auto", display: "flex", flexDirection: "column", gap: "8px", border: "1px solid var(--color-bg-dark)", padding: "10px", borderRadius: "12px", background: "#fff", position: "relative" }}>
                      <div style={{ position: "relative", width: "100%", aspectRatio: "3/2", overflow: "hidden", borderRadius: "8px" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Hero ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <button
                          type="button"
                          onClick={() => removeHeroImage(idx)}
                          className="admin-gallery-item-remove"
                          style={{ position: "absolute", top: "6px", right: "6px", background: "rgba(220,53,69,0.9)", color: "#fff", border: "none", borderRadius: "50%", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 2 }}
                          aria-label="Remover imagem"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.8rem", color: "var(--color-text-light)" }}>Imagem ${idx + 1}</span>
                        <div style={{ display: "flex", gap: "4px" }}>
                          <button
                            type="button"
                            onClick={() => moveHeroImage(idx, -1)}
                            disabled={idx === 0}
                            className="btn btn-outline btn-xs"
                            style={{ padding: "2px 6px", fontSize: "0.75rem" }}
                            aria-label="Mover para esquerda"
                          >
                            <ArrowLeft size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveHeroImage(idx, 1)}
                            disabled={idx === heroImages.length - 1}
                            className="btn btn-outline btn-xs"
                            style={{ padding: "2px 6px", fontSize: "0.75rem" }}
                            aria-label="Mover para direita"
                          >
                            <ArrowRight size={12} />
                          </button>
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%" }}>
                        <label style={{ fontSize: "0.8rem", fontWeight: "600", color: "var(--color-text)" }}>Link ao clicar:</label>
                        <select
                          className="admin-input"
                          style={{ fontSize: "0.8rem", padding: "4px 8px", width: "100%" }}
                          value={heroImageLinks[idx] || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setHeroImageLinks((prev) => {
                              const next = [...prev];
                              while (next.length <= idx) next.push("");
                              next[idx] = val;
                              return next;
                            });
                          }}
                        >
                          {linkOptions.map((opt: { value: string; label: string }) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="admin-gallery-add"
                    onClick={() => heroGalleryInputRef.current?.click()}
                  >
                    <Plus size={20} />
                    <span>{isUploading ? "Enviando..." : "Adicionar"}</span>
                    <small>JPG/PNG/WEBP</small>
                  </button>
                  <input
                    ref={heroGalleryInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={handleHeroGalleryAdd}
                    disabled={isUploading}
                  />
                </div>
              </div>
            )}

            {/* ═══ CATEGORIAS ═══ */}
            {activeTab === "categorias" && (
              <div className="admin-panel-card">
                <div className="admin-panel-header">
                  <h1 className="admin-title">Categorias</h1>
                  <p className="admin-subtitle">Organize seus produtos por tipo.</p>
                </div>

                <div className="admin-quick-form">
                  <label htmlFor="newCat">
                    {editingCategory ? "Editar categoria" : "Nova categoria"}
                  </label>
                  <div className="admin-quick-row">
                    <input
                      id="newCat"
                      type="text"
                      className="admin-input"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Ex: Sabonetes Naturais"
                      onKeyDown={(e) => e.key === "Enter" && handleSaveCategory()}
                    />
                    <button onClick={handleSaveCategory} className="btn btn-primary" disabled={!newCategoryName.trim()}>
                      {editingCategory ? <><Save size={16} /> Salvar</> : <><Plus size={16} /> Adicionar</>}
                    </button>
                    {editingCategory && (
                      <button onClick={handleCancelCategory} className="btn btn-outline" aria-label="Cancelar">
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="admin-cat-list">
                  {categories.length === 0 ? (
                    <p className="admin-empty">Nenhuma categoria cadastrada.</p>
                  ) : (
                    categories.map((cat) => {
                      const count = products.filter((p) => p.categoryId === cat.id).length;
                      return (
                        <div key={cat.id} className="admin-cat-item">
                          <div className="admin-cat-info">
                            <strong>{cat.name}</strong>
                            <small>{count} {count === 1 ? "produto" : "produtos"} · /{cat.slug}</small>
                          </div>
                          <div className="admin-cat-actions">
                            <button onClick={() => handleEditCategory(cat)} className="btn-icon-only" aria-label="Editar">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDeleteCategory(cat.id)} className="btn-icon-only danger" aria-label="Excluir">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* ═══ PRODUTOS ═══ */}
            {activeTab === "kits" && (
              <KitManager
                initialKits={kits as any}
                products={products as any}
                onChange={loadData}
                showToast={showToast}
              />
            )}

            {activeTab === "calculadora" && (
              <Calculator
                initialMaterials={materials as any}
                initialRecipes={recipes as any}
                products={products as any}
                showToast={showToast}
              />
            )}

            {activeTab === "estoque" && (() => {
              const totalUnits = products.reduce((s, p) => s + (p.stockQuantity ?? 0), 0);
              const totalValue = products.reduce(
                (s, p) => s + (p.stockQuantity ?? 0) * (p.salePrice && p.salePrice > 0 ? p.salePrice : p.price),
                0
              );
              const inStock = products.filter((p) => (p.stockQuantity ?? 0) > 0).length;
              const outStock = products.filter((p) => (p.stockQuantity ?? 0) === 0).length;
              const lowStock = products.filter((p) => {
                const q = p.stockQuantity ?? 0;
                const t = p.lowStockAlert ?? 3;
                return q > 0 && q <= t;
              });

              const filtered = products.filter((p) => {
                const q = productSearch.trim().toLowerCase();
                const matchSearch = q
                  ? p.name.toLowerCase().includes(q)
                  : true;
                const matchCat = productCatFilter ? p.categoryId === productCatFilter : true;
                return matchSearch && matchCat;
              });

              return (
                <div className="admin-panel-card">
                  <div className="admin-panel-header">
                    <h1 className="admin-title">Estoque</h1>
                    <p className="admin-subtitle">Visão geral das unidades disponíveis.</p>
                  </div>

                  {/* Cards de resumo */}
                  <div className="stock-summary-grid">
                    <div className="stock-summary-card">
                      <div className="stock-summary-icon green"><Package size={20} /></div>
                      <div>
                        <small>Total de unidades</small>
                        <strong>{totalUnits}</strong>
                      </div>
                    </div>
                    <div className="stock-summary-card">
                      <div className="stock-summary-icon gold">
                        R$
                      </div>
                      <div>
                        <small>Valor em estoque</small>
                        <strong>
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalValue)}
                        </strong>
                      </div>
                    </div>
                    <div className="stock-summary-card">
                      <div className="stock-summary-icon blue"><Check size={20} /></div>
                      <div>
                        <small>Produtos com estoque</small>
                        <strong>{inStock}</strong>
                      </div>
                    </div>
                    <div className="stock-summary-card">
                      <div className="stock-summary-icon danger"><TrendingDown size={20} /></div>
                      <div>
                        <small>Produtos sem estoque</small>
                        <strong>{outStock}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Alerta de estoque baixo */}
                  {lowStock.length > 0 && (
                    <div className="stock-low-alert">
                      <AlertTriangle size={18} />
                      <div>
                        <strong>{lowStock.length} {lowStock.length === 1 ? "produto está" : "produtos estão"} com estoque baixo</strong>
                        <p>{lowStock.map(p => p.name).slice(0, 5).join(", ")}{lowStock.length > 5 ? "..." : ""}</p>
                      </div>
                    </div>
                  )}

                  {/* Toolbar */}
                  <div className="admin-toolbar">
                    <div className="admin-search">
                      <Search size={14} />
                      <input
                        type="search"
                        placeholder="Buscar produto..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                      />
                    </div>
                    <div className="admin-select-wrap">
                      <select
                        value={productCatFilter}
                        onChange={(e) => setProductCatFilter(e.target.value)}
                        className="admin-input"
                        title="Filtrar por categoria"
                      >
                        <option value="">Todas as categorias</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="admin-select-chev" />
                    </div>
                  </div>

                  {/* Lista de estoque */}
                  {filtered.length === 0 ? (
                    <p className="admin-empty">Nenhum produto encontrado.</p>
                  ) : (
                    <div className="stock-list">
                      {filtered.map((p) => {
                        const qty = p.stockQuantity ?? 0;
                        const alert = p.lowStockAlert ?? 3;
                        const isLow = qty > 0 && qty <= alert;
                        const isOut = qty === 0;
                        const editing = stockEdits[p.id] !== undefined;
                        const editValue = editing ? stockEdits[p.id] : qty.toString();
                        return (
                          <div
                            key={p.id}
                            className={`stock-row ${isOut ? "is-out" : isLow ? "is-low" : ""}`}
                          >
                            <div className="stock-row-thumb">
                              {p.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={p.imageUrl} alt={p.name} />
                              ) : (
                                <div className="stock-row-thumb-empty">—</div>
                              )}
                            </div>
                            <div className="stock-row-info">
                              <strong>{p.name}</strong>
                              <small>{p.category?.name || "Sem categoria"} · {p.size || "—"}</small>
                            </div>
                            <div className="stock-row-status">
                              {isOut && <span className="pill danger"><TrendingDown size={12} /> Sem estoque</span>}
                              {!isOut && isLow && <span className="pill warn"><AlertTriangle size={12} /> Baixo</span>}
                              {!isOut && !isLow && <span className="pill ok"><Check size={12} /> OK</span>}
                            </div>
                            <div className="stock-row-controls">
                              <button
                                onClick={() => handleAdjustStock(p.id, -1)}
                                className="qty-btn"
                                aria-label="Diminuir 1"
                                disabled={qty === 0}
                              >
                                <Minus size={14} />
                              </button>
                              <input
                                type="number"
                                inputMode="numeric"
                                className="stock-qty-input"
                                value={editValue}
                                min={0}
                                onChange={(e) =>
                                  setStockEdits((s) => ({ ...s, [p.id]: e.target.value }))
                                }
                                onBlur={() => editing && handleSaveStockEdit(p.id)}
                                onKeyDown={(e) => e.key === "Enter" && handleSaveStockEdit(p.id)}
                                aria-label="Quantidade"
                              />
                              <button
                                onClick={() => handleAdjustStock(p.id, 1)}
                                className="qty-btn"
                                aria-label="Aumentar 1"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {activeTab === "produtos" && (
              <div className="admin-panel-card">
                <div className="admin-panel-header admin-products-header">
                  <div>
                    <h1 className="admin-title">Produtos</h1>
                    <p className="admin-subtitle">
                      {products.length} produtos · {featuredCount} em destaque · {unavailableCount} indisponíveis
                    </p>
                  </div>
                  <button
                    onClick={() => openProductModal()}
                    className="btn btn-primary"
                    disabled={categories.length === 0}
                    title={categories.length === 0 ? "Crie uma categoria primeiro" : ""}
                  >
                    <Plus size={16} /> Novo produto
                  </button>
                </div>

                {categories.length === 0 && (
                  <div className="admin-warn">
                    Crie ao menos uma categoria antes de adicionar produtos.
                  </div>
                )}

                <div className="admin-toolbar">
                  <div className="admin-search">
                    <Search size={14} />
                    <input
                      type="search"
                      placeholder="Buscar produto..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                  </div>
                  <div className="admin-select-wrap">
                    <select
                      value={productCatFilter}
                      onChange={(e) => setProductCatFilter(e.target.value)}
                      className="admin-input"
                      title="Filtrar produtos por categoria"
                    >
                      <option value="">Todas as categorias</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="admin-select-chev" />
                  </div>
                </div>

                {filteredProducts.length === 0 ? (
                  <p className="admin-empty">Nenhum produto encontrado.</p>
                ) : (
                  <div className="admin-products-grid">
                    {filteredProducts.map((prod) => {
                      const status = prod.stockStatus || "IN_STOCK";
                      const unavailable = status !== "IN_STOCK";
                      const hasSale = !!prod.salePrice && prod.salePrice > 0 && prod.salePrice < prod.price;
                      const pct = hasSale
                        ? Math.round(((prod.price - (prod.salePrice as number)) / prod.price) * 100)
                        : 0;
                      return (
                        <div
                          key={prod.id}
                          className={`admin-product-card ${unavailable ? "unavailable" : ""}`}
                        >
                          <div className="admin-product-thumb">
                            {prod.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={prod.imageUrl} alt={prod.name} />
                            ) : (
                              <span>Sem imagem</span>
                            )}
                            <button
                              onClick={() => handleToggleFeatured(prod.id, !!prod.isFeatured)}
                              className={`admin-feature-toggle ${prod.isFeatured ? "active" : ""}`}
                              title={prod.isFeatured ? "Remover destaque" : "Marcar como destaque"}
                              aria-label="Alternar destaque"
                            >
                              <Star size={14} fill={prod.isFeatured ? "currentColor" : "none"} />
                            </button>
                            {status === "IN_PRODUCTION" && (
                              <div className="admin-product-status-pill warn">Em produção</div>
                            )}
                            {status === "OUT_OF_STOCK" && (
                              <div className="admin-product-status-pill danger">Esgotado</div>
                            )}
                          </div>
                          <div className="admin-product-info">
                            <span className="admin-product-cat">{prod.category?.name || "—"}</span>
                            <h3>{prod.name}</h3>
                            <div>
                              {hasSale && (
                                <span className="admin-product-price-original">
                                  R$ {prod.price.toFixed(2).replace(".", ",")}
                                </span>
                              )}
                              <strong className="admin-product-price">
                                R$ {(hasSale ? prod.salePrice! : prod.price).toFixed(2).replace(".", ",")}
                              </strong>
                              {hasSale && <span className="admin-product-promo">-{pct}%</span>}
                            </div>
                            {prod.size && <small className="admin-product-size">{prod.size}</small>}

                            <div className="admin-product-qty">
                              <Boxes size={12} />
                              <span>
                                <strong>{prod.stockQuantity ?? 0}</strong> em estoque
                              </span>
                              {(prod.stockQuantity ?? 0) > 0 &&
                                (prod.stockQuantity ?? 0) <= (prod.lowStockAlert ?? 3) && (
                                  <span className="pill warn" style={{ marginLeft: "auto" }}>
                                    <AlertTriangle size={10} /> baixo
                                  </span>
                                )}
                            </div>

                            <div className="admin-select-wrap" style={{ marginTop: 8 }}>
                              <select
                                value={status}
                                onChange={(e) => handleQuickStockChange(prod.id, e.target.value as StockStatus)}
                                className="admin-input"
                                style={{ minHeight: 36, padding: "6px 28px 6px 10px", fontSize: "0.82rem" }}
                                aria-label="Status de estoque"
                              >
                                {STATUS_OPTIONS.map((s) => (
                                  <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                              </select>
                              <ChevronDown size={12} className="admin-select-chev" />
                            </div>
                          </div>
                          <div className="admin-product-actions">
                            <button onClick={() => openProductModal(prod)} className="btn btn-outline btn-sm">
                              <Edit2 size={14} /> Editar
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(prod.id, prod.name)}
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
              </div>
            )}
          </div>
        )}
      </main>

      {/* PRODUCT MODAL */}
      {isProductModalOpen && (
        <div className="admin-modal-overlay" onClick={closeProductModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{prodForm.id ? "Editar produto" : "Novo produto"}</h2>
              <button onClick={closeProductModal} className="btn-icon-only" aria-label="Fechar">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveProduct} className="admin-modal-body">
              {/* Imagem principal */}
              <div className="admin-form-group">
                <label>Imagem principal</label>
                <div
                  className={`admin-dropzone ${isDraggingFile ? "is-dragging" : ""} ${prodForm.imageUrl ? "has-image" : ""}`}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {prodForm.imageUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={prodForm.imageUrl} alt="Produto" />
                      <span className="admin-dropzone-overlay">
                        <Upload size={18} /> Trocar imagem
                      </span>
                    </>
                  ) : (
                    <div className="admin-dropzone-empty">
                      <Upload size={28} />
                      <span>{isUploading ? "Enviando..." : "Clique ou arraste uma imagem"}</span>
                      <small>JPG, PNG, WEBP · até 10 MB</small>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => handleSingleUpload(e, "productMain")}
                    disabled={isUploading}
                  />
                </div>
              </div>

              {/* Galeria do produto */}
              <div className="admin-form-group">
                <label>Galeria de imagens (carrossel)</label>
                <small className="admin-hint" style={{ marginTop: 0, marginBottom: 8 }}>
                  A imagem principal entra primeiro. Adicione mais imagens aqui — elas viram um carrossel na tela do produto.
                </small>
                <div className="admin-gallery">
                  {(prodForm.images || []).map((url, idx) => (
                    <div key={`${url}-${idx}`} className="admin-gallery-item">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Imagem ${idx + 1}`} />
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(idx)}
                        className="admin-gallery-item-remove"
                        aria-label="Remover"
                      >
                        <X size={14} />
                      </button>
                      <div className="admin-gallery-item-order">
                        <button
                          type="button"
                          onClick={() => moveGalleryImage(idx, -1)}
                          disabled={idx === 0}
                          aria-label="Anterior"
                        >
                          <ArrowLeft size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveGalleryImage(idx, 1)}
                          disabled={idx === (prodForm.images?.length || 0) - 1}
                          aria-label="Próximo"
                        >
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="admin-gallery-add"
                    onClick={() => galleryInputRef.current?.click()}
                  >
                    <Plus size={20} />
                    <span>{isUploading ? "Enviando..." : "Adicionar"}</span>
                    <small>vários ok</small>
                  </button>
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={handleGalleryAdd}
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
                    value={prodForm.name}
                    onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                    placeholder="Sabonete de Lavanda"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Categoria *</label>
                  <div className="admin-select-wrap">
                    <select
                      required
                      className="admin-input"
                      value={prodForm.categoryId}
                      onChange={(e) => setProdForm({ ...prodForm, categoryId: e.target.value })}
                      title="Categoria do produto"
                    >
                      <option value="">Selecionar...</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="admin-select-chev" />
                  </div>
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
                    value={prodForm.price}
                    onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })}
                    placeholder="35,00"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Preço promocional (R$)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="admin-input"
                    value={prodForm.salePrice}
                    onChange={(e) => setProdForm({ ...prodForm, salePrice: e.target.value })}
                    placeholder="Deixe vazio se não houver"
                  />
                  <small className="admin-hint">
                    {prodForm.salePrice && prodForm.price && (() => {
                      const p = parseFloat(prodForm.price.replace(",", "."));
                      const s = parseFloat(prodForm.salePrice.replace(",", "."));
                      if (!isNaN(p) && !isNaN(s) && s > 0 && s < p) {
                        const pct = Math.round(((p - s) / p) * 100);
                        return `Desconto de ${pct}% — aparecerá no card como -${pct}%.`;
                      }
                      return "Quando preenchido, o site mostra preço riscado + badge de desconto.";
                    })()}
                  </small>
                </div>
              </div>

              <div className="admin-form-group">
                <label>Tamanho / peso</label>
                <input
                  type="text"
                  className="admin-input"
                  value={prodForm.size}
                  onChange={(e) => setProdForm({ ...prodForm, size: e.target.value })}
                  placeholder="150g"
                />
              </div>

              <div className="admin-grid-2">
                <div className="admin-form-group">
                  <label><Boxes size={14} /> Quantidade em estoque</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    className="admin-input"
                    value={prodForm.stockQuantity}
                    min={0}
                    onChange={(e) => setProdForm({ ...prodForm, stockQuantity: e.target.value })}
                    placeholder="0"
                  />
                  <small className="admin-hint">Quantas unidades você tem deste produto.</small>
                </div>
                <div className="admin-form-group">
                  <label><AlertTriangle size={14} /> Alerta de estoque baixo</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    className="admin-input"
                    value={prodForm.lowStockAlert}
                    min={0}
                    onChange={(e) => setProdForm({ ...prodForm, lowStockAlert: e.target.value })}
                    placeholder="3"
                  />
                  <small className="admin-hint">Aviso quando a quantidade chegar a esse número.</small>
                </div>
              </div>

              <div className="admin-form-group">
                <label>Status de estoque</label>
                <div className="stock-status-group">
                  {STATUS_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`stock-status-option ${opt.key} ${prodForm.stockStatus === opt.value ? "is-active" : ""}`}
                    >
                      <input
                        type="radio"
                        name="stockStatus"
                        value={opt.value}
                        checked={prodForm.stockStatus === opt.value}
                        onChange={() => setProdForm({ ...prodForm, stockStatus: opt.value })}
                      />
                      <span className="stock-status-option-dot" aria-hidden />
                      {opt.label}
                    </label>
                  ))}
                </div>
                <small className="admin-hint">
                  Quando não está &quot;Em estoque&quot;, o produto continua visível no site mas com um aviso e sem botão de comprar.
                </small>
              </div>

              <div className="admin-form-group">
                <label>Descrição curta *</label>
                <textarea
                  required
                  className="admin-input admin-textarea"
                  value={prodForm.description}
                  onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                  placeholder="Sabonete suave com aroma relaxante de lavanda..."
                  maxLength={240}
                />
                <small className="admin-hint">{prodForm.description.length}/240</small>
              </div>

              <div className="admin-grid-2">
                <div className="admin-form-group">
                  <label>Benefícios</label>
                  <textarea
                    className="admin-input admin-textarea"
                    value={prodForm.benefits}
                    onChange={(e) => setProdForm({ ...prodForm, benefits: e.target.value })}
                    placeholder="- Hidratação intensa&#10;- Aroma relaxante"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Ingredientes</label>
                  <textarea
                    className="admin-input admin-textarea"
                    value={prodForm.ingredients}
                    onChange={(e) => setProdForm({ ...prodForm, ingredients: e.target.value })}
                    placeholder="Glicerina vegetal, óleo essencial de lavanda..."
                  />
                </div>
              </div>

              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  checked={prodForm.isFeatured}
                  onChange={(e) => setProdForm({ ...prodForm, isFeatured: e.target.checked })}
                />
                <span><Star size={14} /> Marcar como produto em destaque</span>
              </label>

              {formError && <p className="admin-error">{formError}</p>}

              <div className="admin-modal-footer">
                <button type="button" onClick={closeProductModal} className="btn btn-outline">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={isUploading}>
                  <Save size={16} /> Salvar produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`admin-toast ${toast.type}`} role="status" aria-live="polite">
          {toast.type === "success" ? <Check size={16} /> : <X size={16} />}
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
