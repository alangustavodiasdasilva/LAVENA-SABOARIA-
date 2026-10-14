"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Sprig } from "@/components/ui/ornaments";

export default function StoreError({ error, unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="container notfound">
      <Sprig className="notfound-sprig" />
      <p className="script notfound-script">Um instante…</p>
      <h1>Algo não saiu como esperado</h1>
      <p className="soft">Não conseguimos carregar esta página agora. Tente novamente em alguns instantes.</p>
      <div className="notfound-actions">
        <button type="button" className="btn btn-primary btn-lg" onClick={() => unstable_retry()}>
          Tentar novamente
        </button>
        <Link href="/" className="btn btn-outline btn-lg">
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
