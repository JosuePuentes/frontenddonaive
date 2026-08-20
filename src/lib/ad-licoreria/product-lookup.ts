/**
 * Búsqueda / resolución de productos por texto o código de barras (API).
 */
import { barcodeLookupVariants } from "@/lib/ad-licoreria/barcode-lookup";
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
  active?: boolean;
  presentations: {
    id: string;
    name: string;
    unitsPerPresentation: number;
    barcode?: string | null;
    sku?: string | null;
    priceUsd?: number;
    priceBs?: number;
  }[];
};

type LookupResponse = {
  code?: string;
  source?: string;
  matches?: AdProductSearchHit[];
};

function codesMatch(a: string, b: string): boolean {
  const va = barcodeLookupVariants(a);
  const vb = barcodeLookupVariants(b);
  return va.some((x) => vb.includes(x));
}

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

  for (const variant of barcodeLookupVariants(t)) {
    const byCode = await adCommerceClient.lookupByCode(variant, source);
    if (byCode.ok) {
      const data = byCode.data as LookupResponse;
      const matches = data.matches ?? [];
      if (matches.length) {
        return { ok: true, products: matches, fromCode: true };
      }
    }
  }

  const r = await adCommerceClient.searchProducts(t);
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, products: r.data as AdProductSearchHit[], fromCode: false };
}

/** Presentación cuyo barcode coincide exactamente (producto o empaque). */
export function matchPresentationBarcode<
  T extends { id: string; barcode?: string | null; sku?: string | null },
>(presentations: T[], code: string): T | undefined {
  const c = code.trim();
  if (!c) return undefined;
  return presentations.find(
    (p) =>
      (p.barcode && codesMatch(p.barcode, c)) ||
      (p.sku && codesMatch(p.sku, c)),
  );
}

export type ResolvedAdProduct = {
  productId: string;
  presentationId?: string;
  matchedCode: string;
  /** Datos frescos del API cuando el cache local no tiene el producto. */
  apiHit?: AdProductSearchHit;
};

function resolveLocalByCode(
  code: string,
  ctx: {
    products: AdProduct[];
    presentations: AdPresentation[];
  },
): ResolvedAdProduct | null {
  for (const variant of barcodeLookupVariants(code)) {
    const presByCode = matchPresentationBarcode(ctx.presentations, variant);
    if (presByCode) {
      return {
        productId: presByCode.productId,
        presentationId: presByCode.id,
        matchedCode: variant,
      };
    }

    const bySkuOrBarcode = ctx.products.find(
      (p) =>
        p.active &&
        ((p.barcode && codesMatch(p.barcode, variant)) ||
          codesMatch(p.sku, variant)),
    );
    if (bySkuOrBarcode) {
      return { productId: bySkuOrBarcode.id, matchedCode: variant };
    }
  }
  return null;
}

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

  const local = resolveLocalByCode(trimmed, ctx);
  if (local) return local;

  if (isAdApiDataSource()) {
    for (const variant of barcodeLookupVariants(trimmed)) {
      const r = await searchAdProducts(variant, source);
      if (r.ok && r.products.length) {
        const hit = r.products[0];
        const pres = matchPresentationBarcode(hit.presentations, variant);
        return {
          productId: hit.id,
          presentationId: pres?.id,
          matchedCode: variant,
          apiHit: hit,
        };
      }
      if (!r.ok && r.error.includes("Permiso")) {
        return null;
      }
    }
  }

  return null;
}
