"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  images: string[];
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
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);

  const go = useCallback(
    (next: number) => {
      if (total === 0) return;
      setIndex(((next % total) + total) % total);
    },
    [total]
  );

  useEffect(() => {
    if (!autoPlay || total <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % total);
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
    if (Math.abs(touchDeltaX.current) > 50) {
      if (touchDeltaX.current < 0) go(index + 1);
      else go(index - 1);
    }
    touchStartX.current = null;
    touchDeltaX.current = 0;
  };

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
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {validImages.map((src, i) => (
          <div key={`${src}-${i}`} className="carousel-slide">
            <Image
              src={src}
              alt={`${alt} ${i + 1}/${total}`}
              fill
              priority={priority && i === 0}
              sizes={sizes}
              className="carousel-image"
              style={{ objectFit: fit }}
            />
          </div>
        ))}
      </div>

      {total > 1 && showArrows && (
        <>
          <button
            type="button"
            className="carousel-arrow carousel-arrow-left"
            onClick={(e) => { e.stopPropagation(); go(index - 1); }}
            aria-label="Imagem anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            className="carousel-arrow carousel-arrow-right"
            onClick={(e) => { e.stopPropagation(); go(index + 1); }}
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
              className={`carousel-dot ${i === index ? "active" : ""}`}
              onClick={(e) => { e.stopPropagation(); go(i); }}
              aria-label={`Ir para imagem ${i + 1}`}
              aria-current={i === index}
            />
          ))}
        </div>
      )}
    </div>
  );
}
