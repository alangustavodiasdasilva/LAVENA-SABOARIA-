import { unstable_cache, updateTag } from "next/cache";

/**
 * Cache das leituras públicas da loja no Data Cache do Next. Na Vercel ele é compartilhado entre
 * todas as instâncias (o cache em memória anterior não era). Qualquer ação do painel chama
 * `invalidateStoreCache()`, e mesmo sem ação os dados se renovam a cada 5 minutos.
 */
export const STORE_TAG = "store";
const REVALIDATE_SECONDS = 300;

export function cached<T>(keyParts: string[], fn: () => Promise<T>): Promise<T> {
  return unstable_cache(fn, ["lavena-store", ...keyParts], { tags: [STORE_TAG], revalidate: REVALIDATE_SECONDS })();
}

/** Só funciona dentro de uma Server Action (é o caso de todas as ações do painel). */
export function invalidateStoreCache(): void {
  try {
    updateTag(STORE_TAG);
  } catch {
    // fora de uma Server Action (ex.: testes) não há o que invalidar
  }
}
