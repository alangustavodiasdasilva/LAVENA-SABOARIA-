"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";

export type AspectKey = "sq" | "port" | "land" | "arch";

const ASPECTS: { key: AspectKey; label: string; hint: string; ratio: number }[] = [
  { key: "sq", label: "Quadrado", hint: "Página do produto e carrossel", ratio: 1 },
  { key: "port", label: "Retrato", hint: "Cartões de produto", ratio: 4 / 5 },
  { key: "land", label: "Paisagem", hint: "Kits e destaques", ratio: 5 / 4 },
  { key: "arch", label: "Arco", hint: "Seção de presentes", ratio: 4 / 4.6 },
];

const VIEW_W = 320;

type Props = {
  /** Endereço da imagem (URL, data URL ou blob de um arquivo escolhido). */
  src: string;
  initialAspect?: AspectKey;
  /** Recebe a imagem já recortada. */
  onApply: (file: File) => void | Promise<void>;
  /** Usa a imagem do jeito que está (só aparece ao enviar um arquivo novo). */
  onSkip?: () => void;
  onClose: () => void;
};

/**
 * Ajuste de foto com prévia: arraste para posicionar, use o controle para aproximar
 * e escolha o formato. O que aparece na moldura é exatamente o que será salvo.
 */
export default function ImageAdjuster({ src, initialAspect = "sq", onApply, onSkip, onClose }: Props) {
  const [aspectKey, setAspectKey] = useState<AspectKey>(initialAspect);
  const [zoom, setZoom] = useState(1);
  const [off, setOff] = useState({ x: 0, y: 0 });
  const [dim, setDim] = useState<{ w: number; h: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const aspect = ASPECTS.find((a) => a.key === aspectKey)!;
  const W = VIEW_W;
  const H = Math.round(VIEW_W / aspect.ratio);

  // carrega a imagem (com CORS para poder recortar no navegador)
  useEffect(() => {
    const img = new Image();
    if (/^https?:/i.test(src)) img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      setDim({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.onerror = () => setError("Não foi possível abrir esta imagem para ajustar. Envie a foto novamente.");
    img.src = src;
  }, [src]);

  const geo = useCallback(
    (z: number, ox: number, oy: number) => {
      if (!dim) return null;
      const base = Math.max(W / dim.w, H / dim.h);
      const s = base * z;
      const dw = dim.w * s;
      const dh = dim.h * s;
      const maxX = Math.max(0, (dw - W) / 2);
      const maxY = Math.max(0, (dh - H) / 2);
      const x = Math.min(maxX, Math.max(-maxX, ox));
      const y = Math.min(maxY, Math.max(-maxY, oy));
      return { s, dw, dh, x, y, left: W / 2 + x - dw / 2, top: H / 2 + y - dh / 2 };
    },
    [dim, W, H]
  );

  // ao trocar o formato/zoom, mantém a imagem cobrindo a moldura
  useEffect(() => {
    const g = geo(zoom, off.x, off.y);
    if (g && (g.x !== off.x || g.y !== off.y)) setOff({ x: g.x, y: g.y });
  }, [geo, zoom, off.x, off.y]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const g = geo(zoom, off.x, off.y);

  const down = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ox: off.x, oy: off.y };
  };
  const move = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setOff({ x: drag.current.ox + (e.clientX - drag.current.x), y: drag.current.oy + (e.clientY - drag.current.y) });
  };
  const up = () => {
    drag.current = null;
  };

  const apply = async () => {
    const img = imgRef.current;
    if (!img || !g) return;
    setBusy(true);
    setError(null);
    try {
      const outW = 1400;
      const f = outW / W;
      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = Math.round(H * f);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, g.left * f, g.top * f, g.dw * f, g.dh * f);
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.88));
      if (!blob) throw new Error("blob");
      await onApply(new File([blob], `foto-${Date.now()}.webp`, { type: "image/webp" }));
    } catch {
      setError("Não foi possível recortar esta imagem (ela pode estar protegida). Envie a foto novamente e ajuste em seguida.");
      setBusy(false);
    }
  };

  const isArch = aspect.key === "arch";

  return (
    <div className="dialog-backdrop adj-backdrop" onClick={onClose}>
      <div className="dialog adj" role="dialog" aria-modal="true" aria-label="Ajustar foto" onClick={(e) => e.stopPropagation()}>
        <div className="adj-head">
          <h3>Ajustar foto</h3>
          <button type="button" className="adj-x" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        <p className="soft small">Arraste a foto para posicionar. O que aparece na moldura é o que vai para o site.</p>

        <div className="adj-formats" role="radiogroup" aria-label="Formato">
          {ASPECTS.map((a) => (
            <button key={a.key} type="button" role="radio" aria-checked={a.key === aspectKey} className={`chip ${a.key === aspectKey ? "is-on" : ""}`} onClick={() => setAspectKey(a.key)} title={a.hint}>
              {a.label}
            </button>
          ))}
        </div>
        <span className="hint">{aspect.hint}</span>

        <div className="adj-stage">
          <div
            className={`adj-frame ${isArch ? "is-arch" : ""}`}
            style={{ width: W, height: H }}
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
            onWheel={(e) => setZoom((z) => Math.min(4, Math.max(1, z - e.deltaY * 0.002)))}
          >
            {g && dim ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt="" draggable={false} style={{ position: "absolute", left: g.left, top: g.top, width: g.dw, height: g.dh, maxWidth: "none" }} />
            ) : error ? null : (
              <Loader2 className="spin" size={26} />
            )}
          </div>
        </div>

        <div className="adj-zoom">
          <ZoomOut size={16} aria-hidden />
          <input type="range" min={1} max={4} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} aria-label="Aproximar" />
          <ZoomIn size={16} aria-hidden />
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setZoom(1);
              setOff({ x: 0, y: 0 });
            }}
          >
            <RotateCcw size={14} /> Centralizar
          </button>
        </div>

        {error && <p className="error-text" role="alert">{error}</p>}

        <div className="dialog-actions">
          {onSkip && (
            <button type="button" className="btn btn-ghost" onClick={onSkip} disabled={busy}>
              Usar sem ajustar
            </button>
          )}
          <button type="button" className="btn" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button type="button" className="btn btn-primary" onClick={apply} disabled={busy || !dim}>
            {busy ? <Loader2 className="spin" size={16} /> : null} Usar esta foto
          </button>
        </div>
      </div>
    </div>
  );
}
