"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Entrada suave dos blocos (.reveal) ao rolar. Navegadores com `animation-timeline: view()` já
 * fazem isso só com CSS; nos demais (ex.: iPhone mais antigo) este observador adiciona .in-view.
 */
export default function Reveal() {
  const pathname = usePathname();
  useEffect(() => {
    const root = document.documentElement;
    if (typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    root.classList.add("has-reveal");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in-view");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    document.querySelectorAll(".reveal:not(.in-view)").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);
  return null;
}
