/**
 * Versões sazonais do site. O dono escolhe uma no painel (Configurações) ou deixa em
 * "Automático", que troca sozinho conforme a data. Cada tema muda as cores (themes.css)
 * e o aviso do topo quando o dono não escreveu um próprio.
 */
export const THEME_IDS = [
  "auto",
  "padrao",
  "natal",
  "ano-novo",
  "pascoa",
  "dia-das-maes",
  "namorados",
  "dia-dos-pais",
  "black-friday",
] as const;
export type ThemeChoice = (typeof THEME_IDS)[number];
export type ThemeId = Exclude<ThemeChoice, "auto">;

export const THEMES: Record<ThemeChoice, { label: string; emoji: string; swatch: [string, string]; announcement: string | null; hint: string }> = {
  auto: { label: "Automático", emoji: "📅", swatch: ["#7a9169", "#e0c985"], announcement: null, hint: "Troca sozinho conforme as datas comemorativas." },
  padrao: { label: "Padrão Lavena", emoji: "🌿", swatch: ["#4f6245", "#cfaf62"], announcement: null, hint: "O visual de sempre." },
  natal: { label: "Natal", emoji: "🎄", swatch: ["#8c2a3a", "#e0c985"], announcement: "🎄 Natal Lavena · Presentes feitos à mão para quem você ama · Frete a combinar", hint: "1 a 25 de dezembro." },
  "ano-novo": { label: "Ano Novo", emoji: "🥂", swatch: ["#2f3f6b", "#e0c985"], announcement: "🥂 Feliz Ano Novo! Comece o ano cuidando de você · Frete a combinar", hint: "26 de dezembro a 6 de janeiro." },
  pascoa: { label: "Páscoa", emoji: "🐣", swatch: ["#7a6aa8", "#f0c27a"], announcement: "🐣 Páscoa Lavena · Lembrancinhas artesanais · Frete a combinar", hint: "Duas semanas antes da Páscoa." },
  "dia-das-maes": { label: "Dia das Mães", emoji: "💐", swatch: ["#b4566f", "#e0c985"], announcement: "💐 Dia das Mães · Presenteie com carinho e aroma · Frete a combinar", hint: "10 dias antes do Dia das Mães." },
  namorados: { label: "Dia dos Namorados", emoji: "💝", swatch: ["#a8344a", "#e6c3b9"], announcement: "💝 Dia dos Namorados · Um presente cheio de carinho · Frete a combinar", hint: "1 a 12 de junho." },
  "dia-dos-pais": { label: "Dia dos Pais", emoji: "🧔", swatch: ["#2f5460", "#cfaf62"], announcement: "🧔 Dia dos Pais · Cuidado e bem-estar para ele · Frete a combinar", hint: "10 dias antes do Dia dos Pais." },
  "black-friday": { label: "Black Friday", emoji: "🖤", swatch: ["#26231f", "#e0b94f"], announcement: "🖤 Black Friday Lavena · Ofertas por tempo limitado · Frete a combinar", hint: "20 a 30 de novembro." },
};

export function isThemeChoice(v: unknown): v is ThemeChoice {
  return typeof v === "string" && (THEME_IDS as readonly string[]).includes(v);
}

/** Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher). */
export function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/** N-ésimo domingo do mês (month: 0-11). */
function nthSunday(year: number, month: number, n: number): Date {
  const first = new Date(year, month, 1);
  const offset = (7 - first.getDay()) % 7;
  return new Date(year, month, 1 + offset + (n - 1) * 7);
}

const DAY = 24 * 60 * 60 * 1000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** Tema que vale numa data quando o modo é "Automático". */
export function themeForDate(date: Date): ThemeId {
  const t = startOfDay(date);
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();

  if ((m === 11 && d >= 26) || (m === 0 && d <= 6)) return "ano-novo";
  if (m === 11 && d <= 25) return "natal";
  if (m === 10 && d >= 20) return "black-friday";
  if (m === 5 && d <= 12) return "namorados";

  const easter = startOfDay(easterSunday(y));
  if (t >= easter - 14 * DAY && t <= easter) return "pascoa";
  const mothers = startOfDay(nthSunday(y, 4, 2));
  if (t >= mothers - 10 * DAY && t <= mothers) return "dia-das-maes";
  const fathers = startOfDay(nthSunday(y, 7, 2));
  if (t >= fathers - 10 * DAY && t <= fathers) return "dia-dos-pais";
  return "padrao";
}

export function resolveTheme(choice: string | null | undefined, date: Date = new Date()): ThemeId {
  if (!choice || !isThemeChoice(choice) || choice === "auto") return choice === "auto" ? themeForDate(date) : "padrao";
  return choice;
}
