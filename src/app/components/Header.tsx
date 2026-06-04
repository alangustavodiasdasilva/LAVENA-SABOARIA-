"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "./CartContext";
import { ShoppingBag, Menu, X, Gift, Search } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Header() {
  const { totalItems } = useCart();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`, { scroll: false });
      setSearchOpen(false);
      setOpen(false);
      setTimeout(() => {
        const el = document.getElementById('produtos');
        if (el) {
          const y = el.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 400);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchOpen(false);
    router.push('/', { scroll: false });
  };

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className="header">
      <div className="container header-content">
        <Link href="/" className="logo" aria-label="Lavena - Página inicial">
          Lavena<span className="logo-dot">.</span>
        </Link>

        {/* Desktop nav */}
        <nav className="header-nav desktop-only">
          {searchOpen ? (
            <form onSubmit={handleSearch} className="header-search-form">
              <input 
                type="text" 
                autoFocus
                placeholder="Pesquisar..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="header-search-input"
              />
              <button type="button" onClick={clearSearch} className="header-search-close">
                <X size={16} />
              </button>
            </form>
          ) : (
            <>
              <button onClick={() => setSearchOpen(true)} className="header-search-toggle" aria-label="Pesquisar">
                <Search size={18} />
              </button>
              <Link href="/#produtos">Produtos</Link>
              <Link href="/#sobre">Sobre</Link>
              <Link href="/presente" className="header-gift-link">
                <Gift size={14} /> Monte um presente
              </Link>
            </>
          )}
          <Link href="/carrinho" className="cart-badge">
            <ShoppingBag size={18} />
            {totalItems > 0 && <span className="cart-count">{totalItems}</span>}
          </Link>
        </nav>

        {/* Mobile actions */}
        <div className="mobile-only header-mobile-actions">
          <button onClick={() => setSearchOpen(!searchOpen)} className="cart-badge" aria-label="Pesquisar">
            <Search size={18} />
          </button>
          <Link href="/presente" className="cart-badge cart-badge-present" aria-label="Monte seu presente">
            <Gift size={18} />
          </Link>
          <Link href="/carrinho" className="cart-badge" aria-label="Carrinho">
            <ShoppingBag size={18} />
            {totalItems > 0 && <span className="cart-count">{totalItems}</span>}
          </Link>
          <button
            className="hamburger-btn"
            onClick={() => setOpen(true)}
            aria-label="Abrir menu"
            aria-expanded={open}
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="mobile-only header-mobile-search">
          <form onSubmit={handleSearch} className="header-search-form" action="javascript:void(0);">
            <input 
              type="search" 
              autoFocus
              placeholder="Pesquisar produtos..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="header-search-input"
              enterKeyHint="search"
            />
            <button type="submit" className="header-search-toggle" aria-label="Buscar">
              <Search size={16} />
            </button>
          </form>
        </div>
      )}

      {/* Mobile Drawer */}
      <div
        className={`mobile-drawer-overlay ${open ? "is-open" : ""}`}
        onClick={close}
        aria-hidden={!open}
      />
      <aside
        className={`mobile-drawer ${open ? "is-open" : ""}`}
        aria-hidden={!open}
        role="dialog"
        aria-modal="true"
      >
        <div className="mobile-drawer-header">
          <span className="logo">
            Lavena<span className="logo-dot">.</span>
          </span>
          <button className="hamburger-btn" onClick={close} aria-label="Fechar menu">
            <X size={24} />
          </button>
        </div>
        <nav className="mobile-drawer-nav">
          <Link href="/#produtos" onClick={close}>Produtos</Link>
          <Link href="/#sobre" onClick={close}>Sobre</Link>
          <Link href="/presente" onClick={close} className="drawer-gift-link">
            <Gift size={16} /> Monte um presente
          </Link>
          <Link href="/carrinho" onClick={close}>Carrinho{totalItems > 0 ? ` (${totalItems})` : ""}</Link>
        </nav>
        <div className="mobile-drawer-footer">
          <p className="footer-tagline">Beleza que vem da natureza ♡</p>
        </div>
      </aside>
    </header>
  );
}
