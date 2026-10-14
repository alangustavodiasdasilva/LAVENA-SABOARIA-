"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { Sprig } from "@/components/ui/ornaments";
import { formatBRL } from "@/lib/format";
import type { LastOrder } from "./checkout-utils";

export default function OrderDone({ order, autoOpen = false, onDismiss }: { order: LastOrder; autoOpen?: boolean; onDismiss?: () => void }) {
  useEffect(() => {
    if (!autoOpen || !order.whatsappUrl) return;
    const id = window.setTimeout(() => {
      window.location.href = order.whatsappUrl as string;
    }, 1400);
    return () => window.clearTimeout(id);
  }, [autoOpen, order.whatsappUrl]);

  return (
    <div className="done card">
      <Sprig className="done-sprig" />
      <span className="done-icon">
        <CheckCircle2 size={34} strokeWidth={1.5} />
      </span>
      <h2>{order.code ? "Pedido recebido!" : "Quase lá!"}</h2>
      {order.code && (
        <p className="done-code">
          Número do pedido <strong>{order.code}</strong>
        </p>
      )}
      <p className="done-text">
        {order.whatsappUrl
          ? "Falta só um passo: enviar a mensagem pelo WhatsApp para a Lavena confirmar a disponibilidade, o frete e a forma de pagamento."
          : "Recebemos o seu pedido. Em breve a Lavena entra em contato para combinar pagamento e entrega."}
      </p>
      {order.total > 0 && <p className="done-total">Total do pedido: {formatBRL(order.total)}</p>}
      <div className="done-actions">
        {order.whatsappUrl && (
          <a className="btn btn-whatsapp btn-lg" href={order.whatsappUrl} target="_blank" rel="noopener noreferrer">
            <MessageCircle size={20} /> Abrir o WhatsApp
          </a>
        )}
        <Link href="/loja" className="btn btn-outline btn-lg" onClick={onDismiss}>
          Continuar na loja
        </Link>
      </div>
      {autoOpen && order.whatsappUrl && <p className="hint">Abrindo o WhatsApp automaticamente…</p>}
    </div>
  );
}
