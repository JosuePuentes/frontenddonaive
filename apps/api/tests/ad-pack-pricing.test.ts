import { describe, expect, it } from "vitest";
import { salePricesFromUnitCost } from "../src/ad/commerce-domain.js";

describe("salePricesFromUnitCost", () => {
  it("10 cajas a 10.000, 20 unidades por caja, 30% utilidad contable", () => {
    const boxCost = 10000 / 10;
    const unitCost = boxCost / 20;
    const r = salePricesFromUnitCost({
      unitCost,
      unitsPerPresentation: 20,
      utilityPercent: 30,
    });
    expect(r.unitCost).toBeCloseTo(50, 6);
    expect(r.boxCost).toBeCloseTo(1000, 6);
    expect(r.unitSale).toBeCloseTo(50 / 0.7, 6);
    expect(r.boxSale).toBeCloseTo(1000 / 0.7, 6);
  });
});
