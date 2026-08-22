/**
 * A&D Fase 10.1 — UX operativa (mesonera cobro, inventario, cierre HOY, QR, nav).
 * Ejecutar: npx tsx scripts/ad-licoreria-fase101-acceptance.mts
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { adLicoreriaRepository } from "../src/services/ad-licoreria/repository.ts";
import { can } from "../src/lib/ad-licoreria/access.ts";
import { filterNavForUser } from "../src/lib/ad-licoreria/nav-by-role.ts";
import {
  AD_WH_BODEGON,
  AD_WH_LICORERIA,
} from "../src/lib/ad-licoreria/warehouses.ts";

type Row = { id: string; prueba: string; ok: boolean; detalle: string };
const rows: Row[] = [];

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

function run(id: string, name: string, fn: () => void) {
  try {
    adLicoreriaRepository.reset();
    fn();
    rows.push({ id, prueba: name, ok: true, detalle: "—" });
    console.log(`✅ ${id} ${name}`);
  } catch (e) {
    rows.push({
      id,
      prueba: name,
      ok: false,
      detalle: e instanceof Error ? e.message : String(e),
    });
    console.log(`❌ ${id} ${name}: ${e instanceof Error ? e.message : e}`);
  }
}

const PRODUCT = "prod-regional";
const PRES = "pres-reg-1";

console.log("\n=== A&D Fase 10.1 — UX operativa ===\n");

run("M1", "Mesonera cobro embebido: cuenta precargada (componente)", () => {
  const src = readFileSync(
    path.join(process.cwd(), "src/components/ad-licoreria/AdAccountChargePanel.tsx"),
    "utf8",
  );
  assert(/Cobro embebido/.test(src), "panel cobro");
  assert(/closeAccount/.test(src), "cierra cuenta");
  assert(/addAccountPayment/.test(src), "pagos mixtos");
  const meso = readFileSync(
    path.join(
      process.cwd(),
      "src/pages/ad-licoreria/mesonera/AdLicoreriaMesonera.tsx",
    ),
    "utf8",
  );
  assert(/AdAccountChargePanel/.test(meso), "usa panel");
  assert(!/to=\{AD_LICORERIA_ROUTES\.ventas\}/.test(meso), "no link vacío a ventas");
});

run("M2", "Mesonera flujo: abrir → pagar → cerrar cuenta", () => {
  adLicoreriaRepository.setCurrentOperator("op-ana");
  const open = adLicoreriaRepository.openAccount({
    mesoneraId: "op-ana",
    mesoneraName: "Ana",
    customerName: "Cliente 10.1",
    customerPhone: "0414-1010101",
    warehouseId: AD_WH_LICORERIA,
    tableId: "mesa-8",
  });
  assert(open.ok, "open");
  assert(
    adLicoreriaRepository.addAccountItem({
      accountId: open.data.id,
      productId: PRODUCT,
      presentationId: PRES,
      qty: 2,
      userName: "Ana",
      deductStock: false,
      warehouseId: AD_WH_LICORERIA,
    }).ok,
    "add",
  );
  assert(
    adLicoreriaRepository.addAccountPayment({
      accountId: open.data.id,
      method: "efectivo_usd",
      currency: "USD",
      amount: 2,
      userName: "Ana",
    }).ok,
    "pay",
  );
  const closed = adLicoreriaRepository.closeAccount({
    accountId: open.data.id,
    userName: "Ana",
    settlePendingAs: "prepaid",
  });
  assert(closed.ok, closed.ok ? "" : closed.error);
  assert(closed.data.status === "CERRADA", "cerrada");
  assert(!!closed.data.receiptNumber, "recibo");
});

run("I1", "Inventario operativo: físico/comprometido/disponible", () => {
  /** Limpia compromisos demo sobre el producto. */
  for (const acc of adLicoreriaRepository.getState().accounts) {
    if (acc.status === "CERRADA" || acc.status === "CANCELADA") continue;
    if (!acc.items.some((i) => i.productId === PRODUCT)) continue;
    adLicoreriaRepository.voidAccount({
      accountId: acc.id,
      userName: "QA 10.1",
      reason: "Limpieza I1",
      authorizedBy: "Admin",
    });
  }
  adLicoreriaRepository.setInventoryQty(PRODUCT, AD_WH_LICORERIA, 70);
  const open = adLicoreriaRepository.openAccount({
    mesoneraId: "op-ana",
    mesoneraName: "Ana",
    customerName: "Comp",
    customerPhone: "0414-2222222",
    warehouseId: AD_WH_LICORERIA,
  });
  assert(open.ok, "open");
  assert(
    adLicoreriaRepository.addAccountItem({
      accountId: open.data.id,
      productId: PRODUCT,
      presentationId: PRES,
      qty: 30,
      userName: "Ana",
      deductStock: false,
      warehouseId: AD_WH_LICORERIA,
    }).ok,
    "commit 30",
  );
  const av = adLicoreriaRepository.getOperationalAvailability(
    PRODUCT,
    0,
    AD_WH_LICORERIA,
  );
  const lic = av.byWarehouse.find((w) => w.warehouseId === AD_WH_LICORERIA)!;
  assert(lic.physical === 70, `fis=${lic.physical}`);
  assert(lic.committedActive === 30, `com=${lic.committedActive}`);
  assert(lic.availableOperational === 40, `disp=${lic.availableOperational}`);
  const ui = readFileSync(
    path.join(process.cwd(), "src/pages/ad-licoreria/AdLicoreriaInventario.tsx"),
    "utf8",
  );
  assert(/getOperationalAvailability/.test(ui), "UI consume motor");
  assert(/Comprometido/.test(ui) && /Disponible/.test(ui), "columnas");
});

run("C1", "COP transferir + comprar (acciones)", () => {
  adLicoreriaRepository.setCurrentOperator("op-admin");
  adLicoreriaRepository.setInventoryQty(PRODUCT, AD_WH_LICORERIA, 5);
  adLicoreriaRepository.setInventoryQty(PRODUCT, AD_WH_BODEGON, 40);
  const draft = adLicoreriaRepository.createTransferDraft({
    fromWarehouseId: AD_WH_BODEGON,
    toWarehouseId: AD_WH_LICORERIA,
    lines: [{ productId: PRODUCT, presentationId: PRES, qty: 10 }],
    createdBy: "COP",
    reason: "10.1",
  });
  assert(draft.ok, "tr draft");
  const conf = adLicoreriaRepository.confirmTransfer({
    transferId: draft.data.id,
    userName: "Admin",
  });
  assert(conf.ok, conf.ok ? "" : conf.error);
  assert(/^TR-\d{4}-\d{6}$/.test(conf.data.number), conf.data.number);
  const buy = adLicoreriaRepository.createPurchaseRequest({
    productId: PRODUCT,
    presentationId: PRES,
    qty: 5,
    warehouseId: AD_WH_LICORERIA,
    createdBy: "Admin",
    reason: "10.1 compra",
  });
  assert(buy.ok, buy.ok ? "" : buy.error);
});

run("P1", "POS déficit + permiso shortage_override", () => {
  adLicoreriaRepository.setInventoryQty(PRODUCT, AD_WH_LICORERIA, 0);
  adLicoreriaRepository.setInventoryQty(PRODUCT, AD_WH_BODEGON, 0);
  adLicoreriaRepository.setCurrentOperator("op-maria");
  const denied = adLicoreriaRepository.completeSale({
    items: [
      {
        productId: PRODUCT,
        presentationId: PRES,
        qty: 5,
        unitPrice: { usd: 1, bs: 370 },
        qtyBase: 5,
      },
    ],
    payments: [{ method: "efectivo_usd", currency: "USD", amount: 5 }],
    warehouseId: AD_WH_LICORERIA,
    operatorId: "op-maria",
    userName: "María",
    continueWithShortage: true,
    shortageReasonCode: "autorizacion_administrativa",
  });
  assert(!denied.ok, "cajero sin permiso");
  adLicoreriaRepository.setCurrentOperator("op-supervisor");
  const ok = adLicoreriaRepository.completeSale({
    items: [
      {
        productId: PRODUCT,
        presentationId: PRES,
        qty: 5,
        unitPrice: { usd: 1, bs: 370 },
        qtyBase: 5,
      },
    ],
    payments: [{ method: "efectivo_usd", currency: "USD", amount: 5 }],
    warehouseId: AD_WH_LICORERIA,
    operatorId: "op-maria",
    userName: "Supervisor",
    continueWithShortage: true,
    shortageReasonCode: "autorizacion_administrativa",
  });
  assert(ok.ok, ok.ok ? "" : ok.error);
});

run("Z1", "Cierre período HOY alineado UI/repo", () => {
  const src = readFileSync(
    path.join(process.cwd(), "src/pages/ad-licoreria/AdLicoreriaCierres.tsx"),
    "utf8",
  );
  assert(/createdAt\.slice\(0, 10\) !== today/.test(src), "filtro hoy UI");
  assert(/Período:/.test(src) && /HOY/.test(src), "etiqueta HOY");
  adLicoreriaRepository.setCurrentOperator("op-maria");
  adLicoreriaRepository.setInventoryQty(PRODUCT, AD_WH_LICORERIA, 50);
  assert(
    adLicoreriaRepository.completeSale({
      items: [
        {
          productId: PRODUCT,
          presentationId: PRES,
          qty: 1,
          unitPrice: { usd: 1, bs: 370 },
          qtyBase: 1,
        },
      ],
      payments: [{ method: "efectivo_usd", currency: "USD", amount: 1 }],
      warehouseId: AD_WH_LICORERIA,
      operatorId: "op-maria",
      userName: "María",
    }).ok,
    "sale",
  );
  const closure = adLicoreriaRepository.createDailyClosure({
    userName: "María",
    operatorId: "op-maria",
    warehouseId: AD_WH_LICORERIA,
    countedCashUsd: 1,
    countedCashBs: 0,
  });
  assert(closure.ok, closure.ok ? "" : closure.error);
  const today = new Date().toISOString().slice(0, 10);
  assert(closure.data.date === today, "fecha hoy");
});

run("Q1", "QR exige teléfono + cédula", () => {
  adLicoreriaRepository.setCurrentOperator("op-ana");
  const pp = adLicoreriaRepository.getState().prepaids[0];
  assert(!!pp?.customerDocumentId, "demo con cédula");
  const onlyPhone = adLicoreriaRepository.consumePrepaid({
    prepaidId: pp.id,
    productId: pp.items[0].productId,
    presentationId: pp.items[0].presentationId,
    qty: 1,
    mesoneraName: "Ana",
    verifyPhone: pp.customerPhone,
  });
  assert(!onlyPhone.ok, "falla sin cédula");
  const both = adLicoreriaRepository.consumePrepaid({
    prepaidId: pp.id,
    productId: pp.items[0].productId,
    presentationId: pp.items[0].presentationId,
    qty: 1,
    mesoneraName: "Ana",
    verifyPhone: pp.customerPhone,
    verifyDocumentId: pp.customerDocumentId,
  });
  assert(both.ok, both.ok ? "" : both.error);
});

run("N1", "Navegación filtrada por rol", () => {
  const maria = adLicoreriaRepository
    .getState()
    .operators.find((o) => o.id === "op-maria")!;
  const ana = adLicoreriaRepository
    .getState()
    .operators.find((o) => o.id === "op-ana")!;
  const pedro = adLicoreriaRepository
    .getState()
    .operators.find((o) => o.id === "op-pedro")!;
  const admin = adLicoreriaRepository
    .getState()
    .operators.find((o) => o.id === "op-admin")!;
  const navMaria = filterNavForUser(maria);
  const navAna = filterNavForUser(ana);
  const navPedro = filterNavForUser(pedro);
  const navAdmin = filterNavForUser(admin);
  assert(
    navMaria.some((i) => i.key === "ventas") &&
      !navMaria.some((i) => i.key === "cop"),
    "cajero: POS sí, COP no",
  );
  assert(
    navAna.some((i) => i.key === "mesonera") &&
      !navAna.some((i) => i.key === "cop"),
    "mesonera: mesas sí, COP no",
  );
  assert(navPedro.some((i) => i.key === "cop" || i.key === "inventario"), "inv");
  assert(navAdmin.some((i) => i.key === "usuarios"), "admin usuarios");
  assert(can(admin, "pos.shortage_override"), "admin override");
});

const failed = rows.filter((r) => !r.ok);
console.log("\n--- Resumen 10.1 ---");
for (const r of rows) {
  console.log(
    `${r.ok ? "PASS" : "FAIL"} | ${r.id} | ${r.prueba}${r.detalle !== "—" ? ` | ${r.detalle}` : ""}`,
  );
}
console.log(
  `\nTotal: ${rows.length} · PASS: ${rows.length - failed.length} · FAIL: ${failed.length}\n`,
);
process.exit(failed.length ? 1 : 0);
