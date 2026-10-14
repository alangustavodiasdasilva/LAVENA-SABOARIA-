"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function AdminError({ error, unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="admin-center">
      <div className="card admin-error-card">
        <span className="admin-error-icon">
          <AlertTriangle size={26} />
        </span>
        <h1>Não foi possível carregar o painel</h1>
        <p className="soft">
          Pode ser uma instabilidade no banco de dados ou na conexão. Confira se a variável <code>DATABASE_URL</code> da hospedagem está correta e tente de novo.
        </p>
        <div className="admin-error-actions">
          <button type="button" className="btn btn-primary" onClick={() => unstable_retry()}>
            Tentar novamente
          </button>
          <Link href="/" className="btn btn-outline">
            Ir para a loja
          </Link>
        </div>
        {error.digest && <p className="hint">Código do erro: {error.digest}</p>}
      </div>
    </div>
  );
}
