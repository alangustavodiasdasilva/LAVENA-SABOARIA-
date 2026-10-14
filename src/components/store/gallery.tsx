"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SmartImage from "@/components/ui/smart-image";

export default function Gallery({ images, alt, badges }: { images: string[]; alt: string; badges?: React.ReactNode }) {
  const [index, setIndex] = useState(0);
  const touch = useRef<number | null>(null);
  const key = images.join("|");

  // ao trocar o conjunto de imagens (ex.: outra variação), volta para a primeira
  useEffect(() => setIndex(0), [key]);

  const n = images.length;
  const go = (d: number) => setIndex((i) => (i + d + n) % n);

  return (
    <div className="gallery">
      <div
        className="gallery-main img-wrap"
        onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touch.current != null && n > 1) {
            const dx = e.changedTouches[0].clientX - touch.current;
            if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
          }
          touch.current = null;
        }}
      >
        {images.map((src, i) => (
          <div key={src} className={`gallery-slide ${i === index ? "is-active" : ""}`} aria-hidden={i !== index}>
            <SmartImage src={src} alt={i === 0 ? alt : `${alt} — foto ${i + 1}`} fill sizes="(max-width: 900px) 100vw, 560px" className="gallery-img" loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "auto"} />
          </div>
        ))}
        {n === 0 && <SmartImage src={null} alt={alt} fill />}
        {badges && <div className="gallery-badges">{badges}</div>}
        {n > 1 && (
          <>
            <button type="button" className="gallery-arrow is-prev" onClick={() => go(-1)} aria-label="Foto anterior">
              <ChevronLeft size={20} />
            </button>
            <button type="button" className="gallery-arrow is-next" onClick={() => go(1)} aria-label="Próxima foto">
              <ChevronRight size={20} />
            </button>
            <span className="gallery-counter" aria-hidden>
              {index + 1} / {n}
            </span>
          </>
        )}
      </div>
      {n > 1 && (
        <div className="gallery-thumbs" role="tablist" aria-label="Fotos do produto">
          {images.map((src, i) => (
            <button key={src} type="button" role="tab" aria-selected={i === index} aria-label={`Ver foto ${i + 1}`} className={`gallery-thumb img-wrap ${i === index ? "is-active" : ""}`} onClick={() => setIndex(i)}>
              <SmartImage src={src} alt="" fill sizes="88px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
