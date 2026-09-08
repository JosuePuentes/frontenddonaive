/** Formato numérico es-VE: miles con punto, decimales con coma (ej. 10.000,50). */

export function formatVeNumber(
  value: number | null | undefined,
  decimals = 2,
): string {
  if (value == null || Number.isNaN(value)) return "";
  return new Intl.NumberFormat("es-VE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/** Parsea texto con formato VE o inglesa (10.000,50 / 10000.5). */
export function parseVeNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let normalized = trimmed.replace(/\s/g, "");
  const hasComma = normalized.includes(",");
  const hasDot = normalized.includes(".");
  if (hasComma && hasDot) {
    const lastComma = normalized.lastIndexOf(",");
    const lastDot = normalized.lastIndexOf(".");
    if (lastComma > lastDot) {
      normalized = normalized.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = normalized.replace(/,/g, "");
    }
  } else if (hasComma) {
    normalized = normalized.replace(",", ".");
  } else if (hasDot) {
    const parts = normalized.split(".");
    if (parts.length > 2) {
      const dec = parts.pop() ?? "";
      normalized = `${parts.join("")}.${dec}`;
    }
  }
  normalized = normalized.replace(/^0+(?=\d)/, "");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

/** Quita ceros a la izquierda mientras el usuario escribe. */
export function sanitizeNumericTyping(raw: string): string {
  return raw.replace(/^0+(?=\d)/, "");
}
