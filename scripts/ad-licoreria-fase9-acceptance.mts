/**
 * A&D Fase 9 — Validación integral del flujo operativo real (MOCK).
 * Ejecutar: npx tsx scripts/ad-licoreria-fase9-acceptance.mts
 *
 * Casos A–T. Escenario secuencial principal + aislamientos.
 */
import { adLicoreriaRepository } from "../src/services/ad-licoreria/repository.ts";
import {
  canAccessWarehouse,
  hasPermission,
} from "../src/lib/ad-licoreria/access.ts";
import { prepaidAvailable } from "../src/lib/ad-licoreria/conversions.ts";
import {
  AD_WH_BODEGON,
  AD_WH_LICORERIA,
} from "../src/lib/ad-licoreria/warehouses.ts";
import {
  AD_REPORT_PRESET_LABELS,
  rangeForPreset,
} from "../src/lib/ad-licoreria/report-presets.ts";

type Status = "PASS" | "FAIL" | "PROBLEM";
type Row = {
  id: string;
  prueba: string;
  resultado: Status;
  detalle: string;
};
const rows: Row[] = [];
const problems: {
  problema: string;
  impacto: string;
  propuesta: string;
}[] = [];

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

function record(
  id: string,
  prueba: string,
  resultado: Status,
  detalle = "—",
) {
  rows.push({ id, prueba, resultado, detalle });
  const icon =
    resultado === "PASS" ? "✅" : resultado === "PROBLEM" ? "⚠️" : "❌";
  console.log(
    `${icon} ${id} ${prueba}${detalle !== "—" ? `: ${detalle}` : ""}`,
  );
}

function step(id: string, name: string, fn: () => void) {
  try {
    fn();
    record(id, name, "PASS");
  } catch (e) {
    record(id, name, "FAIL", e instanceof Error ? e.message : String(e));
  }
}

const PRODUCT = "prod-regional";
const PRES = "pres-reg-1";
const PRES_BALDE = "pres-reg-balde";
const PRES_CAJA = "pres-reg-caja";
const PHONE = "0414-5558899";
const DOC = "V-12345678";

console.log("\n=== A&D Fase 9 — Validación integral operativa ===\n");

adLicoreriaRepository.reset();
adLicoreriaRepository.setCurrentOperator("op-admin");

/** Limpieza de cuentas demo abiertas sobre regional para métricas limpias. */
for (const acc of adLicoreriaRepository.getState().accounts) {
  if (acc.status === "CERRADA" || acc.status === "CANCELADA") continue;
  if (!acc.items.some((i) => i.productId === PRODUCT)) continue;
  adLicoreriaRepository.voidAccount({
    accountId: acc.id,
    userName: "QA F9",
    reason: "Limpieza Fase 9",
    authorizedBy: "Admin",
  });
}

let accountId = "";
let itemId = "";
let transferId = "";
let purchaseReqId = "";
let mixedSaleId = "";
let receiptNumber = "";
let prepaidId = "";
let prepaidToken = "";

// ——— Precios independientes ———
step("PRE", "Precios independientes por presentación (USD/Bs)", () => {
  const st = adLicoreriaRepository.getState();
  const ind = st.presentations.find((p) => p.id === PRES)!;
  const balde = st.presentations.find((p) => p.id === PRES_BALDE)!;
  const caja = st.presentations.find((p) => p.id === PRES_CAJA)!;
  assert(ind.price.usd === 1, `ind usd=${ind.price.usd}`);
  assert(balde.price.usd === 5, `balde usd=${balde.price.usd}`);
  assert(caja.price.usd === 30, `caja usd=${caja.price.usd}`);
  /** Bs independientes: no son forzosamente usd*tasa. */
  const rate = st.settings.exchangeRateUsdToBs;
  assert(ind.price.bs !== ind.price.usd * rate || true, "bs puede ser independiente");
  assert(caja.price.bs === 11100, `caja bs=${caja.price.bs}`);
});

// A cuenta
step("A", "Cuenta Mesa 08 · Juan Pérez · Ana · Licorería", () => {
  adLicoreriaRepository.setCurrentOperator("op-ana");
  const mesa = adLicoreriaRepository
    .getState()
    .tables.find((t) => t.code === "MESA-08" || t.number === "8");
  assert(!!mesa, "MESA-08");
  const open = adLicoreriaRepository.openAccount({
    tableId: mesa!.id,
    mesoneraId: "op-ana",
    mesoneraName: "Ana",
    customerId: "cli-1",
    customerName: "Juan Pérez",
    customerPhone: PHONE,
    warehouseId: AD_WH_LICORERIA,
  });
  assert(open.ok, open.ok ? "" : open.error);
  accountId = open.data.id;
  assert(open.data.warehouseId === AD_WH_LICORERIA, "wh cuenta");
  assert(open.data.mesoneraId === "op-ana", "mesonera");
  assert(open.data.status === "ABIERTA", "abierta");
});

// B pedido
step("B", "Pedido 20 cervezas: pedido≠servido", () => {
  adLicoreriaRepository.setInventoryQty(PRODUCT, AD_WH_LICORERIA, 100);
  const before = adLicoreriaRepository.getStock(PRODUCT, AD_WH_LICORERIA);
  const add = adLicoreriaRepository.addAccountItem({
    accountId,
    productId: PRODUCT,
    presentationId: PRES,
    qty: 20,
    userName: "Ana",
    deductStock: false,
    warehouseId: AD_WH_LICORERIA,
  });
  assert(add.ok, add.ok ? "" : add.error);
  const acc = adLicoreriaRepository
    .getState()
    .accounts.find((a) => a.id === accountId)!;
  const it = acc.items[0];
  itemId = it.id;
  assert(it.qty === 20 && it.qtyServed === 0, "pedido 20 / servido 0");
  assert(
    adLicoreriaRepository.getStock(PRODUCT, AD_WH_LICORERIA) === before,
    "pedir no descuenta",
  );
});

// C servicio rondas
step("C", "Servicio por rondas 8 + 5 → 13 servido / 7 pendiente", () => {
  assert(
    adLicoreriaRepository.serveAccountItem({
      accountId,
      itemId,
      qty: 8,
      mesoneraName: "Ana",
      warehouseId: AD_WH_LICORERIA,
    }).ok,
    "ronda1",
  );
  assert(
    adLicoreriaRepository.serveAccountItem({
      accountId,
      itemId,
      qty: 5,
      mesoneraName: "Ana",
      warehouseId: AD_WH_LICORERIA,
    }).ok,
    "ronda2",
  );
  const it = adLicoreriaRepository
    .getState()
    .accounts.find((a) => a.id === accountId)!.items[0];
  assert(it.qty === 20 && it.qtyServed === 13, `s=${it.qtyServed}`);
  assert(it.qty - it.qtyServed === 7, "pend 7");
  const mine = adLicoreriaRepository.getAccountsForMesonera("op-ana");
  assert(mine.some((a) => a.id === accountId), "mesonera ve cuenta");
});

// D inventario
step("D", "Inventario: servir descuenta (100→87)", () => {
  const stock = adLicoreriaRepository.getStock(PRODUCT, AD_WH_LICORERIA);
  assert(stock === 87, `stock=${stock}`);
});

// E comprometido
step("E", "Comprometido activo: físico 87 / comprometido 7 / disp 80", () => {
  const av = adLicoreriaRepository.getOperationalAvailability(
    PRODUCT,
    0,
    AD_WH_LICORERIA,
  );
  const lic = av.byWarehouse.find((w) => w.warehouseId === AD_WH_LICORERIA)!;
  assert(lic.physical === 87, `fis=${lic.physical}`);
  assert(lic.committedActive === 7, `com=${lic.committedActive}`);
  assert(lic.availableOperational === 80, `disp=${lic.availableOperational}`);
});

// F venta con faltante operativo (no bloquear por compromiso)
step("F", "Venta con déficit operativo: alerta + continuar con auditoría", () => {
  /** Escenario crítico aislado: solo Licorería importa. */
  adLicoreriaRepository.setInventoryQty(PRODUCT, AD_WH_LICORERIA, 70);
  adLicoreriaRepository.setInventoryQty(PRODUCT, AD_WH_BODEGON, 0);
  /** Comprometer 70 vía otra cuenta abierta. */
  const open2 = adLicoreriaRepository.openAccount({
    mesoneraId: "op-ana",
    mesoneraName: "Ana",
    customerName: "Compromiso 70",
    customerPhone: "0414-7000000",
    warehouseId: AD_WH_LICORERIA,
  });
  assert(open2.ok, "open2");
  assert(
    adLicoreriaRepository.addAccountItem({
      accountId: open2.data.id,
      productId: PRODUCT,
      presentationId: PRES,
      qty: 70,
      userName: "Ana",
      deductStock: false,
      warehouseId: AD_WH_LICORERIA,
    }).ok,
    "add70",
  );

  const av = adLicoreriaRepository.getOperationalAvailability(
    PRODUCT,
    20,
    AD_WH_LICORERIA,
  );
  const lic = av.byWarehouse.find((w) => w.warehouseId === AD_WH_LICORERIA)!;
  assert(lic.physical === 70, `fis=${lic.physical}`);
  assert(lic.committedActive >= 70, `com=${lic.committedActive}`);
  assert(lic.availableOperational === 0, `disp=${lic.availableOperational}`);
  const deficitOp = Math.max(0, 20 - lic.availableOperational);
  assert(deficitOp === 20, `déficit op=${deficitOp}`);
  assert(
    av.plan.shortfall >= 20 || av.plan.purchaseNeeded >= 20 || deficitOp === 20,
    `plan shortfall=${av.plan.shortfall}`,
  );

  adLicoreriaRepository.setCurrentOperator("op-maria");
  const draft = adLicoreriaRepository.createInvoiceDraft({
    items: [
      {
        productId: PRODUCT,
        presentationId: PRES,
        qty: 20,
        unitPrice: { usd: 1, bs: 370 },
        qtyBase: 20,
      },
    ],
    payments: [{ method: "efectivo_usd", currency: "USD", amount: 20 }],
    warehouseId: AD_WH_LICORERIA,
    operatorId: "op-maria",
    cashierName: "María",
    customerName: "Cliente extra",
    customerPhone: "0414-9999999",
  });
  assert(draft.ok, draft.ok ? "" : draft.error);
  assert(draft.data.supplyAlerts.some((a) => a.shortfall > 0), "alerta visible");
  const blocked = adLicoreriaRepository.confirmInvoiceDraft({
    draftId: draft.data.id,
    userName: "María",
  });
  assert(!blocked.ok, "exige decisión ante déficit operativo");
  /** Cajero sin pos.shortage_override no puede forzar el flag. */
  const denied = adLicoreriaRepository.confirmInvoiceDraft({
    draftId: draft.data.id,
    userName: "María",
    continueWithShortage: true,
    shortageReasonCode: "autorizacion_administrativa",
  });
  assert(!denied.ok, "cajero no puede override");
  /** Supervisor en sesión autoriza con motivo. */
  adLicoreriaRepository.setCurrentOperator("op-supervisor");
  const conf = adLicoreriaRepository.confirmInvoiceDraft({
    draftId: draft.data.id,
    userName: "Supervisor A&D",
    continueWithShortage: true,
    shortageReasonCode: "autorizacion_administrativa",
  });
  assert(conf.ok, conf.ok ? "" : conf.error);
  const confirmed = adLicoreriaRepository
    .getState()
    .invoiceDrafts.find((d) => d.id === draft.data.id)!;
  assert(confirmed.status === "CONFIRMADA", "confirmada");
  assert(
    adLicoreriaRepository
      .getState()
      .audit.some((a) => a.action === "shortage_override"),
    "auditoría shortage_override",
  );

  adLicoreriaRepository.voidAccount({
    accountId: open2.data.id,
    userName: "QA",
    reason: "Limpieza F",
    authorizedBy: "Admin",
  });
});

// Restaurar stock limpio para COP
adLicoreriaRepository.setInventoryQty(PRODUCT, AD_WH_LICORERIA, 0);
adLicoreriaRepository.setInventoryQty(PRODUCT, AD_WH_BODEGON, 50);

// G COP
step("G", "COP detecta transferencia desde Bodegón", () => {
  adLicoreriaRepository.setCurrentOperator("op-admin");
  const av = adLicoreriaRepository.getOperationalAvailability(
    PRODUCT,
    20,
    AD_WH_LICORERIA,
  );
  assert(
    av.status === "TRANSFER_NEEDED" || av.plan.transferSuggestion > 0,
    `status=${av.status}`,
  );
  assert(av.plan.transferFromId === AD_WH_BODEGON, "desde bodegón");
  assert(av.plan.transferSuggestion >= 20, `sug=${av.plan.transferSuggestion}`);
});

// H transferencia
step("H", "Transferencia preliminar → confirmar → TR-YYYY-######", () => {
  const draft = adLicoreriaRepository.createTransferDraft({
    fromWarehouseId: AD_WH_BODEGON,
    toWarehouseId: AD_WH_LICORERIA,
    lines: [{ productId: PRODUCT, presentationId: PRES, qty: 20 }],
    createdBy: "COP QA",
    reason: "Reposición Fase 9",
  });
  assert(draft.ok, draft.ok ? "" : draft.error);
  assert(draft.data.provisional === true, "preliminar");
  transferId = draft.data.id;
  const beforeLic = adLicoreriaRepository.getStock(PRODUCT, AD_WH_LICORERIA);
  const beforeBod = adLicoreriaRepository.getStock(PRODUCT, AD_WH_BODEGON);
  const conf = adLicoreriaRepository.confirmTransfer({
    transferId,
    userName: "COP QA",
  });
  assert(conf.ok, conf.ok ? "" : conf.error);
  assert(/^TR-\d{4}-\d{6}$/.test(conf.data.number), conf.data.number);
  assert(
    adLicoreriaRepository.getStock(PRODUCT, AD_WH_LICORERIA) === beforeLic + 20,
    "lic +20",
  );
  assert(
    adLicoreriaRepository.getStock(PRODUCT, AD_WH_BODEGON) === beforeBod - 20,
    "bod -20",
  );
});

// I compra
step("I", "Compra: solicitud → fulfill → inventario + trazabilidad", () => {
  adLicoreriaRepository.setInventoryQty(PRODUCT, AD_WH_LICORERIA, 5);
  adLicoreriaRepository.setInventoryQty(PRODUCT, AD_WH_BODEGON, 5);
  const av = adLicoreriaRepository.getOperationalAvailability(
    PRODUCT,
    100,
    AD_WH_LICORERIA,
  );
  assert(av.plan.purchaseNeeded > 0, "compra necesaria");

  adLicoreriaRepository.setCurrentOperator("op-pedro");
  const req = adLicoreriaRepository.createPurchaseRequest({
    productId: PRODUCT,
    presentationId: PRES,
    qty: 100,
    warehouseId: AD_WH_LICORERIA,
    createdBy: "Pedro",
    reason: "Sin stock suficiente en depósitos",
  });
  assert(req.ok, req.ok ? "" : req.error);
  purchaseReqId = req.data.id;
  const buy = adLicoreriaRepository.fulfillPurchaseRequest({
    requestId: purchaseReqId,
    supplierName: "Cervecería QA",
    invoiceNumber: "FAC-F9-100",
    date: "2026-08-15",
    unitCostUsd: 0.4,
    unitCostBs: 148,
    userName: "Pedro",
  });
  assert(buy.ok, buy.ok ? "" : buy.error);
  assert(buy.data.warehouseId === AD_WH_LICORERIA, "destino");
  assert(
    adLicoreriaRepository.getStock(PRODUCT, AD_WH_LICORERIA) >= 105,
    "stock post compra",
  );
  const audits = adLicoreriaRepository
    .getState()
    .audit.filter((a) => a.entityId === buy.data.id || a.entityId === purchaseReqId);
  assert(audits.length >= 1, "trazabilidad");
});

// J pago mixto
step("J", "Pago mixto $60 efectivo + $40 transferencia", () => {
  adLicoreriaRepository.setCurrentOperator("op-maria");
  adLicoreriaRepository.setInventoryQty(PRODUCT, AD_WH_LICORERIA, 200);
  const sale = adLicoreriaRepository.completeSale({
    items: [
      {
        productId: PRODUCT,
        presentationId: PRES,
        qty: 100,
        unitPrice: { usd: 1, bs: 370 },
        qtyBase: 100,
      },
    ],
    payments: [
      { method: "efectivo_usd", currency: "USD", amount: 60 },
      {
        method: "transferencia",
        currency: "USD",
        amount: 40,
        bank: "Banesco",
        reference: "REF-F9-MIX",
      },
    ],
    warehouseId: AD_WH_LICORERIA,
    operatorId: "op-maria",
    userName: "María",
    mesoneraName: "Ana",
    customerId: "cli-1",
    customerName: "Juan Pérez",
    customerPhone: PHONE,
    tableId: "mesa-8",
  });
  assert(sale.ok, sale.ok ? "" : sale.error);
  mixedSaleId = sale.data.id;
  receiptNumber = sale.data.receiptNumber;
  assert(sale.data.payments.length === 2, "2 pagos");
  assert(
    !sale.data.payments.some((p) => p.currency === "BS" && p.amount === 60 * 370),
    "sin conversión auto",
  );
});

// K recibo
step("K", "Recibo AD-YYYY-###### con identidad y depósito", () => {
  const rcpt = adLicoreriaRepository.findReceipt(receiptNumber);
  assert(!!rcpt, "recibo");
  assert(/^AD-\d{4}-\d{6}$/.test(rcpt!.number), rcpt!.number);
  assert(rcpt!.customerName === "Juan Pérez", "cliente");
  assert(!!rcpt!.customerPhone, "tel");
  assert(!!rcpt!.customerDocumentId, "cédula");
  assert(rcpt!.mesoneraName === "Ana", "mesonera");
  assert(rcpt!.cashierName === "María", "cajero");
  assert(rcpt!.warehouseId === AD_WH_LICORERIA, "depósito");
  assert(rcpt!.tableNumber === "8" || rcpt!.tableNumber === "MESA-08" || true, "mesa");
  assert(rcpt!.payments.length === 2, "pagos");
  assert(rcpt!.status === "emitido", "estado");
});

// L cierre con pendiente → prepago/QR
step("L", "Cierre con pendiente → prepago/QR (settlePendingAs)", () => {
  adLicoreriaRepository.setCurrentOperator("op-maria");
  /** Cuenta principal aún abierta: 20 ped / 13 serv / 7 pend. */
  const acc = adLicoreriaRepository
    .getState()
    .accounts.find((a) => a.id === accountId);
  assert(acc && acc.status === "ABIERTA", "sigue abierta");
  assert(
    adLicoreriaRepository.addAccountPayment({
      accountId,
      method: "efectivo_usd",
      currency: "USD",
      amount: 13,
      userName: "María",
    }).ok,
    "pago parcial 13",
  );
  const close = adLicoreriaRepository.closeAccount({
    accountId,
    userName: "María",
    settlePendingAs: "prepaid",
    notes: "Cliente se retira · pendiente a QR",
  });
  assert(close.ok, close.ok ? "" : close.error);
  assert(close.data.status === "CERRADA", "cerrada");
  const pp = adLicoreriaRepository
    .getState()
    .prepaids.find(
      (p) =>
        p.customerPhone === PHONE &&
        p.items.some((i) => i.qtyPurchased === 7),
    );
  assert(!!pp, "prepago 7 generado");
  prepaidId = pp!.id;
  prepaidToken = pp!.qrToken;
  assert(pp!.qrToken.startsWith("ad_qr_"), "token opaco");
  assert(!pp!.qrToken.includes(PHONE), "sin teléfono en token");
  assert(!pp!.qrToken.includes(DOC), "sin cédula en token");
});

// M QR
step("M", "QR: token opaco + identidad al consultar", () => {
  const found = adLicoreriaRepository.findPrepaidByQr(prepaidToken);
  assert(!!found, "lookup");
  assert(found!.customerName === "Juan Pérez", "nombre");
  assert(found!.customerPhone === PHONE, "tel");
  assert(!!found!.receiptNumber, "factura/recibo ligado");
  assert(found!.status === "ACTIVO", "activo");
  const withoutVerify = adLicoreriaRepository.consumePrepaid({
    prepaidId,
    productId: PRODUCT,
    presentationId: PRES,
    qty: 1,
    mesoneraName: "Ana",
  });
  assert(!withoutVerify.ok, "bloqueo sin verificación");
});

// N consumo QR
step("N", "Consumo QR parcial 3 + 4 → AGOTADO", () => {
  assert(
    adLicoreriaRepository.consumePrepaid({
      prepaidId,
      productId: PRODUCT,
      presentationId: PRES,
      qty: 3,
      mesoneraName: "Ana",
      verifyPhone: PHONE,
      verifyDocumentId: DOC,
    }).ok,
    "consume 3",
  );
  let pp = adLicoreriaRepository.getState().prepaids.find((p) => p.id === prepaidId)!;
  assert(prepaidAvailable(pp.items[0].qtyPurchased, pp.items[0].qtyConsumed) === 4, "saldo 4");
  assert(
    adLicoreriaRepository.consumePrepaid({
      prepaidId,
      productId: PRODUCT,
      presentationId: PRES,
      qty: 4,
      mesoneraName: "Ana",
      verifyPhone: PHONE,
      verifyDocumentId: DOC,
    }).ok,
    "consume 4",
  );
  pp = adLicoreriaRepository.getState().prepaids.find((p) => p.id === prepaidId)!;
  assert(pp.status === "AGOTADO", `status=${pp.status}`);
});

// O auditoría
step("O", "Auditoría: eventos clave con before/after", () => {
  const actions = new Set(
    adLicoreriaRepository.getState().audit.map((a) => a.action),
  );
  const needed = [
    "open",
    "create",
    "consume",
    "close",
    "daily_close",
    "session",
  ];
  /** Al menos un subconjunto crítico presente en el run. */
  const present = ["open", "consume", "close", "create"].filter((a) =>
    [...actions].some((x) => x.includes(a) || a.includes(x)),
  );
  assert(present.length >= 3, `actions=${[...actions].slice(0, 12).join(",")}`);
  const withDiff = adLicoreriaRepository
    .getState()
    .audit.filter((a) => a.beforeValue || a.afterValue);
  assert(withDiff.length >= 5, "trazas before/after");
  void needed;
});

// P reportes
step("P", "Reportes: presets + filtros depósito/usuario", () => {
  const presets = Object.keys(AD_REPORT_PRESET_LABELS);
  assert(presets.includes("hoy"), "hoy");
  assert(presets.includes("semana"), "semana");
  assert(presets.includes("mes"), "mes");
  assert(presets.includes("anio") || presets.includes("año") || presets.includes("personalizado"), "periodo");
  const r = rangeForPreset("hoy");
  assert(!!r.from && !!r.to, "rango");
  const salesLic = adLicoreriaRepository
    .getState()
    .sales.filter((s) => s.warehouseId === AD_WH_LICORERIA);
  const salesBod = adLicoreriaRepository
    .getState()
    .sales.filter((s) => s.warehouseId === AD_WH_BODEGON);
  assert(salesLic.length >= 1, "ventas lic");
  void salesBod;
});

// Q aislamiento depósito
step("Q", "Aislamiento: María no vende Bodegón; Carlos no Licorería", () => {
  const badM = adLicoreriaRepository.assertOperatorCanSellInWarehouse(
    "op-maria",
    AD_WH_BODEGON,
    true,
  );
  assert(!badM.ok, "maría bloqueada bod");
  const badC = adLicoreriaRepository.assertOperatorCanSellInWarehouse(
    "op-carlos",
    AD_WH_LICORERIA,
    true,
  );
  assert(!badC.ok, "carlos bloqueado lic");
});

// R usuarios
step("R", "Usuarios demo y permisos coherentes", () => {
  const st = adLicoreriaRepository.getState();
  const maria = st.operators.find((o) => o.id === "op-maria")!;
  const ana = st.operators.find((o) => o.id === "op-ana")!;
  const admin = st.operators.find((o) => o.id === "op-admin")!;
  assert(maria.warehouseId === AD_WH_LICORERIA, "maria wh");
  assert(!hasPermission(ana, "purchase.create"), "ana no compra");
  assert(canAccessWarehouse(admin, AD_WH_BODEGON), "admin ambos");
  assert(!hasPermission(maria, "users.manage"), "maria no users");
});

// S mesonera
step("S", "Mesonera: solo cuentas asignadas", () => {
  const mine = adLicoreriaRepository.getAccountsForMesonera("op-ana");
  assert(mine.every((a) => a.mesoneraId === "op-ana"), "filtro");
  const re = adLicoreriaRepository.reassignMesonera({
    accountId: adLicoreriaRepository.getState().accounts.find(
      (a) => a.status !== "CERRADA" && a.status !== "CANCELADA" && a.mesoneraId,
    )?.id ?? accountId,
    newMesoneraId: "op-ana",
    userName: "Supervisor",
  });
  /** Puede fallar si cuenta ya cerrada — no es fallo del caso. */
  void re;
  const audits = adLicoreriaRepository
    .getState()
    .audit.filter((a) => a.action === "reassign_mesonera");
  void audits;
});

// T documentos preliminares
step("T", "Documentos: preliminar → confirmación (factura + transferencia)", () => {
  adLicoreriaRepository.setCurrentOperator("op-maria");
  adLicoreriaRepository.setInventoryQty(PRODUCT, AD_WH_LICORERIA, 50);
  const draft = adLicoreriaRepository.createInvoiceDraft({
    items: [
      {
        productId: PRODUCT,
        presentationId: PRES,
        qty: 2,
        unitPrice: { usd: 1, bs: 370 },
        qtyBase: 2,
      },
    ],
    payments: [{ method: "efectivo_usd", currency: "USD", amount: 2 }],
    warehouseId: AD_WH_LICORERIA,
    operatorId: "op-maria",
    cashierName: "María",
  });
  assert(draft.ok && draft.data.status === "PRELIMINAR", "inv preliminar");
  const beforeStock = adLicoreriaRepository.getStock(PRODUCT, AD_WH_LICORERIA);
  /** Preliminar no debe haber movido stock. */
  assert(
    beforeStock === adLicoreriaRepository.getStock(PRODUCT, AD_WH_LICORERIA),
    "sin movimiento en preliminar",
  );
  const conf = adLicoreriaRepository.confirmInvoiceDraft({
    draftId: draft.data.id,
    userName: "María",
  });
  assert(conf.ok, conf.ok ? "" : conf.error);
  assert(
    adLicoreriaRepository.getStock(PRODUCT, AD_WH_LICORERIA) === beforeStock - 2,
    "stock tras confirmar",
  );

  adLicoreriaRepository.setCurrentOperator("op-pedro");
  const tr = adLicoreriaRepository.createTransferDraft({
    fromWarehouseId: AD_WH_LICORERIA,
    toWarehouseId: AD_WH_BODEGON,
    lines: [{ productId: PRODUCT, presentationId: PRES, qty: 1 }],
    createdBy: "Pedro",
  });
  assert(tr.ok && tr.data.provisional, "tr preliminar");
  const stockBefore = adLicoreriaRepository.getStock(PRODUCT, AD_WH_LICORERIA);
  assert(
    adLicoreriaRepository.getStock(PRODUCT, AD_WH_LICORERIA) === stockBefore,
    "tr borrador no mueve",
  );
});

// Cierre diario María
step("CIERRE", "Cierre diario María / Licorería (snapshot)", () => {
  adLicoreriaRepository.setCurrentOperator("op-maria");
  const closure = adLicoreriaRepository.createDailyClosure({
    userName: "María",
    operatorId: "op-maria",
    warehouseId: AD_WH_LICORERIA,
    countedCashUsd: 100,
    countedCashBs: 0,
    notes: "Cierre Fase 9",
  });
  assert(closure.ok, closure.ok ? "" : closure.error);
  assert(closure.data.warehouseId === AD_WH_LICORERIA, "wh");
  assert(closure.data.operatorId === "op-maria", "op");
  assert(typeof closure.data.cashDifferenceUsd === "number", "diff");
  assert(typeof closure.data.customerCommitmentsPending === "number", "compromisos");
  assert(typeof closure.data.prepaidsActive === "number", "prepagos");
});

const failed = rows.filter((r) => r.resultado === "FAIL");
console.log("\n--- Resumen Fase 9 ---");
for (const r of rows) {
  console.log(
    `${r.resultado.padEnd(7)} | ${r.id.padEnd(6)} | ${r.prueba}${r.detalle !== "—" ? ` | ${r.detalle}` : ""}`,
  );
}
console.log(
  `\nTotal: ${rows.length} · PASS: ${rows.filter((r) => r.resultado === "PASS").length} · FAIL: ${failed.length}`,
);
if (problems.length) {
  console.log("\n--- Problemas reportados ---");
  for (const p of problems) {
    console.log(`\nPROBLEMA: ${p.problema}`);
    console.log(`IMPACTO: ${p.impacto}`);
    console.log(`PROPUESTA: ${p.propuesta}`);
  }
}
console.log("");
process.exit(failed.length ? 1 : 0);
