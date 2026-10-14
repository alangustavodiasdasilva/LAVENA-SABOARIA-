import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/** Remove parâmetros que só o Prisma conhece e que o driver `pg` não deve receber. */
function cleanConnectionString(raw: string | undefined): { url: string | undefined; local: boolean; noSsl: boolean } {
  if (!raw) return { url: undefined, local: false, noSsl: false };
  try {
    const u = new URL(raw);
    const mode = u.searchParams.get("sslmode");
    for (const key of ["sslmode", "ssl", "uselibpqcompat", "pgbouncer", "connection_limit", "pool_timeout", "schema"]) {
      u.searchParams.delete(key);
    }
    const local = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(u.hostname);
    return { url: u.toString(), local, noSsl: mode === "disable" };
  } catch {
    return { url: raw, local: false, noSsl: false };
  }
}

function createClient() {
  const { url, local, noSsl } = cleanConnectionString(process.env.DATABASE_URL);
  const adapter = new PrismaPg({
    connectionString: url,
    // O pooler do Supabase exige SSL; o certificado dele não está na lista padrão do Node.
    ssl: local || noSsl ? false : { rejectUnauthorized: false },
    // Em serverless cada instância abre poucas conexões para não esgotar o pooler.
    max: 4,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 8_000,
  });
  return new PrismaClient({ adapter });
}

declare global {
  var __lavenaPrisma: ReturnType<typeof createClient> | undefined;
}

const prisma = globalThis.__lavenaPrisma ?? createClient();
globalThis.__lavenaPrisma = prisma;

export default prisma;
