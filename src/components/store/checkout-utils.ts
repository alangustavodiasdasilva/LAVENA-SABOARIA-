"use client";

const LAST_ORDER_KEY = "lavena_last_order";
const CUSTOMER_KEY = "lavena_customer";
const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;

export type LastOrder = { code: string | null; total: number; whatsappUrl: string | null; at: number };

export function saveLastOrder(o: Omit<LastOrder, "at">) {
  try {
    window.localStorage.setItem(LAST_ORDER_KEY, JSON.stringify({ ...o, at: Date.now() }));
  } catch {
    /* sem armazenamento: só não lembramos o último pedido */
  }
}

export function loadLastOrder(): LastOrder | null {
  try {
    const raw = window.localStorage.getItem(LAST_ORDER_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as LastOrder;
    if (!o || typeof o.at !== "number" || Date.now() - o.at > FORTY_EIGHT_HOURS) return null;
    return o;
  } catch {
    return null;
  }
}

export function clearLastOrder() {
  try {
    window.localStorage.removeItem(LAST_ORDER_KEY);
  } catch {
    /* ignore */
  }
}

export type SavedCustomer = { name: string; phone: string };

export function loadCustomer(): SavedCustomer {
  try {
    const raw = window.localStorage.getItem(CUSTOMER_KEY);
    if (!raw) return { name: "", phone: "" };
    const c = JSON.parse(raw) as Partial<SavedCustomer>;
    return { name: typeof c.name === "string" ? c.name : "", phone: typeof c.phone === "string" ? c.phone : "" };
  } catch {
    return { name: "", phone: "" };
  }
}

export function saveCustomer(c: SavedCustomer) {
  try {
    window.localStorage.setItem(CUSTOMER_KEY, JSON.stringify(c));
  } catch {
    /* ignore */
  }
}

/** Máscara simples de telefone brasileiro: (11) 99999-8888 */
export function maskPhone(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
