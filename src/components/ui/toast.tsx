"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Leaf } from "lucide-react";

type Tone = "success" | "error";
type ToastItem = { id: number; message: string; tone: Tone; href?: string; actionLabel?: string };
type Options = { href?: string; actionLabel?: string };

type ToastApi = {
  success: (message: string, opts?: Options) => void;
  error: (message: string) => void;
};

const Ctx = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);

  const push = useCallback((message: string, tone: Tone, opts?: Options) => {
    const id = ++seq.current;
    setItems((cur) => [...cur.slice(-2), { id, message, tone, ...opts }]);
    window.setTimeout(() => setItems((cur) => cur.filter((t) => t.id !== id)), tone === "error" ? 6500 : 4200);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (m, o) => push(m, "success", o),
      error: (m) => push(m, "error"),
    }),
    [push]
  );

  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="toast-region" aria-live="polite" aria-atomic="false">
        {items.map((t) => (
          <div key={t.id} className={`toast ${t.tone === "error" ? "is-error" : ""}`} role={t.tone === "error" ? "alert" : "status"}>
            {t.tone === "error" ? <AlertTriangle size={18} aria-hidden /> : <Leaf size={18} aria-hidden />}
            <span className="toast-msg">{t.message}</span>
            {t.href && (
              <Link href={t.href} className="toast-action">
                {t.actionLabel || "Ver"}
              </Link>
            )}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast precisa estar dentro de <ToastProvider>.");
  return ctx;
}
