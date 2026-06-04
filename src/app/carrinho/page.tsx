"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "../components/CartContext";
import Image from "next/image";
import { getSettings } from "../actions";
import { Minus, Plus, Trash2, MessageCircle, ArrowLeft } from "lucide-react";

export default function CarrinhoPage() {
  const { items, updateQuantity, removeFromCart, total, clearCart } = useCart();
  const [whatsappNumber, setWhatsappNumber] = useState("5511999999999");

  useEffect(() => {
    (async () => {
      const settings = await getSettings();
      if (settings?.whatsappNumber) setWhatsappNumber(settings.whatsappNumber);
    })();
  }, []);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(price);

  const finalizarPedido = () => {
    if (items.length === 0) return;
    const clean = (whatsappNumber || "").replace(/\D/g, "");
    if (!clean) {
      alert("WhatsApp não configurado. Entre em contato.");
      return;
    }

    const linhas: string[] = [];
    linhas.push("✨ *Olá, Lavena!*");
    linhas.push("");
    linhas.push("Gostaria de fazer este pedido:");
    linhas.push("");
    const hasReserva = items.some(i => i.stockStatus === "IN_PRODUCTION");
    const hasProntaEntrega = items.some(i => i.stockStatus !== "IN_PRODUCTION");

    if (hasReserva && hasProntaEntrega) {
      linhas.push("📋 *MEU PEDIDO (Pronta Entrega + Reserva):*");
    } else if (hasReserva) {
      linhas.push("📋 *MINHA RESERVA DE PRODUTOS:*");
    } else {
      linhas.push("📋 *MEU PEDIDO:*");
    }

    items.forEach((item, idx) => {
      const subtotal = item.price * item.quantity;
      const isReserva = item.stockStatus === "IN_PRODUCTION";
      const nameLabel = isReserva ? `${item.name} (RESERVA)` : item.name;
      linhas.push(`🧼 *${nameLabel}*`);
      linhas.push(`   ${item.quantity} un. × ${formatPrice(item.price)} = ${formatPrice(subtotal)}`);
      if (idx < items.length - 1) linhas.push("");
    });
    linhas.push("━━━━━━━━━━━━━━━━━");
    linhas.push("");
    linhas.push(`💰 *Total: ${formatPrice(total)}*`);
    linhas.push("");
    linhas.push("Aguardo retorno para combinar pagamento e entrega 🌿");

    const texto = encodeURIComponent(linhas.join("\n"));
    window.open(`https://wa.me/${clean}?text=${texto}`, "_blank");
    clearCart();
  };

  return (
    <div className="container cart-page">
      <Link href="/" className="cart-back" aria-label="Voltar para loja">
        <ArrowLeft size={16} /> Continuar comprando
      </Link>

      <h1 className="cart-title">Sua sacola</h1>

      {items.length === 0 ? (
        <div className="cart-empty">
          <div className="cart-empty-icon" aria-hidden>🛒</div>
          <p>Sua sacola está vazia.</p>
          <Link href="/#produtos" className="btn btn-primary">Explorar Produtos</Link>
        </div>
      ) : (
        <>
          <div className="cart-layout">
            <div>
              {items.map((item) => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-image">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        sizes="100px"
                        style={{ objectFit: "cover" }}
                        unoptimized={item.imageUrl?.startsWith("data:")}
                      />
                    ) : (
                      <div className="product-image-placeholder">—</div>
                    )}
                  </div>
                  <div className="cart-item-details">
                    <h3 className="cart-item-name">{item.name}</h3>
                    <span className="cart-item-price">{formatPrice(item.price)}</span>
                    <span className="cart-item-subtotal">
                      Subtotal: {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                  <div className="cart-item-controls">
                    <div className="qty-group">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="qty-btn"
                        aria-label="Diminuir quantidade"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="cart-item-qty">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="qty-btn"
                        aria-label="Aumentar quantidade"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="btn-remove"
                      aria-label="Remover item"
                      title="Remover"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <aside className="cart-summary">
              <h2 className="cart-summary-title">Resumo do Pedido</h2>
              <div className="cart-summary-row">
                <span>Subtotal</span>
                <span className="value">{formatPrice(total)}</span>
              </div>
              <div className="cart-summary-row">
                <span>Frete</span>
                <span className="text-muted">A combinar</span>
              </div>
              <div className="cart-summary-row total">
                <span>Total</span>
                <span className="value">{formatPrice(total)}</span>
              </div>
              <div className="cart-finalize desktop-only">
                <button onClick={finalizarPedido} className="btn btn-whatsapp">
                  <MessageCircle size={18} /> Finalizar pelo WhatsApp
                </button>
              </div>
              <p className="cart-note desktop-only">
                Você será redirecionado para o WhatsApp com o resumo do pedido.
              </p>
            </aside>
          </div>

          <div className="cart-sticky-checkout mobile-only">
            <div className="cart-sticky-total">
              <span className="cart-sticky-label">Total</span>
              <span className="cart-sticky-value">{formatPrice(total)}</span>
            </div>
            <button onClick={finalizarPedido} className="btn btn-whatsapp">
              <MessageCircle size={18} /> Finalizar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
