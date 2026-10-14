"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { useCart } from "./cart";
import { formatBRL } from "@/lib/format";

/** Barra fixa no celular quando há itens na sacola. */
export default function FloatingCart() {
  const { count, subtotal, hydrated } = useCart();
  const pathname = usePathname();
  if (!hydrated || count === 0 || pathname.startsWith("/carrinho")) return null;
  return (
    <Link href="/carrinho" className="floating-cart hide-desktop" aria-label={`Ver sacola, ${count} ${count === 1 ? "item" : "itens"}`}>
      <span className="floating-cart-icon">
        <ShoppingBag size={20} />
        <span className="cart-count">{count}</span>
      </span>
      <span className="floating-cart-text">
        <small>Ver sacola</small>
        <strong>{formatBRL(subtotal)}</strong>
      </span>
      <span className="floating-cart-go">Finalizar</span>
    </Link>
  );
}
