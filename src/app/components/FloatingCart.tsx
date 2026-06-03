"use client";

import React from "react";
import { useCart } from "./CartContext";
import { ShoppingBag } from "lucide-react";
import { usePathname } from "next/navigation";

export default function FloatingCart() {
  const { totalItems, total } = useCart();
  const pathname = usePathname();

  if (totalItems === 0) return null;
  if (pathname?.startsWith("/carrinho")) return null;
  if (pathname?.startsWith("/admin")) return null;

  const formatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(total);

  return (
    <a href="/carrinho" className="floating-cart mobile-only" aria-label={`Ver carrinho (${totalItems} itens)`}>
      <span className="floating-cart-icon">
        <ShoppingBag size={20} />
        <span className="floating-cart-count">{totalItems}</span>
      </span>
      <span className="floating-cart-label">
        <span className="floating-cart-label-top">Ver carrinho</span>
        <span className="floating-cart-label-bottom">{formatted}</span>
      </span>
    </a>
  );
}
