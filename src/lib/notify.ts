import "server-only";
import { formatBRL } from "./format";
import { SITE_NAME, absoluteUrl } from "./site";
import type { OrderItem } from "./types";

export type NewOrderInfo = {
  code: string;
  customerName: string;
  total: number;
  items: OrderItem[];
};

const TIMEOUT_MS = 4000;

/** Texto curto do aviso (sem emojis nem formatação, serve para e-mail e notificação). */
export function buildNotificationText(o: NewOrderInfo): { title: string; body: string } {
  const lines = o.items
    .filter((i) => i.kind !== "bag")
    .map((i) => `${i.quantity}x ${i.name}${i.reserve ? " (encomenda)" : ""}`);
  return {
    title: `Novo pedido ${o.code} - ${formatBRL(o.total)}`,
    body: [`Cliente: ${o.customerName}`, ...lines, `Total: ${formatBRL(o.total)}`, absoluteUrl("/admin/pedidos")].join("\n"),
  };
}

async function post(url: string, init: RequestInit): Promise<void> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

/**
 * Avisa a loja de um pedido novo. Canais opcionais, todos configurados por variável de ambiente:
 * - `NTFY_TOPIC`: notificação no celular via ntfy.sh (app gratuito, sem cadastro);
 * - `RESEND_API_KEY` + `NOTIFY_EMAIL`: e-mail via Resend (`NOTIFY_FROM` opcional).
 * Nunca lança erro: falha no aviso não pode derrubar o pedido do cliente.
 */
export async function notifyNewOrder(order: NewOrderInfo): Promise<void> {
  const { title, body } = buildNotificationText(order);
  const jobs: Promise<void>[] = [];

  const topic = process.env.NTFY_TOPIC?.trim();
  if (topic) {
    const server = (process.env.NTFY_SERVER?.trim() || "https://ntfy.sh").replace(/\/$/, "");
    jobs.push(
      post(`${server}/${encodeURIComponent(topic)}`, {
        method: "POST",
        // cabeçalhos HTTP só aceitam ASCII; o título já é ASCII
        headers: { Title: title.replace(/[^ -~]/g, " "), Tags: "shopping_bags", Click: absoluteUrl("/admin/pedidos") },
        body,
      })
    );
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to = process.env.NOTIFY_EMAIL?.trim();
  if (apiKey && to) {
    jobs.push(
      post("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: process.env.NOTIFY_FROM?.trim() || `${SITE_NAME} <onboarding@resend.dev>`,
          to: to.split(",").map((s) => s.trim()).filter(Boolean),
          subject: title,
          text: body,
        }),
      })
    );
  }

  const results = await Promise.allSettled(jobs);
  for (const r of results) {
    if (r.status === "rejected") console.error("[notifyNewOrder] falhou:", r.reason);
  }
}
