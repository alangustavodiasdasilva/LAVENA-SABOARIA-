import { beforeEach, describe, expect, it } from "vitest";
import { hashPassword, safeEqual, verifyPasswordHash } from "../password";
import { createSessionToken, verifySessionToken } from "../session-token";
import { clearRateLimits, rateLimit, resetRateLimit } from "../rate-limit";

describe("senha", () => {
  it("gera hash verificável e diferente a cada vez", () => {
    const a = hashPassword("segredo123");
    const b = hashPassword("segredo123");
    expect(a).not.toBe(b);
    expect(verifyPasswordHash("segredo123", a)).toBe(true);
    expect(verifyPasswordHash("errada", a)).toBe(false);
  });
  it("rejeita hash malformado ou vazio", () => {
    expect(verifyPasswordHash("x", null)).toBe(false);
    expect(verifyPasswordHash("x", "texto-puro")).toBe(false);
    expect(verifyPasswordHash("x", "scrypt$1$2")).toBe(false);
  });
  it("safeEqual compara em tempo constante", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("abc", "abcd")).toBe(false);
  });
});

describe("token de sessão", () => {
  const secret = "segredo-de-teste";
  it("aceita token válido", () => {
    const t = createSessionToken(secret, 60_000, 1_000);
    expect(verifySessionToken(t, secret, 2_000)).toMatchObject({ sub: "admin", iat: 1_000, exp: 61_000 });
  });
  it("rejeita token expirado", () => {
    const t = createSessionToken(secret, 60_000, 1_000);
    expect(verifySessionToken(t, secret, 61_000)).toBeNull();
  });
  it("rejeita segredo diferente", () => {
    const t = createSessionToken(secret, 60_000, 1_000);
    expect(verifySessionToken(t, "outro", 2_000)).toBeNull();
  });
  it("rejeita payload adulterado (cookie forjado)", () => {
    const t = createSessionToken(secret, 60_000, 1_000);
    const [body, sig] = t.split(".");
    const forged = Buffer.from(JSON.stringify({ sub: "admin", iat: 1_000, exp: 9_999_999_999_999 })).toString("base64url");
    expect(verifySessionToken(`${forged}.${sig}`, secret, 2_000)).toBeNull();
    expect(verifySessionToken(`${body}.`, secret, 2_000)).toBeNull();
  });
  it("rejeita o valor antigo do cookie ('authenticated') e lixo", () => {
    expect(verifySessionToken("authenticated", secret)).toBeNull();
    expect(verifySessionToken("", secret)).toBeNull();
    expect(verifySessionToken(undefined, secret)).toBeNull();
    expect(verifySessionToken("a.b", secret)).toBeNull();
  });
});

describe("rate limit", () => {
  beforeEach(() => clearRateLimits());
  it("bloqueia após o limite e libera depois da janela", () => {
    for (let i = 0; i < 3; i++) expect(rateLimit("ip", 3, 1000, 0).ok).toBe(true);
    const blocked = rateLimit("ip", 3, 1000, 10);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBe(1);
    expect(rateLimit("ip", 3, 1000, 1001).ok).toBe(true);
  });
  it("chaves independentes e reset manual", () => {
    for (let i = 0; i < 3; i++) rateLimit("a", 3, 1000, 0);
    expect(rateLimit("a", 3, 1000, 1).ok).toBe(false);
    expect(rateLimit("b", 3, 1000, 1).ok).toBe(true);
    resetRateLimit("a");
    expect(rateLimit("a", 3, 1000, 2).ok).toBe(true);
  });
});
