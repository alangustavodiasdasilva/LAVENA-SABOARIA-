"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo, useLayoutEffect } from "react";
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

  // currentIndex 1-based no array com clones (index 0 = clone do último, total+1 = clone do primeiro)
  const [currentIndex, setCurrentIndex] = useState(1);
  const trackRef = useRef<HTMLDivElement>(null);
  // Quando true, próxima atualização de posição não tem animação (usado pra "snap" invisível dos clones)
  const isJumpingRef = useRef(false);
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);
  const isAnimatingRef = useRef(false);

  // Clones nas pontas: [último, ...originais, primeiro]
  const slides = useMemo(() => {
    if (total <= 1) return validImages;
    return [validImages[total - 1], ...validImages, validImages[0]];
  }, [validImages, total]);

  const slideLinks = useMemo(() => {
    if (total <= 1) return links;
    const list = Array.from({ length: total }, (_, i) => links[i] || "");
    return [list[total - 1], ...list, list[0]];
  }, [links, total]);

  // Aplica o transform manualmente via DOM, garantindo snap sem flash
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    if (isJumpingRef.current) {
      // SNAP invisível: desliga transição, força reflow, religa
      track.style.transition = "none";
      track.style.transform = `translateX(-${currentIndex * 100}%)`;
      // Força o navegador a aplicar o estilo agora (reflow)
      void track.offsetWidth;
      track.style.transition = TRANSITION;
      isJumpingRef.current = false;
      isAnimatingRef.current = false;
    } else {
      track.style.transition = TRANSITION;
      track.style.transform = `translateX(-${currentIndex * 100}%)`;
      isAnimatingRef.current = true;
    }
  }, [currentIndex]);

  // Reset quando a lista de imagens prop muda (mas só se realmente mudou)
  const imagesSig = useMemo(() => validImages.join("|"), [validImages]);
  useEffect(() => {
    isJumpingRef.current = true;
    setCurrentIndex(1);
  }, [imagesSig]);

  const handleTransitionEnd = (e: React.TransitionEvent) => {
    if (e.propertyName !== "transform") return;
    if (total <= 1) return;
    isAnimatingRef.current = false;
    if (currentIndex === 0) {
      isJumpingRef.current = true;
      setCurrentIndex(total);
    } else if (currentIndex === total + 1) {
      isJumpingRef.current = true;
      setCurrentIndex(1);
    }
  };

  const go = useCallback(
    (next: number) => {
      if (total <= 1) return;
      // Evita disparar novo movimento se ainda está animando o atual
      if (isAnimatingRef.current) return;
      setCurrentIndex(next);
    },
    [total]
  );

  useEffect(() => {
    if (!autoPlay || total <= 1) return;
    const id = setInterval(() => {
      if (!isAnimatingRef.current) {
        setCurrentIndex((c) => c + 1);
      }
    }, intervalMs);
    return () => clearInterval(id);
  }, [autoPlay, intervalMs, total]);

  if (total === 0) return null;

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
      if (touchDeltaX.current < 0) go(currentIndex + 1);
      else go(currentIndex - 1);
    }
    touchStartX.current = null;
    touchDeltaX.current = 0;
  };

  const activeDotIndex =
    total > 1
      ? currentIndex === 0
        ? total - 1
        : currentIndex === total + 1
          ? 0
          : currentIndex - 1
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
        ref={trackRef}
        className="carousel-track"
        onTransitionEnd={handleTransitionEnd}
        style={{
          // Posição inicial — useLayoutEffect substitui na hora certa
          transform: `translateX(-${(total > 1 ? currentIndex : 0) * 100}%)`,
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
            <div key={`${src}-${i}`} className="carousel-slide">
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
              go(currentIndex - 1);
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
              go(currentIndex + 1);
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
                go(i + 1);
              }}
              aria-label={`Ir para imagem ${i + 1}`}
              aria-selected={i === activeDotIndex}
            />
          ))}
        </div>
      )}
    </div>
  );
}
