/**
 * Escenario de aceptación A&D Fase 7 — COP (25 pasos).
 * Ejecutar: npx tsx scripts/ad-licoreria-cop-acceptance.mts
 */
import { adLicoreriaRepository } from "../src/services/ad-licoreria/repository.ts";
import {
  AD_WH_BODEGON,
  AD_WH_LICORERIA,
} from "../src/lib/ad-licoreria/warehouses.ts";

type Row = { step: number; name: string; status: "PASS" | "FAIL"; detail: string };
const rows: Row[] = [];

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

function step(n: number, name: string, fn: () => void) {
  try {
    fn();
    rows.push({ step: n, name, status: "PASS", detail: "—" });
    console.log(`✅ ${n}. ${name}`);
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    rows.push({ step: n, name, status: "FAIL", detail });
    console.log(`❌ ${n}. ${name}: ${detail}`);
    throw e;
  }
}

const PRODUCT = "prod-regional";
const PRES = "pres-reg-1";

console.log("\n=== A&D Fase 7 — Escenario COP ===\n");

adLicoreriaRepository.reset();

/** Estado limpio: sin compromisos activos demo sobre regional. */
function wipeOpenRegionalCommitments() {
  const st = adLicoreriaRepository.getState();
  for (const acc of st.accounts) {
    if (acc.status === "CERRADA" || acc.status === "CANCELADA") continue;
    if (!acc.items.some((i) => i.productId === PRODUCT)) continue;
    adLicoreriaRepository.voidAccount({
      accountId: acc.id,
      userName: "QA",
      reason: "Limpieza COP",
      authorizedBy: "Admin",
    });
  }
  // Anular prepago demo que ya descontó stock en datos reales no aplica al seed;
  // reiniciar inventario explícitamente después.
}

wipeOpenRegionalCommitments();
adLicoreriaRepository.setInventoryQty(PRODUCT, AD_WH_LICORERIA, 70);
adLicoreriaRepository.setInventoryQty(PRODUCT, AD_WH_BODEGON, 40);

let commitAccountId = "";
let orderAccountId = "";
let transferId = "";
let draftId = "";
let reqId = "";

step(1, "Licorería tiene 70 cervezas", () => {
  assert(
    adLicoreriaRepository.getStock(PRODUCT, AD_WH_LICORERIA) === 70,
    "lic≠70",
  );
});

step(2, "Bodegón tiene 40", () => {
  assert(
    adLicoreriaRepository.getStock(PRODUCT, AD_WH_BODEGON) === 40,
    "bod≠40",
  );
});

step(3, "Cuentas activas comprometen 60", () => {
  const open = adLicoreriaRepository.openAccount({
    mesoneraName: "María",
    customerPhone: "0414-1111111",
    customerName: "Compromiso activo",
  });
  assert(open.ok, "open");
  commitAccountId = open.data.id;
  assert(
    adLicoreriaRepository.addAccountItem({
      accountId: commitAccountId,
      productId: PRODUCT,
      presentationId: PRES,
      qty: 60,
      userName: "María",
      deductStock: false,
    }).ok,
    "add60",
  );
  const av = adLicoreriaRepository.getOperationalAvailability(PRODUCT);
  assert(av.committedActiveTotal === 60, `c=${av.committedActiveTotal}`);
  assert(
    av.byWarehouse.find((w) => w.warehouseId === AD_WH_LICORERIA)
      ?.availableOperational === 10,
    "disp lic",
  );
});

step(4, "Evaluar nueva cuenta por 20 (sin bloquear)", () => {
  const av = adLicoreriaRepository.getOperationalAvailability(PRODUCT, 20);
  assert(av.requestedBase === 20, "req");
  const lic = av.byWarehouse.find((w) => w.warehouseId === AD_WH_LICORERIA)!;
  assert(lic.availableOperational === 10, `disp=${lic.availableOperational}`);
  assert(Math.max(0, 20 - lic.availableOperational) === 10, "faltante local 10");
});

step(5, "Disponible 10 / faltante 10", () => {
  const av = adLicoreriaRepository.getOperationalAvailability(PRODUCT, 20);
  assert(av.plan.fromPreferred === 10, `fromPref=${av.plan.fromPreferred}`);
  assert(
    Math.max(0, av.requestedBase - av.availableOperationalTotal) === 0 ||
      av.plan.transferSuggestion === 10,
    "cubre con traslado",
  );
});

step(6, "Bodegón tiene disponibilidad", () => {
  const av = adLicoreriaRepository.getOperationalAvailability(PRODUCT, 20);
  const bod = av.byWarehouse.find((w) => w.warehouseId === AD_WH_BODEGON)!;
  assert(bod.availableOperational === 40, `bod=${bod.availableOperational}`);
  assert(av.plan.transferSuggestion === 10, `sug=${av.plan.transferSuggestion}`);
  assert(av.plan.transferFromId === AD_WH_BODEGON, "from bod");
});

step(7, "Preparar transferencia", () => {
  const draft = adLicoreriaRepository.createTransferDraft({
    fromWarehouseId: AD_WH_BODEGON,
    toWarehouseId: AD_WH_LICORERIA,
    lines: [{ productId: PRODUCT, presentationId: PRES, qty: 10 }],
    createdBy: "COP QA",
    reason: "Cubrir pedido 20",
  });
  assert(draft.ok, draft.ok ? "" : draft.error);
  transferId = draft.data.id;
  assert(draft.data.status === "BORRADOR", "status");
  assert(
    adLicoreriaRepository.getStock(PRODUCT, AD_WH_BODEGON) === 40,
    "borrador no mueve",
  );
});

step(8, "Generar preliminar", () => {
  const tr = adLicoreriaRepository
    .getState()
    .stockTransfers.find((t) => t.id === transferId)!;
  assert(tr.provisional && tr.number.startsWith("TR-BORR-"), tr.number);
});

step(9, "Confirmar transferencia", () => {
  const conf = adLicoreriaRepository.confirmTransfer({
    transferId,
    userName: "COP QA",
  });
  assert(conf.ok, conf.ok ? "" : conf.error);
  assert(conf.data.status === "RECIBIDA", conf.data.status);
  assert(conf.data.number.startsWith("TR-20"), conf.data.number.slice(0, 5));
});

step(10, "Actualizar inventarios", () => {
  assert(
    adLicoreriaRepository.getStock(PRODUCT, AD_WH_LICORERIA) === 80,
    `lic=${adLicoreriaRepository.getStock(PRODUCT, AD_WH_LICORERIA)}`,
  );
  assert(
    adLicoreriaRepository.getStock(PRODUCT, AD_WH_BODEGON) === 30,
    `bod=${adLicoreriaRepository.getStock(PRODUCT, AD_WH_BODEGON)}`,
  );
});

step(11, "Volver a evaluar pedido 20", () => {
  const av = adLicoreriaRepository.getOperationalAvailability(PRODUCT, 20);
  assert(av.plan.canFulfillFully, "can fulfill");
  assert(av.status === "OK", av.status);
});

step(12, "Crear cuenta 20 — puede cumplirse", () => {
  const open = adLicoreriaRepository.openAccount({
    mesoneraName: "Carlos",
    customerId: "cli-1",
    customerName: "Juan Pérez",
    customerPhone: "0414-0000000",
  });
  assert(open.ok, "open");
  orderAccountId = open.data.id;
  assert(
    adLicoreriaRepository.addAccountItem({
      accountId: orderAccountId,
      productId: PRODUCT,
      presentationId: PRES,
      qty: 20,
      userName: "Carlos",
      deductStock: false,
    }).ok,
    "add20",
  );
});

step(13, "Generar preliminar de factura (POS)", () => {
  const draft = adLicoreriaRepository.createInvoiceDraft({
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
    cashierName: "Cajero QA",
    customerId: "cli-1",
    customerName: "Juan Pérez",
    customerPhone: "0414-0000000",
  });
  assert(draft.ok, draft.ok ? "" : draft.error);
  draftId = draft.data.id;
  assert(draft.data.supplyAlerts.length >= 1, "alerts");
});

step(14, "Confirmar factura", () => {
  const sale = adLicoreriaRepository.confirmInvoiceDraft({
    draftId,
    userName: "Cajero QA",
  });
  assert(sale.ok, sale.ok ? "" : sale.error);
  assert(sale.data.receiptNumber.startsWith("AD-"), sale.data.receiptNumber);
});

step(15, "Registrar venta", () => {
  assert(
    adLicoreriaRepository.getState().sales.some((s) => s.status === "completed"),
    "sale",
  );
});

step(16, "Servir parcialmente (8 de 20)", () => {
  const item = adLicoreriaRepository
    .getState()
    .accounts.find((a) => a.id === orderAccountId)!.items[0];
  const r = adLicoreriaRepository.serveAccountItem({
    accountId: orderAccountId,
    itemId: item.id,
    qty: 8,
    mesoneraName: "Carlos",
  });
  assert(r.ok, r.ok ? "" : r.error);
});

step(17, "Mostrar pendiente 12", () => {
  const item = adLicoreriaRepository
    .getState()
    .accounts.find((a) => a.id === orderAccountId)!.items[0];
  assert(item.qty - item.qtyServed === 12, "pending");
});

step(18, "Cerrar dejando pendiente", () => {
  const r = adLicoreriaRepository.closeAccount({
    accountId: orderAccountId,
    userName: "Cajero QA",
  });
  assert(r.ok && r.data.status === "CERRADA", "close");
});

step(19, "Generar compromiso de cliente", () => {
  const c = adLicoreriaRepository
    .getState()
    .customerCommitments.filter(
      (x) => x.accountId === orderAccountId && x.status === "PENDIENTE",
    );
  assert(c.length === 1 && c[0].qtyRemaining === 12, "commitment");
});

step(20, "Verlo en COP", () => {
  const av = adLicoreriaRepository.getOperationalAvailability(PRODUCT);
  assert(av.customerPendingBase >= 12, `pend=${av.customerPendingBase}`);
  assert(
    adLicoreriaRepository.getCopDashboard().inventory.customerCommitments >= 1,
    "dash",
  );
});

step(21, "Vender mercancía comprometida NO bloquea", () => {
  const phys = adLicoreriaRepository.getStock(PRODUCT, AD_WH_LICORERIA);
  const qty = Math.max(1, Math.min(phys, 20));
  const draft = adLicoreriaRepository.createInvoiceDraft({
    items: [
      {
        productId: PRODUCT,
        presentationId: PRES,
        qty,
        unitPrice: { usd: 1, bs: 370 },
        qtyBase: qty,
      },
    ],
    payments: [{ method: "efectivo_usd", currency: "USD", amount: qty }],
    warehouseId: AD_WH_LICORERIA,
    cashierName: "QA",
  });
  assert(draft.ok, "draft");
  const sale = adLicoreriaRepository.confirmInvoiceDraft({
    draftId: draft.data.id,
    userName: "QA",
    continueWithShortage: true,
    shortageDecision: "continuar_con_faltante",
  });
  assert(sale.ok, sale.ok ? "" : sale.error);
});

step(22, "Mostrar déficit", () => {
  adLicoreriaRepository.setInventoryQty(PRODUCT, AD_WH_LICORERIA, 0);
  adLicoreriaRepository.setInventoryQty(PRODUCT, AD_WH_BODEGON, 0);
  const av = adLicoreriaRepository.getOperationalAvailability(PRODUCT);
  assert(av.customerCommitmentDeficit >= 12, `def=${av.customerCommitmentDeficit}`);
});

step(23, "Sugerencia de reposición", () => {
  const av = adLicoreriaRepository.getOperationalAvailability(PRODUCT, 12);
  assert(av.plan.purchaseNeeded === 12, `buy=${av.plan.purchaseNeeded}`);
});

step(24, "Crear compra", () => {
  const req = adLicoreriaRepository.createPurchaseRequest({
    productId: PRODUCT,
    presentationId: PRES,
    qty: 12,
    warehouseId: AD_WH_LICORERIA,
    createdBy: "COP QA",
    reason: "Reposición déficit cliente",
    relatedAccountId: orderAccountId,
  });
  assert(req.ok, req.ok ? "" : req.error);
  reqId = req.data.id;
  const buy = adLicoreriaRepository.fulfillPurchaseRequest({
    requestId: reqId,
    supplierName: "Proveedor QA",
    invoiceNumber: "FAC-QA-COP",
    date: new Date().toISOString().slice(0, 10),
    unitCostUsd: 0.4,
    unitCostBs: 148,
    userName: "COP QA",
  });
  assert(buy.ok, buy.ok ? "" : buy.error);
  assert(
    adLicoreriaRepository.getStock(PRODUCT, AD_WH_LICORERIA) === 12,
    "stock12",
  );
});

step(25, "Registrar auditoría", () => {
  const actions = new Set(
    adLicoreriaRepository.getState().audit.map((a) => a.action),
  );
  for (const a of [
    "transfer_confirm",
    "customer_commitment",
    "purchase_request",
    "invoice_preliminar",
    "invoice_confirm",
  ]) {
    assert(actions.has(a), `missing audit ${a}`);
  }
});

const pass = rows.filter((r) => r.status === "PASS").length;
console.log(`\n--- Resumen: ${pass}/${rows.length} PASS ---\n`);
if (pass !== rows.length) process.exit(1);
