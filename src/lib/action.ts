import type { z } from "zod";
import type { ActionResult } from "./types";

/** Erro "esperado" (validação, regra de negócio): a mensagem é mostrada ao usuário. */
export class UserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserError";
  }
}

export class AuthError extends Error {
  constructor(message = "Sessão expirada. Entre novamente.") {
    super(message);
    this.name = "AuthError";
  }
}

export function ok(): ActionResult<void>;
export function ok<T>(data: T): ActionResult<T>;
export function ok<T>(data?: T): ActionResult<T | undefined> {
  return { ok: true, data };
}

export function fail(error: string, transient = false): { ok: false; error: string; transient?: boolean } {
  return transient ? { ok: false, error, transient } : { ok: false, error };
}

/** Valida com zod e lança UserError com a primeira mensagem amigável. */
export function parseInput<S extends z.ZodType>(schema: S, data: unknown): z.output<S> {
  const r = schema.safeParse(data);
  if (!r.success) {
    const first = r.error.issues[0];
    throw new UserError(first?.message || "Dados inválidos.");
  }
  return r.data;
}

function prismaCode(e: unknown): string | undefined {
  return typeof e === "object" && e !== null && "code" in e ? String((e as { code: unknown }).code) : undefined;
}

/** Converte exceções em respostas seguras (sem vazar detalhes internos). */
export function toFailure(e: unknown, context: string): { ok: false; error: string; transient?: boolean } {
  if (e instanceof UserError || e instanceof AuthError) return fail(e.message);
  const code = prismaCode(e);
  if (code === "P2002") return fail("Já existe um registro com esse nome.");
  if (code === "P2025") return fail("Registro não encontrado. Atualize a página e tente de novo.");
  if (code === "P2003") return fail("Este item está em uso e não pode ser alterado assim.");
  console.error(`[${context}]`, e);
  return fail("Não foi possível concluir agora. Tente novamente em instantes.", true);
}

export async function runAction<T>(context: string, fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    return toFailure(e, context);
  }
}
