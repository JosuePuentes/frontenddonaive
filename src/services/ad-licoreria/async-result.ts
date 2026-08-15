/**
 * Helpers async para resultados A&D (mock sync | api Promise).
 */
import type { AdResult } from "./repository";

export async function resolveAdResult<T>(
  result:
    | AdResult<T>
    | Promise<AdResult<T>>
    | Promise<AdResult>,
): Promise<AdResult<T>> {
  return (await result) as AdResult<T>;
}

export function isAdResultPromise<T>(
  result: AdResult<T> | Promise<AdResult<T>>,
): result is Promise<AdResult<T>> {
  return typeof (result as Promise<AdResult<T>>).then === "function";
}
