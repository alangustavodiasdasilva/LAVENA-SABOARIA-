import "server-only";
import { createHash } from "node:crypto";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import prisma from "./prisma";
import { invalidateStoreCache } from "./store-cache";
import { AuthError, UserError, runAction } from "./action";
import { hashPassword, safeEqual, verifyPasswordHash } from "./password";
import { rateLimit, resetRateLimit } from "./rate-limit";
import { createSessionToken, verifySessionToken } from "./session-token";
import type { ActionResult } from "./types";

export const ADMIN_COOKIE = "lavena_admin";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Senha usada enquanto o dono não definir uma nova no painel e não houver ADMIN_PASSWORD.
 * É a senha que o painel já usava; o painel avisa para trocá-la.
 */
export const DEFAULT_ADMIN_PASSWORD = "212472";

function sessionSecret(): string {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  const seed = [
    process.env.DATABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.ADMIN_PASSWORD,
    "lavena-admin-session-v1",
  ]
    .filter(Boolean)
    .join("|");
  return createHash("sha256").update(seed).digest("hex");
}

type AuthState = { passwordHash: string | null; validFrom: number };

const loadAuthState = cache(async (): Promise<AuthState> => {
  const s = await prisma.settings.findUnique({
    where: { id: "default" },
    select: { adminPassword: true, sessionsValidFrom: true },
  });
  return { passwordHash: s?.adminPassword ?? null, validFrom: s?.sessionsValidFrom?.getTime() ?? 0 };
});

async function setSessionCookie(now = Date.now()) {
  const store = await cookies();
  store.set(ADMIN_COOKIE, createSessionToken(sessionSecret(), SESSION_TTL_MS, now), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

export async function isAdmin(): Promise<boolean> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  const payload = verifySessionToken(token, sessionSecret());
  if (!payload) return false;
  const state = await loadAuthState();
  return payload.iat >= state.validFrom;
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) throw new AuthError();
}

/** Executa uma ação de admin: exige sessão válida e devolve erros de forma segura. */
export async function adminAction<T>(context: string, fn: () => Promise<T>): Promise<ActionResult<T>> {
  return runAction(context, async () => {
    await requireAdmin();
    try {
      return await fn();
    } finally {
      invalidateStoreCache(); // o painel mudou algo: a loja precisa ler os dados novos
    }
  });
}

/** True enquanto a senha for a padrão (nunca trocada no painel e sem ADMIN_PASSWORD forte). */
export async function isPasswordWeak(): Promise<boolean> {
  const state = await loadAuthState();
  if (state.passwordHash) return false;
  const env = process.env.ADMIN_PASSWORD;
  return !env || env === DEFAULT_ADMIN_PASSWORD;
}

async function passwordMatches(input: string, state: AuthState): Promise<boolean> {
  if (state.passwordHash) return verifyPasswordHash(input, state.passwordHash);
  return safeEqual(input, process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD);
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "unknown").trim();
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function loginWithPassword(input: string): Promise<ActionResult<void>> {
  return runAction("login", async () => {
    const ip = await clientIp();
    const key = `login:${ip}`;
    const limit = rateLimit(key, 6, 10 * 60 * 1000);
    if (!limit.ok) {
      throw new UserError(`Muitas tentativas. Aguarde ${Math.ceil(limit.retryAfterSec / 60)} min e tente novamente.`);
    }
    const state = await loadAuthState();
    if (!input || input.length > 200 || !(await passwordMatches(input, state))) {
      await sleep(600);
      throw new UserError("Senha incorreta.");
    }
    resetRateLimit(key);
    await setSessionCookie();
  });
}

export async function logoutAdmin(): Promise<void> {
  (await cookies()).delete(ADMIN_COOKIE);
}

export async function changePasswordWithCurrent(current: string, next: string): Promise<void> {
  const key = `chpw:${await clientIp()}`;
  if (!rateLimit(key, 8, 10 * 60 * 1000).ok) throw new UserError("Muitas tentativas. Aguarde alguns minutos.");
  const state = await loadAuthState();
  if (!(await passwordMatches(current, state))) throw new UserError("A senha atual está incorreta.");
  if (next.length < 8) throw new UserError("A nova senha precisa ter pelo menos 8 caracteres.");
  if (next === DEFAULT_ADMIN_PASSWORD) throw new UserError("Escolha uma senha diferente da padrão.");
  const now = Date.now();
  await prisma.settings.upsert({
    where: { id: "default" },
    create: { id: "default", adminPassword: hashPassword(next), sessionsValidFrom: new Date(now) },
    update: { adminPassword: hashPassword(next), sessionsValidFrom: new Date(now) },
  });
  // Encerra as outras sessões e mantém esta.
  await setSessionCookie(now);
}
