import { describe, expect, it } from "vitest";
import {
  formatBRL,
  formatPhone,
  moneyToInput,
  normalizeWhatsapp,
  parseMoney,
  slugify,
  timeAgo,
} from "../format";

describe("parseMoney", () => {
  it("aceita vírgula decimal", () => expect(parseMoney("35,90")).toBe(35.9));
  it("aceita ponto decimal", () => expect(parseMoney("35.90")).toBe(35.9));
  it("entende milhar brasileiro", () => expect(parseMoney("R$ 1.234,50")).toBe(1234.5));
  it("entende milhar americano", () => expect(parseMoney("1,234.50")).toBe(1234.5));
  it("passa número direto", () => expect(parseMoney(12)).toBe(12));
  it("retorna NaN para lixo", () => {
    expect(parseMoney("abc")).toBeNaN();
    expect(parseMoney("")).toBeNaN();
    expect(parseMoney(null)).toBeNaN();
  });
});

describe("moneyToInput", () => {
  it("formata com vírgula", () => expect(moneyToInput(35.9)).toBe("35,90"));
  it("vazio para null", () => expect(moneyToInput(null)).toBe(""));
});

describe("formatBRL", () => {
  it("formata reais", () => expect(formatBRL(1234.5).replace(/\s/g, " ")).toBe("R$ 1.234,50"));
  it("não quebra com NaN", () => expect(formatBRL(NaN).replace(/\s/g, " ")).toBe("R$ 0,00"));
});

describe("slugify", () => {
  it("remove acentos e símbolos", () => expect(slugify("Geleia de Banho — Maracujá!")).toBe("geleia-de-banho-maracuja"));
  it("tem fallback", () => expect(slugify("???")).toBe("item"));
});

describe("normalizeWhatsapp", () => {
  it("adiciona DDI 55", () => expect(normalizeWhatsapp("(11) 99999-8888")).toBe("5511999998888"));
  it("mantém número completo", () => expect(normalizeWhatsapp("5511999998888")).toBe("5511999998888"));
  it("aceita fixo", () => expect(normalizeWhatsapp("1133334444")).toBe("551133334444"));
  it("rejeita curto demais", () => expect(normalizeWhatsapp("12345")).toBe(""));
  it("rejeita vazio", () => expect(normalizeWhatsapp(null)).toBe(""));
});

describe("formatPhone", () => {
  it("formata celular", () => expect(formatPhone("5511999998888")).toBe("+55 (11) 99999-8888"));
  it("formata sem DDI", () => expect(formatPhone("11999998888")).toBe("(11) 99999-8888"));
});

describe("timeAgo", () => {
  const now = new Date("2026-05-10T12:00:00Z");
  it("agora", () => expect(timeAgo("2026-05-10T11:59:40Z", now)).toBe("agora"));
  it("minutos", () => expect(timeAgo("2026-05-10T11:30:00Z", now)).toBe("há 30 min"));
  it("horas", () => expect(timeAgo("2026-05-10T09:00:00Z", now)).toBe("há 3 h"));
  it("dias", () => expect(timeAgo("2026-05-07T12:00:00Z", now)).toBe("há 3 d"));
});
