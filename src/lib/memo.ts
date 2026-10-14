/**
 * Cache em memória das leituras públicas da loja. O banco fica longe (cada consulta leva ~200 ms),
 * então repetir a mesma consulta a cada visita deixa o site lento. Qualquer ação do painel
 * limpa o cache na hora (`clearMemo`); no pior caso os dados ficam até `TTL_MS` desatualizados.
 */
const TTL_MS = 60_000;

type Entry = { at: number; value: Promise<unknown> };
const g = globalThis as unknown as { __lavenaMemo?: Map<string, Entry> };
const store = (g.__lavenaMemo ??= new Map<string, Entry>());

export function memo<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value as Promise<T>;
  const value = fn().catch((e) => {
    store.delete(key); // não guarda falhas
    throw e;
  });
  store.set(key, { at: Date.now(), value });
  return value;
}

export function clearMemo(): void {
  store.clear();
}
