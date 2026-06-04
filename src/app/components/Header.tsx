"use client";

import React, { useState, useEffect } from "react";
import { useCart } from "./CartContext";
import { ShoppingBag, Menu, X, Gift } from "lucide-react";

export default function Header() {
  const { totalItems } = useCart();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className="header">
      <div className="container header-content">
        <a href="/" className="logo" aria-label="Lavena - Página inicial">
          Lavena<span className="logo-dot">.</span>
        </a>

        {/* Desktop nav */}
        <nav className="header-nav desktop-only">
          <a href="/#produtos">Produtos</a>
          <a href="/#sobre">Sobre</a>
          <a href="/presente" className="header-gift-link">
            <Gift size={14} /> Monte um presente
          </a>
          <a href="/carrinho" className="cart-badge">
            <ShoppingBag size={18} />
            {totalItems > 0 && <span className="cart-count">{totalItems}</span>}
          </a>
        </nav>

        {/* Mobile actions */}
        <div className="mobile-only header-mobile-actions">
          <a href="/presente" className="cart-badge" aria-label="Monte seu presente" style={{ marginRight: '6px' }}>
            <Gift size={18} />
          </a>
          <a href="/carrinho" className="cart-badge" aria-label="Carrinho">
            <ShoppingBag size={18} />
            {totalItems > 0 && <span className="cart-count">{totalItems}</span>}
          </a>
          <button
            className="hamburger-btn"
            onClick={() => setOpen(true)}
            aria-label="Abrir menu"
            aria-expanded={open ? "true" : "false"}
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div
        className={`mobile-drawer-overlay ${open ? "is-open" : ""}`}
        onClick={close}
        aria-hidden={!open ? "true" : "false"}
      />
      <aside
        className={`mobile-drawer ${open ? "is-open" : ""}`}
        aria-hidden={!open ? "true" : "false"}
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
          <a href="/#produtos" onClick={close}>Produtos</a>
          <a href="/#sobre" onClick={close}>Sobre</a>
          <a href="/presente" onClick={close} className="drawer-gift-link">
            <Gift size={16} /> Monte um presente
          </a>
          <a href="/carrinho" onClick={close}>Carrinho{totalItems > 0 ? ` (${totalItems})` : ""}</a>
        </nav>
        <div className="mobile-drawer-footer">
          <p className="footer-tagline">Beleza que vem da natureza ♡</p>
        </div>
      </aside>
    </header>
  );
}
