import { formatBRL, formatPhone } from "./format";
import { DELIVERY_LABEL } from "./labels";
import type { DeliveryMethod, OrderItem } from "./types";

export function whatsappLink(phoneDigits: string, text: string): string {
  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(text)}`;
}

/** Remove caracteres que o WhatsApp interpreta como formatação (*, _, ~, `). */
function plain(s: string | null | undefined): string {
  return (s || "").replace(/[*_~`]/g, "").replace(/\s+\n/g, "\n").trim();
}

export type OrderMessageInput = {
  code?: string | null;
  type: "CART" | "GIFT";
  customerName?: string | null;
  customerPhone?: string | null;
  deliveryMethod?: DeliveryMethod | null;
  address?: string | null;
  notes?: string | null;
  recipientName?: string | null;
  cardMessage?: string | null;
  items: OrderItem[];
  total: number;
};

const SEP = "━━━━━━━━━━━━━━━━━";

function itemLines(items: OrderItem[], icon: string): string[] {
  const out: string[] = [];
  items.forEach((it, idx) => {
    out.push(`${icon} *${plain(it.name)}*`);
    out.push(`   ${it.quantity} un. × ${formatBRL(it.unitPrice)} = ${formatBRL(it.unitPrice * it.quantity)}`);
    if (idx < items.length - 1) out.push("");
  });
  return out;
}

export function buildOrderMessage(o: OrderMessageInput): string {
  const L: string[] = [];
  const name = plain(o.customerName);
  const gift = o.type === "GIFT";

  L.push(gift ? "🎁 *Olá, Lavena!*" : "✨ *Olá, Lavena!*");
  L.push("");
  if (gift) {
    const who = plain(o.recipientName);
    L.push(`Sou *${name || "cliente"}* e gostaria de montar uma *sacola presente*${who ? ` para *${who}*` : ""}.`);
  } else {
    L.push(name ? `Sou *${name}* e gostaria de fazer este pedido:` : "Gostaria de fazer este pedido:");
  }
  if (o.code) {
    L.push("");
    L.push(`🧾 Pedido *${o.code}*`);
  }
  L.push("");

  const products = o.items.filter((i) => i.kind !== "bag");
  const bags = o.items.filter((i) => i.kind === "bag");
  const ready = products.filter((i) => !i.reserve);
  const reserves = products.filter((i) => i.reserve);

  if (ready.length > 0) {
    L.push(gift ? "🎀 *ITENS DO PRESENTE:*" : "📋 *MEU PEDIDO (Pronta Entrega):*");
    L.push(...itemLines(ready, gift ? "🌿" : "🧼"));
    L.push("");
  }
  if (reserves.length > 0) {
    L.push("📋 *MINHA RESERVA (sob encomenda):*");
    L.push(...itemLines(reserves, "🧼"));
    L.push("");
  }
  if (bags.length > 0) {
    L.push("🛍️ *EMBALAGEM:*");
    L.push(...itemLines(bags, "🛍️"));
    L.push("");
  }

  L.push(SEP);
  L.push("");
  L.push(`${gift ? "💝" : "💰"} *Total: ${formatBRL(o.total)}*`);
  L.push("_Frete a combinar_");

  if (gift && o.cardMessage?.trim()) {
    L.push("");
    L.push("💌 *Mensagem do cartão:*");
    L.push(`_"${plain(o.cardMessage)}"_`);
  }

  const delivery = o.deliveryMethod ? DELIVERY_LABEL[o.deliveryMethod] : null;
  if (delivery || o.address?.trim() || o.customerPhone) {
    L.push("");
    if (delivery) L.push(`🚚 *Recebimento:* ${delivery}`);
    if (o.address?.trim()) L.push(`📍 ${plain(o.address)}`);
    if (o.customerPhone) L.push(`📱 ${formatPhone(o.customerPhone)}`);
  }

  if (o.notes?.trim()) {
    L.push("");
    L.push("📝 *Observação:*");
    L.push(plain(o.notes));
  }

  L.push("");
  L.push("Aguardo retorno para combinar pagamento e entrega 🌿");
  return L.join("\n");
}
