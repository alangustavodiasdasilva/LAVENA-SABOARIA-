import { createClient } from "@supabase/supabase-js";

// Deduz a URL do Supabase a partir do DATABASE_URL (formato pooler)
function deduceSupabaseUrl(): string | null {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) return process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (process.env.SUPABASE_URL) return process.env.SUPABASE_URL;
  const db = process.env.DATABASE_URL || "";
  // postgres.PROJECTREF:senha@pooler... → ref = PROJECTREF
  const match = db.match(/postgres\.([a-z0-9]+):/i);
  if (match) return `https://${match[1]}.supabase.co`;
  return null;
}

export const SUPABASE_URL = deduceSupabaseUrl();
export const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
export const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || "lavena-uploads";

export const supabaseAdmin =
  SUPABASE_URL && SUPABASE_SERVICE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

export const isStorageConfigured = !!supabaseAdmin;

export async function uploadToSupabase(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  if (!supabaseAdmin) throw new Error("Supabase Storage não configurado.");

  const { error } = await supabaseAdmin.storage
    .from(SUPABASE_BUCKET)
    .upload(filename, buffer, {
      contentType,
      cacheControl: "31536000",
      upsert: false,
    });

  if (error) {
    throw new Error(`Falha ao subir para o Storage: ${error.message}`);
  }

  const { data } = supabaseAdmin.storage.from(SUPABASE_BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}
