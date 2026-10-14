import { createHmac, timingSafeEqual } from "node:crypto";

export type SessionPayload = { sub: "admin"; iat: number; exp: number };

const b64u = (buf: Buffer | string) => Buffer.from(buf).toString("base64url");

function sign(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data).digest("base64url");
}

export function createSessionToken(secret: string, ttlMs: number, now = Date.now()): string {
  const payload: SessionPayload = { sub: "admin", iat: now, exp: now + ttlMs };
  const body = b64u(JSON.stringify(payload));
  return `${body}.${sign(body, secret)}`;
}

/** Retorna o payload se a assinatura e a validade estiverem corretas; senão null. */
export function verifySessionToken(token: string | undefined | null, secret: string, now = Date.now()): SessionPayload | null {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot < 1 || dot === token.length - 1) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = sign(body, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (payload.sub !== "admin" || typeof payload.iat !== "number" || typeof payload.exp !== "number") return null;
    if (payload.exp <= now) return null;
    return payload;
  } catch {
    return null;
  }
}
