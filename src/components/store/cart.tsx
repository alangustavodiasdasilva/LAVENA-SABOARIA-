"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ui/toast";
import type { CartQuoteLine } from "@/lib/orders";
import type { CartLine } from "@/lib/types";

const STORAGE_KEY = "lavena_cart_v2";
const MAX_QTY = 99;

type NewLine = Omit<CartLine, "quantity" | "key">;

type CartApi = {
  lines: CartLine[];
  hydrated: boolean;
  count: number;
  subtotal: number;
  quotes: Record<string, CartQuoteLine>;
  add: (line: NewLine, qty?: number) => void;
  setQuantity: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  applyQuote: (quote: CartQuoteLine[]) => void;
};

const Ctx = createContext<CartApi | null>(null);

export function lineKey(l: { kind: "product" | "kit"; productId?: string; variantId?: string; kitId?: string }): string {
  return l.kind === "kit" ? `kit:${l.kitId}` : `product:${l.productId}:${l.variantId || ""}`;
}

function isLine(x: unknown): x is CartLine {
  if (!x || typeof x !== "object") return false;
  const l = x as Record<string, unknown>;
  return (
    typeof l.key === "string" &&
    (l.kind === "product" || l.kind === "kit") &&
    typeof l.name === "string" &&
    typeof l.price === "number" &&
    typeof l.quantity === "number" &&
    l.quantity >= 1 &&
    (l.kind === "kit" ? typeof l.kitId === "string" : typeof l.productId === "string")
  );
}

function read(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isLine).map((l) => ({ ...l, quantity: Math.min(MAX_QTY, l.quantity) })) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [quotes, setQuotes] = useState<Record<string, CartQuoteLine>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLines(read());
    setHydrated(true);
    const onStorage = (e: StorageEvent) => e.key === STORAGE_KEY && setLines(read());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* armazenamento cheio ou bloqueado: o carrinho segue valendo nesta aba */
    }
  }, [lines, hydrated]);

  const add = useCallback(
    (line: NewLine, qty = 1) => {
      const key = lineKey(line);
      setLines((cur) => {
        const found = cur.find((l) => l.key === key);
        if (found) return cur.map((l) => (l.key === key ? { ...l, ...line, quantity: Math.min(MAX_QTY, l.quantity + qty) } : l));
        return [...cur, { ...line, key, quantity: Math.min(MAX_QTY, qty) }];
      });
      toast.success(`${line.name} foi para a sacola`, { href: "/carrinho", actionLabel: "Ver sacola" });
    },
    [toast]
  );

  const setQuantity = useCallback((key: string, qty: number) => {
    setLines((cur) =>
      qty < 1 ? cur.filter((l) => l.key !== key) : cur.map((l) => (l.key === key ? { ...l, quantity: Math.min(MAX_QTY, qty) } : l))
    );
  }, []);

  const remove = useCallback((key: string) => setLines((cur) => cur.filter((l) => l.key !== key)), []);
  const clear = useCallback(() => {
    setLines([]);
    setQuotes({});
  }, []);

  const applyQuote = useCallback((quote: CartQuoteLine[]) => {
    const map: Record<string, CartQuoteLine> = {};
    quote.forEach((q) => (map[q.key] = q));
    setQuotes(map);
    setLines((cur) =>
      cur.map((l) => {
        const q = map[l.key];
        if (!q || !q.ok) return l;
        return { ...l, name: q.name, price: q.unitPrice, imageUrl: q.imageUrl || l.imageUrl, reserve: q.reserve };
      })
    );
  }, []);

  const value = useMemo<CartApi>(
    () => ({
      lines,
      hydrated,
      count: lines.reduce((s, l) => s + l.quantity, 0),
      subtotal: lines.reduce((s, l) => s + l.price * l.quantity, 0),
      quotes,
      add,
      setQuantity,
      remove,
      clear,
      applyQuote,
    }),
    [lines, hydrated, quotes, add, setQuantity, remove, clear, applyQuote]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): CartApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart precisa estar dentro de <CartProvider>.");
  return ctx;
}
