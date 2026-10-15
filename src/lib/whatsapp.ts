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

/** "ALAN DIAS" -> "Alan Dias": nome digitado em caixa alta fica legível na mensagem. */
function niceName(s: string | null | undefined): string {
  const t = plain(s);
  if (!t) return "";
  const letters = t.replace(/[^A-Za-zÀ-ÿ]/g, "");
  const shouting = letters.length > 3 && letters === letters.toUpperCase();
  const base = shouting ? t.toLowerCase() : t;
  return base.replace(/(^|[\s'-])([a-zà-ÿ])/g, (_, a: string, b: string) => a + b.toUpperCase());
}

/** Linha de item: "2x Sabonete de Mel  —  R$ 40,00" (sem emojis: alguns celulares mostram "?" no lugar). */
function itemLines(items: OrderItem[]): string[] {
  return items.map((it) => `• ${it.quantity}x ${plain(it.name)} — ${formatBRL(it.unitPrice * it.quantity)}`);
}

export function buildOrderMessage(o: OrderMessageInput): string {
  const L: string[] = [];
  const name = niceName(o.customerName);
  const gift = o.type === "GIFT";

  L.push("Olá, Lavena!");
  L.push("");
  if (gift) {
    const who = niceName(o.recipientName);
    L.push(`Meu nome é *${name || "cliente"}* e quero montar uma *sacola presente*${who ? ` para *${who}*` : ""}.`);
  } else {
    L.push(name ? `Meu nome é *${name}* e quero fazer este pedido:` : "Quero fazer este pedido:");
  }
  if (o.code) {
    L.push("");
    L.push(`*Pedido ${o.code}*`);
  }

  const products = o.items.filter((i) => i.kind !== "bag");
  const bags = o.items.filter((i) => i.kind === "bag");
  const ready = products.filter((i) => !i.reserve);
  const reserves = products.filter((i) => i.reserve);

  if (ready.length > 0) {
    L.push("");
    L.push(gift ? "*Itens do presente*" : "*Itens (pronta entrega)*");
    L.push(...itemLines(ready));
  }
  if (reserves.length > 0) {
    L.push("");
    L.push("*Itens sob encomenda (reserva)*");
    L.push(...itemLines(reserves));
  }
  if (bags.length > 0) {
    L.push("");
    L.push("*Embalagem*");
    L.push(...itemLines(bags.map((b) => ({ ...b, name: plain(b.name).replace(/^Embalagem:\s*/i, "") }))));
  }

  L.push("");
  L.push(`*Total: ${formatBRL(o.total)}* (frete a combinar)`);

  if (gift && o.cardMessage?.trim()) {
    L.push("");
    L.push("*Mensagem do cartão*");
    L.push(`"${plain(o.cardMessage)}"`);
  }

  const delivery = o.deliveryMethod ? DELIVERY_LABEL[o.deliveryMethod] : null;
  const hasInfo = delivery || o.address?.trim() || o.customerPhone;
  if (hasInfo) {
    L.push("");
    if (delivery) L.push(`*Recebimento:* ${delivery}`);
    if (o.address?.trim()) L.push(`*Endereço:* ${plain(o.address)}`);
    if (o.customerPhone) L.push(`*Contato:* ${formatPhone(o.customerPhone)}`);
  }

  if (o.notes?.trim()) {
    L.push("");
    L.push("*Observação*");
    L.push(plain(o.notes));
  }

  L.push("");
  L.push("Aguardo retorno para combinar pagamento e entrega. Obrigada!");
  return L.join("\n");
}
