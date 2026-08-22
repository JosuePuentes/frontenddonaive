/**
 * A&D Microfase 9.1 — pos.shortage_override + filtros de reportes.
 * Ejecutar: npx tsx scripts/ad-licoreria-fase91-acceptance.mts
 */
import { adLicoreriaRepository } from "../src/services/ad-licoreria/repository.ts";
import { can, hasPermission } from "../src/lib/ad-licoreria/access.ts";
import {
  filterSalesByReportQuery,
  saleMatchesPaymentMethod,
  saleReportStatus,
} from "../src/lib/ad-licoreria/report-filters.ts";
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

function line(qty = 20) {
  return {
    productId: PRODUCT,
    presentationId: PRES,
    qty,
    unitPrice: { usd: 1, bs: 370 },
    qtyBase: qty,
  };
}

function setupShortageScenario() {
  adLicoreriaRepository.setInventoryQty(PRODUCT, AD_WH_LICORERIA, 70);
  adLicoreriaRepository.setInventoryQty(PRODUCT, AD_WH_BODEGON, 0);
  const open = adLicoreriaRepository.openAccount({
    mesoneraId: "op-ana",
    mesoneraName: "Ana",
    customerName: "Compromiso 70",
    customerPhone: "0414-7000000",
    warehouseId: AD_WH_LICORERIA,
  });
  assert(open.ok, "open");
  assert(
    adLicoreriaRepository.addAccountItem({
      accountId: open.data.id,
      productId: PRODUCT,
      presentationId: PRES,
      qty: 70,
      userName: "Ana",
      deductStock: false,
      warehouseId: AD_WH_LICORERIA,
    }).ok,
    "commit 70",
  );
  return open.data.id;
}

console.log("\n=== A&D Microfase 9.1 — Override + filtros ===\n");

run("U1", "Cajero sin pos.shortage_override → no puede continuar", () => {
  const maria = adLicoreriaRepository
    .getState()
    .operators.find((o) => o.id === "op-maria")!;
  assert(!can(maria, "pos.shortage_override"), "sin permiso");
  setupShortageScenario();
  adLicoreriaRepository.setCurrentOperator("op-maria");
  const draft = adLicoreriaRepository.createInvoiceDraft({
    items: [line(20)],
    payments: [{ method: "efectivo_usd", currency: "USD", amount: 20 }],
    warehouseId: AD_WH_LICORERIA,
    operatorId: "op-maria",
    cashierName: "María",
  });
  assert(draft.ok, draft.ok ? "" : draft.error);
  const conf = adLicoreriaRepository.confirmInvoiceDraft({
    draftId: draft.data.id,
    userName: "María",
    continueWithShortage: true,
    shortageReasonCode: "autorizacion_administrativa",
  });
  assert(!conf.ok, "debió fallar");
  assert(
    conf.error.toLowerCase().includes("pos.shortage_override") ||
      conf.error.toLowerCase().includes("permiso"),
    conf.error,
  );
});

run("U2", "Supervisor con pos.shortage_override → puede continuar", () => {
  const sup = adLicoreriaRepository
    .getState()
    .operators.find((o) => o.id === "op-supervisor")!;
  assert(can(sup, "pos.shortage_override"), "permiso");
  setupShortageScenario();
  /** Ticket del cajero; autorización del supervisor en sesión. */
  adLicoreriaRepository.setCurrentOperator("op-maria");
  const draft = adLicoreriaRepository.createInvoiceDraft({
    items: [line(20)],
    payments: [{ method: "efectivo_usd", currency: "USD", amount: 20 }],
    warehouseId: AD_WH_LICORERIA,
    operatorId: "op-maria",
    cashierName: "María",
  });
  assert(draft.ok, draft.ok ? "" : draft.error);
  adLicoreriaRepository.setCurrentOperator("op-supervisor");
  const conf = adLicoreriaRepository.confirmInvoiceDraft({
    draftId: draft.data.id,
    userName: "Supervisor A&D",
    continueWithShortage: true,
    shortageReasonCode: "reposicion_en_curso",
  });
  assert(conf.ok, conf.ok ? "" : conf.error);
});

run("U3", "Admin → puede continuar", () => {
  const admin = adLicoreriaRepository
    .getState()
    .operators.find((o) => o.id === "op-admin")!;
  assert(hasPermission(admin, "pos.shortage_override"), "admin");
  setupShortageScenario();
  adLicoreriaRepository.setCurrentOperator("op-admin");
  const draft = adLicoreriaRepository.createInvoiceDraft({
    items: [line(20)],
    payments: [{ method: "efectivo_usd", currency: "USD", amount: 20 }],
    warehouseId: AD_WH_LICORERIA,
    operatorId: "op-admin",
    cashierName: "Administrador",
  });
  assert(draft.ok, draft.ok ? "" : draft.error);
  const conf = adLicoreriaRepository.confirmInvoiceDraft({
    draftId: draft.data.id,
    userName: "Administrador",
    continueWithShortage: true,
    shortageReasonCode: "autorizacion_administrativa",
  });
  assert(conf.ok, conf.ok ? "" : conf.error);
});

run("U4", "continueWithShortage=true sin permiso → falla (flag no basta)", () => {
  setupShortageScenario();
  adLicoreriaRepository.setCurrentOperator("op-maria");
  const direct = adLicoreriaRepository.completeSale({
    items: [line(20)],
    payments: [{ method: "efectivo_usd", currency: "USD", amount: 20 }],
    warehouseId: AD_WH_LICORERIA,
    operatorId: "op-maria",
    userName: "María",
    continueWithShortage: true,
    shortageReasonCode: "autorizacion_administrativa",
  });
  assert(!direct.ok, "flag solo no basta");
  assert(
    direct.error.toLowerCase().includes("pos.shortage_override") ||
      direct.error.toLowerCase().includes("permiso"),
    direct.error,
  );
});

run("U5", "Override exitoso → auditoría completa", () => {
  setupShortageScenario();
  adLicoreriaRepository.setCurrentOperator("op-admin");
  const draft = adLicoreriaRepository.createInvoiceDraft({
    items: [line(20)],
    payments: [{ method: "efectivo_usd", currency: "USD", amount: 20 }],
    warehouseId: AD_WH_LICORERIA,
    operatorId: "op-admin",
    cashierName: "Administrador",
  });
  assert(draft.ok, "draft");
  const conf = adLicoreriaRepository.confirmInvoiceDraft({
    draftId: draft.data.id,
    userName: "Administrador",
    continueWithShortage: true,
    shortageReasonCode: "transferencia_pendiente",
    shortageReasonNote: "TR en curso desde Bodegón",
  });
  assert(conf.ok, conf.ok ? "" : conf.error);
  const audit = adLicoreriaRepository
    .getState()
    .audit.find((a) => a.action === "shortage_override");
  assert(!!audit, "evento shortage_override");
  assert(!!audit!.createdAt, "fecha");
  assert(audit!.userName === "Administrador", "usuario");
  assert(
    (audit!.afterValue ?? "").includes("transferencia_pendiente"),
    "motivo",
  );
  assert((audit!.afterValue ?? "").includes("shortageLines"), "disponibilidad");
});

run("U6", "Motivo vacío → falla", () => {
  setupShortageScenario();
  adLicoreriaRepository.setCurrentOperator("op-admin");
  const draft = adLicoreriaRepository.createInvoiceDraft({
    items: [line(20)],
    payments: [{ method: "efectivo_usd", currency: "USD", amount: 20 }],
    warehouseId: AD_WH_LICORERIA,
    operatorId: "op-admin",
    cashierName: "Administrador",
  });
  assert(draft.ok, "draft");
  const conf = adLicoreriaRepository.confirmInvoiceDraft({
    draftId: draft.data.id,
    userName: "Administrador",
    continueWithShortage: true,
    shortageReasonCode: "",
  });
  assert(!conf.ok, "motivo vacío");
  assert(conf.error.toLowerCase().includes("motivo"), conf.error);

  const confOtro = adLicoreriaRepository.confirmInvoiceDraft({
    draftId: draft.data.id,
    userName: "Administrador",
    continueWithShortage: true,
    shortageReasonCode: "otro",
    shortageReasonNote: "",
  });
  assert(!confOtro.ok, "otro sin detalle");
});

run("U7", "Filtro método de pago → resultados correctos", () => {
  adLicoreriaRepository.setCurrentOperator("op-maria");
  adLicoreriaRepository.setInventoryQty(PRODUCT, AD_WH_LICORERIA, 200);
  assert(
    adLicoreriaRepository.completeSale({
      items: [line(5)],
      payments: [
        {
          method: "transferencia",
          currency: "USD",
          amount: 5,
          bank: "Banesco",
          reference: "REF-U7",
        },
      ],
      warehouseId: AD_WH_LICORERIA,
      operatorId: "op-maria",
      userName: "María",
    }).ok,
    "sale transfer",
  );
  assert(
    adLicoreriaRepository.completeSale({
      items: [line(3)],
      payments: [{ method: "efectivo_usd", currency: "USD", amount: 3 }],
      warehouseId: AD_WH_LICORERIA,
      operatorId: "op-maria",
      userName: "María",
    }).ok,
    "sale cash",
  );
  const today = new Date().toISOString().slice(0, 10);
  const sales = adLicoreriaRepository.getState().sales;
  const onlyTransfer = filterSalesByReportQuery(sales, {
    from: today,
    to: today,
    paymentMethod: "transferencia",
  });
  assert(
    onlyTransfer.every((s) => saleMatchesPaymentMethod(s, "transferencia")),
    "solo transferencia",
  );
  assert(onlyTransfer.length >= 1, "hay transferencias");
  const onlyCash = filterSalesByReportQuery(sales, {
    from: today,
    to: today,
    paymentMethod: "efectivo",
  });
  assert(
    onlyCash.every((s) => saleMatchesPaymentMethod(s, "efectivo")),
    "solo efectivo",
  );
});

run("U8", "Filtro estado → resultados correctos", () => {
  adLicoreriaRepository.setCurrentOperator("op-maria");
  adLicoreriaRepository.setInventoryQty(PRODUCT, AD_WH_LICORERIA, 100);
  const sale = adLicoreriaRepository.completeSale({
    items: [line(2)],
    payments: [{ method: "efectivo_usd", currency: "USD", amount: 2 }],
    warehouseId: AD_WH_LICORERIA,
    operatorId: "op-maria",
    userName: "María",
  });
  assert(sale.ok, "sale");
  adLicoreriaRepository.voidSale({
    saleId: sale.data.id,
    userName: "María",
    reason: "Prueba U8",
    authorizedBy: "Admin",
  });
  const today = new Date().toISOString().slice(0, 10);
  const sales = adLicoreriaRepository.getState().sales;
  const anuladas = filterSalesByReportQuery(sales, {
    from: today,
    to: today,
    status: "anulada",
  });
  assert(
    anuladas.every((s) => saleReportStatus(s) === "anulada"),
    "solo anuladas",
  );
  assert(anuladas.some((s) => s.id === sale.data.id), "incluye void");
  const pagadas = filterSalesByReportQuery(sales, {
    from: today,
    to: today,
    status: "pagada",
  });
  assert(
    pagadas.every((s) => saleReportStatus(s) === "pagada"),
    "solo pagadas",
  );
});

run("U9", "Método + estado + depósito combinados", () => {
  adLicoreriaRepository.setCurrentOperator("op-maria");
  adLicoreriaRepository.setInventoryQty(PRODUCT, AD_WH_LICORERIA, 100);
  adLicoreriaRepository.setInventoryQty(PRODUCT, AD_WH_BODEGON, 100);
  assert(
    adLicoreriaRepository.completeSale({
      items: [line(4)],
      payments: [
        {
          method: "transferencia",
          currency: "USD",
          amount: 4,
          bank: "Mercantil",
          reference: "REF-U9",
        },
      ],
      warehouseId: AD_WH_LICORERIA,
      operatorId: "op-maria",
      userName: "María",
    }).ok,
    "lic transfer",
  );
  adLicoreriaRepository.setCurrentOperator("op-carlos");
  assert(
    adLicoreriaRepository.completeSale({
      items: [line(4)],
      payments: [
        {
          method: "transferencia",
          currency: "USD",
          amount: 4,
          bank: "Mercantil",
          reference: "REF-U9B",
        },
      ],
      warehouseId: AD_WH_BODEGON,
      operatorId: "op-carlos",
      userName: "Carlos",
    }).ok,
    "bod transfer",
  );
  const today = new Date().toISOString().slice(0, 10);
  const filtered = filterSalesByReportQuery(
    adLicoreriaRepository.getState().sales,
    {
      from: today,
      to: today,
      warehouseId: AD_WH_LICORERIA,
      paymentMethod: "transferencia",
      status: "pagada",
    },
  );
  assert(
    filtered.every(
      (s) =>
        s.warehouseId === AD_WH_LICORERIA &&
        saleMatchesPaymentMethod(s, "transferencia") &&
        saleReportStatus(s) === "pagada",
    ),
    "combinado",
  );
  assert(
    filtered.some((s) => s.userName === "María"),
    "incluye María",
  );
  assert(
    !filtered.some((s) => s.warehouseId === AD_WH_BODEGON),
    "excluye Bodegón",
  );
});

const failed = rows.filter((r) => !r.ok);
console.log("\n--- Resumen 9.1 ---");
for (const r of rows) {
  console.log(
    `${r.ok ? "PASS" : "FAIL"} | ${r.id} | ${r.prueba}${r.detalle !== "—" ? ` | ${r.detalle}` : ""}`,
  );
}
console.log(
  `\nTotal: ${rows.length} · PASS: ${rows.length - failed.length} · FAIL: ${failed.length}\n`,
);
process.exit(failed.length ? 1 : 0);
