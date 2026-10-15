import type { ThemeId } from "@/lib/themes";

/** Partículas leves (só CSS) por tema. Posições fixas por índice: sem aleatório, sem erro de hidratação. */
const FX: Partial<Record<ThemeId, { kind: string; glyph: string; count: number }>> = {
  natal: { kind: "snow", glyph: "", count: 22 },
  "ano-novo": { kind: "sparkle", glyph: "", count: 18 },
  namorados: { kind: "heart", glyph: "♥", count: 14 },
  "dia-das-maes": { kind: "heart", glyph: "❀", count: 14 },
  pascoa: { kind: "bubble", glyph: "", count: 12 },
};

export default function ThemeFX({ theme }: { theme: ThemeId }) {
  const fx = FX[theme];
  if (!fx) return null;
  return (
    <div className={`fx fx-${fx.kind}`} aria-hidden>
      {Array.from({ length: fx.count }, (_, i) => (
        <span
          key={i}
          style={
            {
              "--x": `${(i * 37 + 11) % 100}%`,
              "--d": `${9 + ((i * 7) % 9)}s`,
              "--delay": `${-((i * 13) % 14)}s`,
              "--s": `${0.55 + ((i * 17) % 10) / 14}`,
              "--drift": `${((i * 29) % 60) - 30}px`,
            } as React.CSSProperties
          }
        >
          {fx.glyph}
        </span>
      ))}
    </div>
  );
}
