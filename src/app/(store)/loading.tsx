/** Mostrado na hora ao trocar de página, enquanto a nova carrega (sensação de velocidade). */
export default function Loading() {
  return (
    <div className="container page-top" aria-busy="true" aria-live="polite">
      <div className="skel skel-title" />
      <div className="skel skel-line" />
      <div className="skel-grid">
        {Array.from({ length: 8 }, (_, i) => (
          <div className="skel skel-card" key={i} />
        ))}
      </div>
      <span className="sr-only">Carregando…</span>
    </div>
  );
}
