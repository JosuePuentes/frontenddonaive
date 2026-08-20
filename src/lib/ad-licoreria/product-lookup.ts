/**
 * Búsqueda / resolución de productos por texto o código de barras (API).
 */
import { adCommerceClient } from "@/services/ad-licoreria/commerce-client";
import { isAdApiDataSource } from "@/services/ad-licoreria/data-source";
import type { AdPresentation, AdProduct } from "@/types/ad-licoreria";

export type AdProductSearchHit = {
  id: string;
  name: string;
  brand?: string | null;
  sku?: string | null;
  barcode?: string | null;
  taxable?: boolean;
  defaultUtilityPercent?: number;
  presentations: {
    id: string;
    name: string;
    unitsPerPresentation: number;
    barcode?: string | null;
  }[];
};

type LookupResponse = {
  code?: string;
  source?: string;
  matches?: AdProductSearchHit[];
};

export async function searchAdProducts(
  term: string,
  source: "manual" | "camera" | "wedge" = "manual",
): Promise<
  | { ok: true; products: AdProductSearchHit[]; fromCode: boolean }
  | { ok: false; error: string }
> {
  const t = term.trim();
  if (!t) return { ok: true, products: [], fromCode: false };

  if (!isAdApiDataSource()) {
    return { ok: false, error: "Búsqueda API requiere VITE_AD_DATA_SOURCE=api" };
  }

  const byCode = await adCommerceClient.lookupByCode(t, source);
  if (byCode.ok) {
    const data = byCode.data as LookupResponse;
    const matches = data.matches ?? [];
    if (matches.length) {
      return { ok: true, products: matches, fromCode: true };
    }
  }

  const r = await adCommerceClient.searchProducts(t);
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, products: r.data as AdProductSearchHit[], fromCode: false };
}

/** Presentación cuyo barcode coincide exactamente (producto o empaque). */
export function matchPresentationBarcode<
  T extends { id: string; barcode?: string | null },
>(presentations: T[], code: string): T | undefined {
  const c = code.trim().toLowerCase();
  if (!c) return undefined;
  return presentations.find((p) => p.barcode?.trim().toLowerCase() === c);
}

export type ResolvedAdProduct = {
  productId: string;
  presentationId?: string;
  matchedCode: string;
};

/** Resuelve producto por código (local + API). */
export async function resolveAdProductByCode(
  code: string,
  ctx: {
    products: AdProduct[];
    presentations: AdPresentation[];
  },
  source: "manual" | "camera" | "wedge" = "camera",
): Promise<ResolvedAdProduct | null> {
  const trimmed = code.trim();
  if (!trimmed) return null;

  const presByCode = matchPresentationBarcode(ctx.presentations, trimmed);
  if (presByCode) {
    return {
      productId: presByCode.productId,
      presentationId: presByCode.id,
      matchedCode: trimmed,
    };
  }

  const bySkuOrBarcode = ctx.products.find(
    (p) =>
      p.active &&
      (p.barcode?.trim().toLowerCase() === trimmed.toLowerCase() ||
        p.sku.trim().toLowerCase() === trimmed.toLowerCase()),
  );
  if (bySkuOrBarcode) {
    return { productId: bySkuOrBarcode.id, matchedCode: trimmed };
  }

  if (isAdApiDataSource()) {
    const r = await searchAdProducts(trimmed, source);
    if (r.ok && r.products.length) {
      const hit = r.products[0];
      const pres = matchPresentationBarcode(hit.presentations, trimmed);
      return {
        productId: hit.id,
        presentationId: pres?.id,
        matchedCode: trimmed,
      };
    }
  }

  return null;
}
