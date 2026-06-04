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
  const validImages = images.filter(Boolean);
  const total = validImages.length;
  const [currentIndex, setCurrentIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const trackRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);

  // Criamos array com clones nas pontas para efeito infinito real
  const slides = useMemo(() => {
    if (total <= 1) return validImages;
    return [validImages[total - 1], ...validImages, validImages[0]];
  }, [validImages, total]);

  // Alinhamos os links com o clone do carrossel infinito
  const slideLinks = useMemo(() => {
    if (total <= 1) return links;
    const list = Array.from({ length: total }, (_, i) => links[i] || "");
    return [list[total - 1], ...list, list[0]];
  }, [links, total]);

  const handleTransitionEnd = () => {
    if (total <= 1) return;
    if (currentIndex === 0) {
      setIsTransitioning(false);
      setCurrentIndex(total);
    } else if (currentIndex === total + 1) {
      setIsTransitioning(false);
      setCurrentIndex(1);
    }
  };

  useEffect(() => {
    if (!isTransitioning) {
      // Pequeno timeout para reativar transição após resetar posição sem transição
      const id = setTimeout(() => {
        setIsTransitioning(true);
      }, 20);
      return () => clearTimeout(id);
    }
  }, [isTransitioning]);

  // Reseta índice quando a lista de imagens prop muda (ex: abrindo outro modal ou atualizando produtos)
  useEffect(() => {
    setCurrentIndex(1);
    setIsTransitioning(true);
  }, [images]);

  const go = useCallback(
    (next: number) => {
      if (total <= 1) return;
      setCurrentIndex(next);
    },
    [total]
  );

  useEffect(() => {
    if (!autoPlay || total <= 1) return;
    const id = setInterval(() => {
      go(currentIndex + 1);
    }, intervalMs);
    return () => clearInterval(id);
  }, [autoPlay, intervalMs, total, currentIndex, go]);

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
      if (touchDeltaX.current < 0) {
        go(currentIndex + 1);
      } else {
        go(currentIndex - 1);
      }
    }
    touchStartX.current = null;
    touchDeltaX.current = 0;
  };

  const activeDotIndex = total > 1 
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
          transform: `translateX(-${total > 1 ? currentIndex * 100 : 0}%)`,
          transition: isTransitioning ? 'transform 0.5s cubic-bezier(0.16,1,0.3,1)' : 'none',
        }}
      >
        {slides.map((src, i) => {
          const href = slideLinks[i];
          const imgContent = (
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
                <a href={href} className="carousel-slide-link" style={{ display: "block", width: "100%", height: "100%", position: "relative" }}>
                  {imgContent}
                </a>
              ) : (
                imgContent
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
            onClick={(e) => { e.stopPropagation(); go(currentIndex - 1); }}
            aria-label="Imagem anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            className="carousel-arrow carousel-arrow-right"
            onClick={(e) => { e.stopPropagation(); go(currentIndex + 1); }}
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
              className={`carousel-dot ${i === activeDotIndex ? "active" : ""}`}
              onClick={(e) => { e.stopPropagation(); go(i + 1); }}
              aria-label={`Ir para imagem ${i + 1}`}
              aria-current={i === activeDotIndex}
            />
          ))}
        </div>
      )}
    </div>
  );
}
