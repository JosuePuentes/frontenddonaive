/**
 * Prueba de aceptación A&D — Fase 8 (Casos A–F).
 * Usuarios, roles, depósitos y permisos operativos (MOCK).
 * Ejecutar: npx tsx scripts/ad-licoreria-fase8-acceptance.mts
 */
import { adLicoreriaRepository } from "../src/services/ad-licoreria/repository.ts";
import {
  canAccessWarehouse,
  canOperatePos,
  hasPermission,
} from "../src/lib/ad-licoreria/access.ts";
import {
  AD_WH_BODEGON,
  AD_WH_LICORERIA,
} from "../src/lib/ad-licoreria/warehouses.ts";

type Status = "PASS" | "FAIL";
type Row = { id: string; prueba: string; resultado: Status; detalle: string };
const rows: Row[] = [];

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

function run(id: string, name: string, fn: () => void) {
  try {
    adLicoreriaRepository.reset();
    fn();
    rows.push({ id, prueba: name, resultado: "PASS", detalle: "—" });
    console.log(`✅ ${id} ${name}`);
  } catch (e) {
    const detalle = e instanceof Error ? e.message : String(e);
    rows.push({ id, prueba: name, resultado: "FAIL", detalle });
    console.log(`❌ ${id} ${name}: ${detalle}`);
  }
}

const PRODUCT = "prod-regional";
const PRES = "pres-reg-1";

function sellLine(qty = 2) {
  return {
    productId: PRODUCT,
    presentationId: PRES,
    qty,
    unitPrice: { usd: 1, bs: 370 },
    qtyBase: qty,
  };
}

console.log("\n=== A&D Fase 8 — Usuarios / roles / depósitos ===\n");

run("A", "María CAJERO Licorería — vender/cobrar/cerrar; no Bodegón ni users", () => {
  const maria = adLicoreriaRepository
    .getState()
    .operators.find((o) => o.id === "op-maria")!;
  assert(maria.role === "cajero", "rol");
  assert(maria.warehouseId === AD_WH_LICORERIA, "depósito");
  assert(canOperatePos(maria), "POS");
  assert(canAccessWarehouse(maria, AD_WH_LICORERIA), "acceso lic");
  assert(!canAccessWarehouse(maria, AD_WH_BODEGON), "bloqueo bod");
  assert(!hasPermission(maria, "users.manage"), "no users.manage");

  adLicoreriaRepository.setCurrentOperator("op-maria");
  adLicoreriaRepository.setInventoryQty(PRODUCT, AD_WH_LICORERIA, 50);

  const okSale = adLicoreriaRepository.completeSale({
    items: [sellLine(2)],
    payments: [{ method: "efectivo_usd", currency: "USD", amount: 2 }],
    warehouseId: AD_WH_LICORERIA,
    operatorId: "op-maria",
    userName: "María",
  });
  assert(okSale.ok, okSale.ok ? "" : okSale.error);
  assert(okSale.data.operatorId === "op-maria", "operatorId");
  assert(okSale.data.operatorRole === "cajero", "operatorRole");
  assert(okSale.data.warehouseId === AD_WH_LICORERIA, "sale wh");
  assert(okSale.data.receiptNumber.startsWith("AD-"), "recibo");

  const badSale = adLicoreriaRepository.completeSale({
    items: [sellLine(1)],
    payments: [{ method: "efectivo_usd", currency: "USD", amount: 1 }],
    warehouseId: AD_WH_BODEGON,
    operatorId: "op-maria",
    userName: "María",
  });
  assert(!badSale.ok, "debió fallar venta Bodegón");

  const changeWh = adLicoreriaRepository.assertOperatorCanSellInWarehouse(
    "op-maria",
    AD_WH_BODEGON,
    true,
  );
  assert(!changeWh.ok, "no cambiar depósito");

  const closure = adLicoreriaRepository.createDailyClosure({
    userName: "María",
    operatorId: "op-maria",
    warehouseId: AD_WH_LICORERIA,
    countedCashUsd: 2,
    countedCashBs: 0,
  });
  assert(closure.ok, closure.ok ? "" : closure.error);
  assert(closure.data.warehouseId === AD_WH_LICORERIA, "cierre wh");
  assert(closure.data.operatorId === "op-maria", "cierre op");

  const perm = adLicoreriaRepository.setRolePermissions({
    role: "cajero",
    permissions: [],
    userName: "María",
  });
  assert(!perm.ok, "María no administra permisos");
});

run("B", "Carlos CAJERO Bodegón — solo vende Bodegón", () => {
  adLicoreriaRepository.setCurrentOperator("op-carlos");
  adLicoreriaRepository.setInventoryQty(PRODUCT, AD_WH_BODEGON, 40);
  adLicoreriaRepository.setInventoryQty(PRODUCT, AD_WH_LICORERIA, 40);

  const ok = adLicoreriaRepository.completeSale({
    items: [sellLine(1)],
    payments: [{ method: "efectivo_usd", currency: "USD", amount: 1 }],
    warehouseId: AD_WH_BODEGON,
    operatorId: "op-carlos",
    userName: "Carlos",
  });
  assert(ok.ok, ok.ok ? "" : ok.error);

  const bad = adLicoreriaRepository.completeSale({
    items: [sellLine(1)],
    payments: [{ method: "efectivo_usd", currency: "USD", amount: 1 }],
    warehouseId: AD_WH_LICORERIA,
    operatorId: "op-carlos",
    userName: "Carlos",
  });
  assert(!bad.ok, "no vender Licorería");
});

run("C", "Ana MESONERA — mesas/cuenta; no inventario/compras/transfer/precios", () => {
  const ana = adLicoreriaRepository
    .getState()
    .operators.find((o) => o.id === "op-ana")!;
  assert(ana.role === "mesonera", "rol");
  assert(!hasPermission(ana, "inventory.read"), "no inv");
  assert(!hasPermission(ana, "purchase.create"), "no compra");
  assert(!hasPermission(ana, "inventory.transfer"), "no transfer");
  assert(!hasPermission(ana, "settings.manage"), "no precios/config");
  assert(!canOperatePos(ana), "sin POS");

  adLicoreriaRepository.setCurrentOperator("op-ana");
  const open = adLicoreriaRepository.openAccount({
    mesoneraId: "op-ana",
    mesoneraName: "Ana",
    tableId: adLicoreriaRepository.getState().tables[0]?.id,
  });
  assert(open.ok, open.ok ? "" : open.error);

  const add = adLicoreriaRepository.addAccountItem({
    accountId: open.data.id,
    productId: PRODUCT,
    presentationId: PRES,
    qty: 3,
    userName: "Ana",
    deductStock: false,
    warehouseId: AD_WH_LICORERIA,
  });
  assert(add.ok, add.ok ? "" : add.error);

  const item = adLicoreriaRepository
    .getState()
    .accounts.find((a) => a.id === open.data.id)!.items[0];
  const serve = adLicoreriaRepository.serveAccountItem({
    accountId: open.data.id,
    itemId: item.id,
    qty: 1,
    mesoneraName: "Ana",
    warehouseId: AD_WH_LICORERIA,
  });
  assert(serve.ok, serve.ok ? "" : serve.error);

  const mine = adLicoreriaRepository.getAccountsForMesonera("op-ana");
  assert(
    mine.some((a) => a.id === open.data.id),
    "mis mesas",
  );

  const buy = adLicoreriaRepository.createPurchase({
    supplierName: "X",
    invoiceNumber: "NO",
    date: "2026-08-15",
    warehouseId: AD_WH_LICORERIA,
    items: [
      {
        productId: PRODUCT,
        presentationId: PRES,
        qty: 1,
        unitCostUsd: 0.4,
        unitCostBs: 148,
      },
    ],
    userName: "Ana",
  });
  assert(!buy.ok, "Ana no compra");

  const tr = adLicoreriaRepository.createTransferDraft({
    fromWarehouseId: AD_WH_BODEGON,
    toWarehouseId: AD_WH_LICORERIA,
    lines: [{ productId: PRODUCT, presentationId: PRES, qty: 1 }],
    createdBy: "Ana",
  });
  assert(!tr.ok, "Ana no transfer");
});

run("D", "Administrador consulta ambos depósitos", () => {
  const admin = adLicoreriaRepository
    .getState()
    .operators.find((o) => o.id === "op-admin")!;
  assert(canAccessWarehouse(admin, AD_WH_LICORERIA), "lic");
  assert(canAccessWarehouse(admin, AD_WH_BODEGON), "bod");
  assert(hasPermission(admin, "users.manage"), "users");
  assert(hasPermission(admin, "deposits.manage"), "deposits");
  adLicoreriaRepository.setCurrentOperator("op-admin");
  assert(
    adLicoreriaRepository.canAccessWarehouse(AD_WH_LICORERIA),
    "repo lic",
  );
  assert(
    adLicoreriaRepository.canAccessWarehouse(AD_WH_BODEGON),
    "repo bod",
  );
});

run("E", "Compra falla sin depósito destino", () => {
  adLicoreriaRepository.setCurrentOperator("op-pedro");
  const fail = adLicoreriaRepository.createPurchase({
    supplierName: "Proveedor",
    invoiceNumber: "FAC-E",
    date: "2026-08-15",
    warehouseId: "",
    items: [
      {
        productId: PRODUCT,
        presentationId: PRES,
        qty: 10,
        unitCostUsd: 0.4,
        unitCostBs: 148,
      },
    ],
    userName: "Pedro",
  });
  assert(!fail.ok, "debió fallar");
  assert(
    fail.error.toLowerCase().includes("destino") ||
      fail.error.toLowerCase().includes("depósito"),
    fail.error,
  );

  const ok = adLicoreriaRepository.createPurchase({
    supplierName: "Proveedor",
    invoiceNumber: "FAC-E-OK",
    date: "2026-08-15",
    warehouseId: AD_WH_LICORERIA,
    items: [
      {
        productId: PRODUCT,
        presentationId: PRES,
        qty: 10,
        unitCostUsd: 0.4,
        unitCostBs: 148,
      },
    ],
    userName: "Pedro",
  });
  assert(ok.ok, ok.ok ? "" : ok.error);
  assert(ok.data.warehouseId === AD_WH_LICORERIA, "destino");
});

run("F", "Transferencia falla si origen = destino", () => {
  adLicoreriaRepository.setCurrentOperator("op-pedro");
  const fail = adLicoreriaRepository.createTransferDraft({
    fromWarehouseId: AD_WH_LICORERIA,
    toWarehouseId: AD_WH_LICORERIA,
    lines: [{ productId: PRODUCT, presentationId: PRES, qty: 5 }],
    createdBy: "Pedro",
  });
  assert(!fail.ok, "debió fallar");
  assert(
    fail.error.toLowerCase().includes("distintos") ||
      fail.error.toLowerCase().includes("origen"),
    fail.error,
  );

  const quick = adLicoreriaRepository.transfer({
    productId: PRODUCT,
    presentationId: PRES,
    qtyPresentation: 1,
    fromId: AD_WH_BODEGON,
    toId: AD_WH_BODEGON,
    userName: "Pedro",
  });
  assert(!quick.ok, "transfer rápido también falla");
});

const failed = rows.filter((r) => r.resultado === "FAIL");
console.log("\n--- Resumen Fase 8 ---");
for (const r of rows) {
  console.log(
    `${r.resultado === "PASS" ? "PASS" : "FAIL"} | ${r.id} | ${r.prueba}${r.detalle !== "—" ? ` | ${r.detalle}` : ""}`,
  );
}
console.log(
  `\nTotal: ${rows.length} · PASS: ${rows.length - failed.length} · FAIL: ${failed.length}\n`,
);
process.exit(failed.length ? 1 : 0);
