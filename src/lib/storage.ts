import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || "lavena-uploads";

/** Deduz a URL do Supabase pelo DATABASE_URL do pooler (usuário "postgres.<ref>"). */
function supabaseUrl(): string | null {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) return process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (process.env.SUPABASE_URL) return process.env.SUPABASE_URL;
  const match = (process.env.DATABASE_URL || "").match(/postgres\.([a-z0-9]+):/i);
  return match ? `https://${match[1]}.supabase.co` : null;
}

let client: SupabaseClient | null | undefined;

function admin(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = supabaseUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";
  client =
    url && key
      ? createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
      : null;
  return client;
}

export function isStorageConfigured(): boolean {
  return admin() !== null;
}

async function ensureBucket(sb: SupabaseClient) {
  const { error } = await sb.storage.createBucket(SUPABASE_BUCKET, { public: true });
  if (error && !/already exists|duplicate/i.test(error.message)) throw new Error(error.message);
}

/** Envia a imagem ao Supabase Storage e devolve a URL pública. Cria o bucket se não existir. */
export async function uploadToStorage(buffer: Buffer, filename: string, contentType: string): Promise<string> {
  const sb = admin();
  if (!sb) throw new Error("Armazenamento de imagens não configurado.");

  const send = () =>
    sb.storage.from(SUPABASE_BUCKET).upload(filename, buffer, {
      contentType,
      cacheControl: "31536000",
      upsert: false,
    });

  let { error } = await send();
  if (error && /bucket not found/i.test(error.message)) {
    await ensureBucket(sb);
    ({ error } = await send());
  }
  if (error) throw new Error(error.message);
  return sb.storage.from(SUPABASE_BUCKET).getPublicUrl(filename).data.publicUrl;
}
