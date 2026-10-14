"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import type { ActionResult } from "@/lib/types";

type RunOptions<T> = {
  /** mensagem de sucesso (toast) */
  success?: string;
  /** recarrega os dados da página depois de salvar (padrão: sim) */
  refresh?: boolean;
  onDone?: (data: T) => void;
  /** recebe a mensagem de erro (além do aviso na tela) */
  onError?: (message: string) => void;
};

/** Executa uma server action com estado de carregamento, aviso de sucesso/erro e atualização da tela. */
export function useRun() {
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const run = useCallback(
    async <T,>(fn: () => Promise<ActionResult<T> | ActionResult<unknown>>, opts: RunOptions<T> = {}, key?: string): Promise<boolean> => {
      setBusyKey(key ?? "__");
      try {
        const res = await fn();
        if (!res.ok) {
          toast.error(res.error);
          opts.onError?.(res.error);
          return false;
        }
        if (opts.success) toast.success(opts.success);
        opts.onDone?.(res.data as T);
        if (opts.refresh !== false) start(() => router.refresh());
        return true;
      } catch {
        toast.error("Não foi possível concluir agora. Verifique a internet e tente de novo.");
        return false;
      } finally {
        setBusyKey(null);
      }
    },
    [toast, router]
  );

  return { run, pending, busy: busyKey !== null || pending, busyKey };
}
