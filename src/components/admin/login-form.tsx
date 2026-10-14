"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Lock } from "lucide-react";
import { login } from "@/actions/auth";
import Wordmark from "@/components/store/wordmark";

export default function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const res = await login(password);
      if (res.ok) {
        router.replace("/admin");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <div className="card login-card">
      <div className="login-brand">
        <Wordmark />
      </div>
      <span className="login-icon">
        <Lock size={22} />
      </span>
      <h1>Área da loja</h1>
      <p className="soft">Entre com a sua senha para gerenciar produtos, pedidos e a loja.</p>
      <form onSubmit={submit} className="login-form" noValidate>
        <div className="field">
          <label htmlFor="admin-password">Senha</label>
          <div className="password-wrap">
            <input
              id="admin-password"
              className="input"
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              autoFocus
              aria-invalid={!!error}
              aria-describedby={error ? "login-error" : undefined}
              disabled={pending}
            />
            <button type="button" className="password-toggle" onClick={() => setShow((s) => !s)} aria-label={show ? "Esconder senha" : "Mostrar senha"}>
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {error && (
            <span id="login-error" className="error-text" role="alert">
              {error}
            </span>
          )}
        </div>
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={pending || !password}>
          {pending ? <span className="spinner" aria-hidden /> : null} {pending ? "Entrando…" : "Entrar"}
        </button>
      </form>
      <Link href="/" className="login-back">
        <ArrowLeft size={15} /> Voltar para a loja
      </Link>
    </div>
  );
}
