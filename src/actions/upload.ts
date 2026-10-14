"use server";

import sharp from "sharp";
import { UserError } from "@/lib/action";
import { adminAction } from "@/lib/auth";
import { isStorageConfigured, uploadToStorage } from "@/lib/storage";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/jpg", "image/heic", "image/heif"]);
const MAX_BYTES = 4 * 1024 * 1024;

/** Recebe uma imagem, otimiza (WebP) e devolve a URL pública. */
export async function uploadImage(formData: FormData) {
  return adminAction("uploadImage", async () => {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) throw new UserError("Nenhum arquivo enviado.");
    if (!ALLOWED.has(file.type)) throw new UserError("Formato inválido. Use JPG, PNG ou WEBP.");
    if (file.size > MAX_BYTES) throw new UserError("Imagem muito grande. Máximo 4 MB.");

    const input = Buffer.from(await file.arrayBuffer());
    const storage = isStorageConfigured();

    let processed: Buffer;
    try {
      processed = await sharp(input)
        .rotate()
        .resize(storage ? 1400 : 900, storage ? 1400 : 900, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: storage ? 82 : 70, effort: 4 })
        .toBuffer();
    } catch {
      throw new UserError("Não foi possível ler essa imagem. Tente outro arquivo.");
    }

    if (storage) {
      const name = `img-${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
      try {
        return await uploadToStorage(processed, name, "image/webp");
      } catch (e) {
        console.error("[uploadImage] Storage falhou, usando data URL:", e instanceof Error ? e.message : e);
      }
      // se o Storage falhar, ainda salva a imagem (menor) dentro do banco
      processed = await sharp(processed).resize(900, 900, { fit: "inside", withoutEnlargement: true }).webp({ quality: 70 }).toBuffer();
    }
    return `data:image/webp;base64,${processed.toString("base64")}`;
  });
}
