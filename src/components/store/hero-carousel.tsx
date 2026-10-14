"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SmartImage from "@/components/ui/smart-image";
import type { HeroSlide } from "@/lib/types";

function SlideLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  if (!href) return <>{children}</>;
  if (href.startsWith("/")) {
    return (
      <Link href={href} className="hcar-link" aria-label={label}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className="hcar-link" aria-label={label} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

export default function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const n = slides.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touch = useRef<number | null>(null);
  const current = Math.min(index, Math.max(0, n - 1));

  const go = useCallback((delta: number) => setIndex((c) => (c + delta + n) % n), [n]);

  useEffect(() => {
    if (n < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setIndex((c) => (c + 1) % n), 5200);
    return () => window.clearInterval(id);
  }, [n, paused]);

  return (
    <div
      className="hcar"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(e) => {
        touch.current = e.touches[0].clientX;
        setPaused(true);
      }}
      onTouchEnd={(e) => {
        if (touch.current != null) {
          const dx = e.changedTouches[0].clientX - touch.current;
          if (Math.abs(dx) > 40 && n > 1) go(dx < 0 ? 1 : -1);
        }
        touch.current = null;
        setPaused(false);
      }}
      role="region"
      aria-roledescription="carrossel"
      aria-label="Destaques da Lavena"
    >
      {slides.map((s, i) => (
        <div key={`${s.src}-${i}`} className={`hcar-slide ${i === current ? "is-active" : ""}`} aria-hidden={i !== current}>
          <SlideLink href={i === current ? s.href : ""} label="Ver detalhes">
            <SmartImage
              src={s.src}
              alt={i === 0 ? "Lavena — saboaria artesanal" : `Destaque ${i + 1}`}
              fill
              sizes="(max-width: 900px) 92vw, 560px"
              className="hcar-img"
              loading={i === 0 ? "eager" : "lazy"}
              fetchPriority={i === 0 ? "high" : "auto"}
            />
          </SlideLink>
        </div>
      ))}

      {n > 1 && (
        <>
          <button type="button" className="hcar-arrow is-prev" onClick={() => go(-1)} aria-label="Imagem anterior">
            <ChevronLeft size={20} />
          </button>
          <button type="button" className="hcar-arrow is-next" onClick={() => go(1)} aria-label="Próxima imagem">
            <ChevronRight size={20} />
          </button>
          <div className="hcar-dots" role="tablist" aria-label="Escolher imagem">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === current}
                aria-label={`Imagem ${i + 1} de ${n}`}
                className={i === current ? "is-active" : ""}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
