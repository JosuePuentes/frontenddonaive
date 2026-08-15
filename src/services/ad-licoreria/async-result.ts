/**
 * Contrato async A&D (Fase 3).
 * El Provider siempre expone Promise para mutaciones duales mock|api.
 * Los repositories pueden seguir siendo sync (mock) o async (api).
 */
import type { AdResult } from "./repository";

/** Normaliza sync o async a Promise sin casts inseguros. */
export function asAdAsync<T>(
  result: AdResult<T> | PromiseLike<AdResult<T>>,
): Promise<AdResult<T>> {
  return Promise.resolve(result);
}

/** Alias usado por páginas: await del resultado del Provider. */
export async function resolveAdResult<T>(
  result: AdResult<T> | PromiseLike<AdResult<T>>,
): Promise<AdResult<T>> {
  return asAdAsync(result);
}

export function isAdResultPromise<T>(
  result: AdResult<T> | PromiseLike<AdResult<T>>,
): result is PromiseLike<AdResult<T>> {
  return typeof (result as PromiseLike<AdResult<T>>).then === "function";
}
