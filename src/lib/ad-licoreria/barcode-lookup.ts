/**
 * Variantes de código de barras para búsqueda tolerante (EAN, ceros, etc.).
 */
export function barcodeLookupVariants(code: string): string[] {
  const trimmed = code.trim();
  if (!trimmed) return [];
  const out = new Set<string>([trimmed]);
  const digits = trimmed.replace(/\D/g, "");
  if (digits) {
    out.add(digits);
    const stripped = digits.replace(/^0+/, "") || digits;
    out.add(stripped);
    if (digits.length <= 13) out.add(digits.padStart(13, "0"));
    if (digits.length <= 14) out.add(digits.padStart(14, "0"));
  }
  return [...out];
}
