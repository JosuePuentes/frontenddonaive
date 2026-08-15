/**
 * Smoke MOCK repository A&D (directo, sin adapter/Vite).
 * Ejecutar: cd /workspace && npx tsx scripts/ad-fase3-mock-smoke.mts
 */
import { adLicoreriaRepository } from "../src/services/ad-licoreria/repository.ts";
import { asAdAsync } from "../src/services/ad-licoreria/async-result.ts";

async function main() {
  const state = adLicoreriaRepository.getState();
  if (!state.warehouses.length) throw new Error("mock warehouses empty");
  if (!state.products.length) throw new Error("mock products empty");
  if (!state.operators.length) throw new Error("mock operators empty");

  const created = await asAdAsync(
    adLicoreriaRepository.createWarehouse({
      name: "Smoke WH",
      userName: "smoke",
    }),
  );
  if (!created.ok) throw new Error(created.error);

  const cashier =
    state.operators.find((o) => o.role === "cajero") ??
    state.operators.find((o) => o.role === "admin");
  const product = state.products[0];
  const pres = state.presentations.find((p) => p.productId === product.id);
  if (!pres || !cashier) throw new Error("missing mock catalog/cashier");

  const draft = await asAdAsync(
    adLicoreriaRepository.createInvoiceDraft({
      items: [
        {
          productId: product.id,
          presentationId: pres.id,
          qty: 1,
          unitPrice: pres.price,
          qtyBase: pres.unitsPerPresentation,
        },
      ],
      payments: [{ method: "efectivo_usd", currency: "USD", amount: 1 }],
      warehouseId: cashier.warehouseId ?? state.warehouses[0].id,
      cashierName: cashier.name,
      operatorId: cashier.id,
    }),
  );
  if (!draft.ok) throw new Error(draft.error);

  console.log("PASS MOCK repository + asAdAsync");
  console.log(
    `warehouses=${adLicoreriaRepository.getState().warehouses.length} draft=${draft.data.provisionalNumber}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
