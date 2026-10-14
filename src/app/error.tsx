"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="section">
      <div className="container" style={{ textAlign: "center", padding: "64px 16px" }}>
        <p className="section-label">Ops</p>
        <h2 className="banner-title">Estamos com uma instabilidade</h2>
        <p className="banner-text" style={{ maxWidth: 520, margin: "16px auto 28px" }}>
          Não conseguimos carregar os produtos agora. Tente novamente em alguns instantes.
        </p>
        <button type="button" className="btn btn-gold btn-lg" onClick={() => reset()}>
          Tentar novamente
        </button>
      </div>
    </section>
  );
}
