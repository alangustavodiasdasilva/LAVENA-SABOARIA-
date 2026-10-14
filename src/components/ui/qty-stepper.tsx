"use client";

import { Minus, Plus } from "lucide-react";

export default function QtyStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  label = "Quantidade",
  size = "md",
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number | null;
  label?: string;
  size?: "sm" | "md";
}) {
  const hi = max ?? 99;
  return (
    <div className={`qty ${size === "sm" ? "is-sm" : ""}`} role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="Diminuir quantidade">
        <Minus size={size === "sm" ? 14 : 16} />
      </button>
      <output aria-live="polite">{value}</output>
      <button type="button" onClick={() => onChange(Math.min(hi, value + 1))} disabled={value >= hi} aria-label="Aumentar quantidade">
        <Plus size={size === "sm" ? 14 : 16} />
      </button>
    </div>
  );
}
