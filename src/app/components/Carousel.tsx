"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  images: string[];
  links?: string[];
  alt: string;
  autoPlay?: boolean;
  intervalMs?: number;
  rounded?: boolean;
  priority?: boolean;
  sizes?: string;
  aspectRatio?: string;
  showArrows?: boolean;
  fit?: "cover" | "contain";
  showDots?: boolean;
};

const TRANSITION = "transform 0.5s cubic-bezier(0.16,1,0.3,1)";

export default function Carousel({
  images,
  links = [],
  alt,
  autoPlay = false,
  intervalMs = 5000,
  rounded = false,
  priority = false,
  sizes = "100vw",
  aspectRatio,
  showArrows = true,
  fit = "cover",
  showDots = true,
}: Props) {
  const validImages = useMemo(() => images.filter(Boolean), [images]);
  const total = validImages.length;

  // index = 0..total+1 (0 = clone do último, total+1 = clone do primeiro)
  const [index, setIndex] = useState(1);
  // Quando false, aplica transition: none (usado para o "snap" invisível depois do clone)
  const [hasTransition, setHasTransition] = useState(true);
  // Bloqueia novos movimentos enquanto está animando ou fazendo snap
  const lockRef = useRef(false);

  // [clone do último, ...originais, clone do primeiro]
  const slides = useMemo(() => {
    if (total <= 1) return validImages;
    return [validImages[total - 1], ...validImages, validImages[0]];
  }, [validImages, total]);

  const slideLinks = useMemo(() => {
    if (total <= 1) return links;
    const list = Array.from({ length: total }, (_, i) => links[i] || "");
    return [list[total - 1], ...list, list[0]];
  }, [links, total]);

  // Quando termina a animação no clone, faz "teleporte" sem transição pro slide real correspondente
  const handleTransitionEnd = useCallback(
    (e: React.TransitionEvent) => {
      if (e.propertyName !== "transform") return;
      if (total <= 1) {
        lockRef.current = false;
        return;
      }
      if (index === total + 1) {
        // Acabou de chegar no clone do primeiro → teleporta pra real primeiro
        setHasTransition(false);
        setIndex(1);
      } else if (index === 0) {
        // Acabou de chegar no clone do último → teleporta pra real último
        setHasTransition(false);
        setIndex(total);
      } else {
        // Animação normal terminou
        lockRef.current = false;
      }
    },
    [index, total]
  );

  // Depois do teleporte (transition: none aplicado), aguardamos 2 frames pra religar a transição.
  // Dois RAFs garantem que o navegador realmente pintou o frame sem transição antes.
  useEffect(() => {
    if (hasTransition) return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setHasTransition(true);
        lockRef.current = false;
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [hasTransition]);

  const go = useCallback(
    (delta: number) => {
      if (total <= 1) return;
      if (lockRef.current) return;
      lockRef.current = true;
      setHasTransition(true);
      setIndex((c) => c + delta);
    },
    [total]
  );

  const goTo = useCallback(
    (target: number) => {
      if (total <= 1) return;
      if (lockRef.current) return;
      lockRef.current = true;
      setHasTransition(true);
      setIndex(target);
    },
    [total]
  );

  // Autoplay
  useEffect(() => {
    if (!autoPlay || total <= 1) return;
    const id = setInterval(() => {
      if (lockRef.current) return;
      lockRef.current = true;
      setHasTransition(true);
      setIndex((c) => c + 1);
    }, intervalMs);
    return () => clearInterval(id);
  }, [autoPlay, intervalMs, total]);

  // Touch
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };
  const onTouchEnd = () => {
    if (Math.abs(touchDeltaX.current) > 40) {
      if (touchDeltaX.current < 0) go(1);
      else go(-1);
    }
    touchStartX.current = null;
    touchDeltaX.current = 0;
  };

  if (total === 0) return null;

  const activeDotIndex =
    total > 1
      ? index === 0
        ? total - 1
        : index === total + 1
          ? 0
          : index - 1
      : 0;

  return (
    <div
      className={`carousel carousel-fit-${fit} ${rounded ? "is-rounded" : ""}`}
      style={aspectRatio ? { aspectRatio } : undefined}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="carousel-track"
        onTransitionEnd={handleTransitionEnd}
        style={{
          transform: `translateX(-${index * 100}%)`,
          transition: hasTransition ? TRANSITION : "none",
        }}
      >
        {slides.map((src, i) => {
          const href = slideLinks[i];
          const img = (
            <Image
              src={src}
              alt={`${alt} ${i + 1}`}
              fill
              priority={priority && i === 1}
              sizes={sizes}
              className="carousel-image"
              style={{ objectFit: fit }}
              unoptimized={src.startsWith("data:")}
            />
          );
          return (
            <div key={`slide-${i}`} className="carousel-slide">
              {href ? (
                <a href={href} className="carousel-slide-link">
                  {img}
                </a>
              ) : (
                img
              )}
            </div>
          );
        })}
      </div>

      {total > 1 && showArrows && (
        <>
          <button
            type="button"
            className="carousel-arrow carousel-arrow-left"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            aria-label="Imagem anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            className="carousel-arrow carousel-arrow-right"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            aria-label="Próxima imagem"
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}

      {total > 1 && showDots && (
        <div className="carousel-dots" role="tablist" aria-label="Slides">
          {validImages.map((_, i) => (
            <button
              type="button"
              key={i}
              role="tab"
              className={`carousel-dot ${i === activeDotIndex ? "active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                goTo(i + 1);
              }}
              aria-label={`Ir para imagem ${i + 1}`}
              aria-selected={i === activeDotIndex ? "true" : "false"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
