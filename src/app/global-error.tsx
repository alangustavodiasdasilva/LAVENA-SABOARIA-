"use client";

export default function GlobalError({ unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#fbf8f2", color: "#3a332d", fontFamily: "system-ui, sans-serif", textAlign: "center", padding: 24 }}>
        <div>
          <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 500, fontSize: 34, margin: "0 0 12px" }}>Lavena</h1>
          <p style={{ margin: "0 0 20px", color: "#675e54" }}>Estamos com uma instabilidade. Tente novamente em instantes.</p>
          <button onClick={() => unstable_retry()} style={{ padding: "14px 28px", border: 0, borderRadius: 999, background: "#4f6245", color: "#fff", fontSize: 16, cursor: "pointer" }}>
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
