import { Prisma } from "@prisma/client";

function dec(n: number): Prisma.Decimal {
  return new Prisma.Decimal(n);
}

export type PackPresentationInput = {
  packMode?: "UNIT" | "BOX";
  unitsPerBox?: number;
  unitsPerPresentation?: number;
  sku?: string | null;
  barcode?: string | null;
  priceUsd?: number;
  priceBs?: number;
};

/** Siempre crea Unidad×1. Si es caja, también Caja xN. */
export function packPresentationCreates(input: PackPresentationInput) {
  const unitUsd = Number(input.priceUsd ?? 0);
  const unitBs = Number(input.priceBs ?? 0);
  const boxUpp = Math.max(
    1,
    Number(input.unitsPerBox || input.unitsPerPresentation || 1),
  );
  const wantBox = input.packMode === "BOX" || (input.packMode !== "UNIT" && boxUpp > 1);
  const rows: {
    name: string;
    code: string;
    unitsPerPresentation: Prisma.Decimal;
    priceUsd: Prisma.Decimal;
    priceBs: Prisma.Decimal;
    sku?: string | null;
    barcode?: string | null;
  }[] = [
    {
      name: "Unidad",
      code: "U",
      unitsPerPresentation: dec(1),
      priceUsd: dec(unitUsd),
      priceBs: dec(unitBs),
      sku: input.sku,
      barcode: input.barcode,
    },
  ];
  if (wantBox && boxUpp > 1) {
    rows.push({
      name: `Caja x${boxUpp}`,
      code: "CAJA",
      unitsPerPresentation: dec(boxUpp),
      priceUsd: dec(unitUsd * boxUpp),
      priceBs: dec(unitBs * boxUpp),
      sku: input.sku,
      barcode: input.barcode,
    });
  }
  return rows;
}
