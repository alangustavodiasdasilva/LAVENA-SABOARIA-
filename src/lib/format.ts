const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatBRL(value: number): string {
  return brl.format(Number.isFinite(value) ? value : 0);
}

/** "35,90" | "35.90" | "R$ 1.234,50" -> número. Retorna NaN se não der para interpretar. */
export function parseMoney(input: string | number | null | undefined): number {
  if (typeof input === "number") return input;
  if (input == null) return NaN;
  let s = String(input).trim().replace(/[^\d.,-]/g, "");
  if (!s) return NaN;
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > -1 && lastDot > -1) {
    // O último separador é o decimal; o outro é milhar.
    if (lastComma > lastDot) s = s.replace(/\./g, "").replace(",", ".");
    else s = s.replace(/,/g, "");
  } else if (lastComma > -1) {
    s = s.replace(",", ".");
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

/** 35.9 -> "35,90" para preencher campos de formulário. */
export function moneyToInput(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "";
  return n.toFixed(2).replace(".", ",");
}

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "item";
}

export function onlyDigits(input: string | null | undefined): string {
  return (input || "").replace(/\D/g, "");
}

/**
 * Normaliza telefone brasileiro para o formato do wa.me (somente dígitos, com DDI 55).
 * Aceita "(11) 99999-9999", "11999999999", "5511999999999". Retorna "" se inválido.
 */
export function normalizeWhatsapp(input: string | null | undefined): string {
  let d = onlyDigits(input);
  if (d.length === 10 || d.length === 11) d = "55" + d;
  if (d.length < 12 || d.length > 13) return "";
  return d;
}

/** 5511999998888 -> "+55 (11) 99999-8888" */
export function formatPhone(input: string | null | undefined): string {
  const d = onlyDigits(input);
  if (!d) return "";
  const local = d.startsWith("55") && d.length >= 12 ? d.slice(2) : d;
  const ddd = local.slice(0, 2);
  const rest = local.slice(2);
  const body = rest.length === 9 ? `${rest.slice(0, 5)}-${rest.slice(5)}` : rest.length === 8 ? `${rest.slice(0, 4)}-${rest.slice(4)}` : rest;
  const prefix = d.startsWith("55") && d.length >= 12 ? "+55 " : "";
  return `${prefix}(${ddd}) ${body}`.trim();
}

export function pluralize(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

const dateTime = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

export function formatDateTime(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "";
  return dateTime.format(d);
}

const dateOnly = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  timeZone: "America/Sao_Paulo",
});

export function formatShortDate(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "";
  return dateOnly.format(d);
}

/** "há 5 min", "há 3 h", "há 2 d" */
export function timeAgo(iso: string | Date, now: Date = new Date()): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const diff = Math.max(0, now.getTime() - d.getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const days = Math.floor(h / 24);
  if (days < 30) return `há ${days} d`;
  return formatShortDate(d);
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
