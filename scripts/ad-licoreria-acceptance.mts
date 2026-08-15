/**
 * Prueba de aceptación funcional A&D — Fase 3 (A–P).
 * Ejecutar: npx tsx scripts/ad-licoreria-acceptance.mts
 */
import { adLicoreriaRepository } from "../src/services/ad-licoreria/repository.ts";
import {
  accountAvailable,
  prepaidAvailable,
  toBaseUnits,
} from "../src/lib/ad-licoreria/conversions.ts";
import {
  AD_REPORT_PRESET_LABELS,
  rangeForPreset,
  type AdReportPreset,
} from "../src/lib/ad-licoreria/report-presets.ts";
import type { AdPresentation, AdProduct } from "../src/types/ad-licoreria.ts";

type Status = "PASS" | "PARTIAL" | "FAIL";
type Row = {
  id: string;
  prueba: string;
  resultado: Status;
  problema: string;
  correccion: string;
};

const rows: Row[] = [];

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

function record(
  id: string,
  prueba: string,
  resultado: Status,
  problema = "—",
  correccion = "—",
) {
  rows.push({ id, prueba, resultado, problema, correccion });
  const icon =
    resultado === "PASS" ? "✅" : resultado === "PARTIAL" ? "⚠️" : "❌";
  console.log(`${icon} ${id} ${prueba}: ${resultado}${problema !== "—" ? ` — ${problema}` : ""}`);
}

function run(id: string, name: string, fn: () => void | Status | { status: Status; problema?: string; correccion?: string }) {
  try {
    adLicoreriaRepository.reset();
    const out = fn();
    if (!out) {
      record(id, name, "PASS");
      return;
    }
    if (typeof out === "string") {
      record(id, name, out);
      return;
    }
    record(id, name, out.status, out.problema ?? "—", out.correccion ?? "—");
  } catch (e) {
    record(id, name, "FAIL", e instanceof Error ? e.message : String(e), "Revisar flujo");
  }
}

// A
run("A", "Producto + presentación + conversión", () => {
  const product: AdProduct = {
    id: "prod-acc-a",
    name: "Cerveza QA",
    brand: "QA",
    categoryId: "cat-cerveza",
    sku: "QA-CER",
    baseUnitLabel: "individual",
    cost: { usd: 0.4, bs: 148 },
    minStockBase: 10,
    active: true,
    createdAt: new Date().toISOString(),
  };
  assert(adLicoreriaRepository.upsertProduct(product).ok, "product");
  const ind: AdPresentation = {
    id: "pres-a-ind",
    productId: product.id,
    name: "Individual",
    unitsPerPresentation: 1,
    price: { usd: 1.5, bs: 400 },
    active: true,
  };
  const balde: AdPresentation = {
    id: "pres-a-bal",
    productId: product.id,
    name: "Balde",
    unitsPerPresentation: 10,
    price: { usd: 12, bs: 3500 },
    active: true,
  };
  const caja: AdPresentation = {
    id: "pres-a-caja",
    productId: product.id,
    name: "Caja x36",
    unitsPerPresentation: 36,
    price: { usd: 40, bs: 12000 },
    active: true,
  };
  for (const p of [ind, balde, caja]) {
    assert(adLicoreriaRepository.upsertPresentation(p).ok, p.name);
  }
  assert(toBaseUnits(balde, 2) === 20, "2 baldes");
  assert(toBaseUnits(caja, 1) === 36, "caja");
  assert(ind.price.bs === 400 && caja.price.bs === 12000, "precios independientes");
});

// B
run("B", "Traslado entre depósitos", () => {
  const pid = "prod-regional";
  const s1 = adLicoreriaRepository.getStock(pid, "wh-1");
  const s2 = adLicoreriaRepository.getStock(pid, "wh-2");
  const need1 = 100 - s1;
  const need2 = 50 - s2;
  if (need1 !== 0) {
    assert(
      adLicoreriaRepository.registerMovement({
        type: need1 > 0 ? "AJUSTE_ENTRADA" : "AJUSTE_SALIDA",
        productId: pid,
        presentationId: "pres-reg-1",
        qtyPresentation: Math.abs(need1),
        warehouseId: "wh-1",
        userName: "QA",
      }).ok,
      "setup1",
    );
  }
  if (need2 !== 0) {
    assert(
      adLicoreriaRepository.registerMovement({
        type: need2 > 0 ? "AJUSTE_ENTRADA" : "AJUSTE_SALIDA",
        productId: pid,
        presentationId: "pres-reg-1",
        qtyPresentation: Math.abs(need2),
        warehouseId: "wh-2",
        userName: "QA",
      }).ok,
      "setup2",
    );
  }
  assert(adLicoreriaRepository.getStock(pid, "wh-1") === 100, "100");
  assert(adLicoreriaRepository.getStock(pid, "wh-2") === 50, "50");
  assert(
    adLicoreriaRepository.transfer({
      productId: pid,
      presentationId: "pres-reg-1",
      qtyPresentation: 20,
      fromId: "wh-1",
      toId: "wh-2",
      userName: "QA",
      reason: "Traslado B",
    }).ok,
    "transfer",
  );
  assert(adLicoreriaRepository.getStock(pid, "wh-1") === 80, "80");
  assert(adLicoreriaRepository.getStock(pid, "wh-2") === 70, "70");
  const recent = adLicoreriaRepository.getState().movements.slice(0, 4);
  assert(recent.some((m) => m.type === "TRASLADO_SALIDA" && m.qtyBase === 20), "kardex out");
  assert(recent.some((m) => m.type === "TRASLADO_ENTRADA" && m.qtyBase === 20), "kardex in");
});

// C
run("C", "Cliente + teléfono + historial", () => {
  assert(
    !adLicoreriaRepository.upsertCustomer({
      id: "x",
      firstName: "A",
      lastName: "B",
      name: "A B",
      phone: "",
      active: true,
      createdAt: new Date().toISOString(),
    }).ok,
    "phone required",
  );
  assert(
    adLicoreriaRepository.upsertCustomer({
      id: "cli-c",
      firstName: "Ana",
      lastName: "QA",
      name: "Ana QA",
      phone: "0412-1112233",
      active: true,
      createdAt: new Date().toISOString(),
    }).ok,
    "create",
  );
  assert(
    adLicoreriaRepository.completeSale({
      items: [
        {
          productId: "prod-regional",
          presentationId: "pres-reg-1",
          qty: 2,
          unitPrice: { usd: 1, bs: 370 },
          qtyBase: 2,
        },
      ],
      payments: [{ method: "efectivo_usd", currency: "USD", amount: 2 }],
      warehouseId: "wh-2",
      userName: "Cajero",
      customerId: "cli-c",
      customerName: "Ana QA",
      customerPhone: "0412-1112233",
    }).ok,
    "sale",
  );
  const sum = adLicoreriaRepository.getCustomerSummary("cli-c");
  assert(!!sum, "summary");
  assert(sum!.sales.length >= 1, "historial");
  assert(sum!.totals.totalPurchasedUsd >= 2, "total");
  assert(!!sum!.totals.lastPurchaseReceipt, "last");
});

// D+E+O combined carefully
run("D/E", "POS 20 + servir 8 + servir 5 + pend 7", () => {
  const stock0 = adLicoreriaRepository.getStock("prod-regional", "wh-2");
  const acc = adLicoreriaRepository.openAccount({
    tableId: "mesa-1",
    mesoneraName: "María",
    customerId: "cli-1",
    customerPhone: "0414-0000000",
  });
  assert(acc.ok, acc.ok ? "" : acc.error);
  const add = adLicoreriaRepository.addAccountItem({
    accountId: acc.data.id,
    productId: "prod-regional",
    presentationId: "pres-reg-1",
    qty: 20,
    userName: "María",
    deductStock: false,
  });
  assert(add.ok, add.ok ? "" : add.error);
  assert(
    adLicoreriaRepository.getStock("prod-regional", "wh-2") === stock0,
    "pedido ≠ descuento",
  );
  let item = adLicoreriaRepository
    .getState()
    .accounts.find((a) => a.id === acc.data.id)!.items[0];
  assert(item.qty === 20 && item.qtyServed === 0 && accountAvailable(20, 0) === 20, "init");
  assert(
    adLicoreriaRepository.serveAccountItem({
      accountId: acc.data.id,
      itemId: item.id,
      qty: 8,
      mesoneraName: "María",
    }).ok,
    "serve8",
  );
  item = adLicoreriaRepository
    .getState()
    .accounts.find((a) => a.id === acc.data.id)!.items[0];
  assert(item.qtyServed === 8 && accountAvailable(20, 8) === 12, "after8");
  assert(
    adLicoreriaRepository.serveAccountItem({
      accountId: acc.data.id,
      itemId: item.id,
      qty: 5,
      mesoneraName: "María",
    }).ok,
    "serve5",
  );
  item = adLicoreriaRepository
    .getState()
    .accounts.find((a) => a.id === acc.data.id)!.items[0];
  assert(item.qty === 20 && item.qtyServed === 13 && accountAvailable(20, 13) === 7, "after13");
  assert(
    adLicoreriaRepository.getStock("prod-regional", "wh-2") === stock0 - 13,
    "stock −13",
  );
});

// F
run("F", "Pago mixto", () => {
  const sale = adLicoreriaRepository.completeSale({
    items: [
      {
        productId: "prod-polar",
        presentationId: "pres-polar-1",
        qty: 10,
        unitPrice: { usd: 1, bs: 370 },
        qtyBase: 10,
      },
    ],
    payments: [
      { method: "efectivo_usd", currency: "USD", amount: 4 },
      {
        method: "pago_movil",
        currency: "BS",
        amount: 2220,
        bank: "BNC",
        reference: "MIX-1",
      },
    ],
    warehouseId: "wh-2",
    userName: "Cajero",
    customerId: "cli-1",
    customerPhone: "0414-0000000",
  });
  assert(sale.ok, sale.ok ? "" : sale.error);
  assert(sale.data.payments.length === 2, "2 pagos");
  assert(sale.data.payments.some((p) => p.reference === "MIX-1"), "ref");
});

// G
run("G", "Recibo AD-YYYY-######", () => {
  const sale = adLicoreriaRepository.completeSale({
    items: [
      {
        productId: "prod-agua",
        presentationId: "pres-agua-1",
        qty: 1,
        unitPrice: { usd: 0.6, bs: 220 },
        qtyBase: 1,
      },
    ],
    payments: [{ method: "efectivo_usd", currency: "USD", amount: 0.6 }],
    warehouseId: "wh-2",
    userName: "Cajero",
    tableId: "mesa-2",
    mesoneraName: "Carlos",
    customerId: "cli-1",
    customerName: "Juan Pérez",
    customerPhone: "0414-0000000",
  });
  assert(sale.ok, sale.ok ? "" : sale.error);
  assert(/^AD-\d{4}-\d{6}$/.test(sale.data.receiptNumber), sale.data.receiptNumber);
  const r = adLicoreriaRepository.findReceipt(sale.data.receiptNumber);
  assert(!!r && r.customerPhone === "0414-0000000", "recibo");
});

// H+I
run("H/I", "Prepago + QR + consumo parcial", () => {
  const pp = adLicoreriaRepository.createPrepaid({
    customerId: "cli-1",
    customerPhone: "0414-0000000",
    items: [
      {
        productId: "prod-regional",
        presentationId: "pres-reg-1",
        qty: 20,
      },
    ],
    userName: "Cajero",
  });
  assert(pp.ok, pp.ok ? "" : pp.error);
  assert(/^PRE-\d{4}-\d{6}$/.test(pp.data.code), pp.data.code);
  assert(pp.data.qrToken.startsWith("ad_qr_"), "token");
  assert(
    adLicoreriaRepository.consumePrepaid({
      prepaidId: pp.data.id,
      productId: "prod-regional",
      presentationId: "pres-reg-1",
      qty: 8,
      mesoneraName: "María",
      verifyPhone: "0414-0000000",
    }).ok,
    "consume",
  );
  const again = adLicoreriaRepository.findPrepaidByQr(pp.data.qrToken)!;
  const it = again.items[0];
  assert(it.qtyPurchased === 20 && it.qtyConsumed === 8, "20/8");
  assert(prepaidAvailable(20, 8) === 12, "12");
});

// K
run("K", "Cierre de caja", () => {
  adLicoreriaRepository.completeSale({
    items: [
      {
        productId: "prod-regional",
        presentationId: "pres-reg-1",
        qty: 5,
        unitPrice: { usd: 1, bs: 370 },
        qtyBase: 5,
      },
    ],
    payments: [{ method: "efectivo_usd", currency: "USD", amount: 5 }],
    warehouseId: "wh-2",
    userName: "Cajero",
    mesoneraName: "María",
    customerId: "cli-1",
    customerPhone: "0414-0000000",
    discountUsd: 0.5,
  });
  const c = adLicoreriaRepository.createDailyClosure({
    userName: "Admin",
    countedCashUsd: 4,
    countedCashBs: 0,
  });
  assert(c.ok, c.ok ? "" : c.error);
  assert(c.data.expectedCashUsd === 5, `expected ${c.data.expectedCashUsd}`);
  assert(c.data.cashDifferenceUsd === -1, "diff");
  assert(c.data.discountUsd === 0.5, "discount");
});

// L
run("L", "Cierre de inventario", () => {
  const th = adLicoreriaRepository.getStock("prod-regional", "wh-1");
  const r = adLicoreriaRepository.createInventoryClosure({
    lines: [
      {
        productId: "prod-regional",
        warehouseId: "wh-1",
        theoreticalBase: th,
        physicalBase: th - 2,
        differenceBase: -2,
      },
    ],
    createdBy: "Inv",
    warehouseId: "wh-1",
    applyAdjustments: true,
  });
  assert(r.ok, r.ok ? "" : r.error);
  assert(adLicoreriaRepository.getStock("prod-regional", "wh-1") === th - 2, "adjusted");
});

// M
run("M", "Reportes por presets", () => {
  const keys = Object.keys(AD_REPORT_PRESET_LABELS) as AdReportPreset[];
  for (const p of keys) {
    const r = rangeForPreset(p);
    if (p === "personalizado") {
      assert(r.from === "" && r.to === "", "custom empty");
    } else {
      assert(!!r.from && !!r.to && r.from <= r.to, `preset ${p}`);
    }
  }
  assert(keys.includes("semana_anterior") && keys.includes("mes_anterior"), "extra presets");
});

// N
run("N", "Anulación de venta POS", () => {
  const before = adLicoreriaRepository.getStock("prod-agua", "wh-2");
  const sale = adLicoreriaRepository.completeSale({
    items: [
      {
        productId: "prod-agua",
        presentationId: "pres-agua-1",
        qty: 3,
        unitPrice: { usd: 0.6, bs: 220 },
        qtyBase: 3,
      },
    ],
    payments: [{ method: "efectivo_usd", currency: "USD", amount: 1.8 }],
    warehouseId: "wh-2",
    userName: "Cajero",
    customerId: "cli-1",
    customerPhone: "0414-0000000",
  });
  assert(sale.ok, sale.ok ? "" : sale.error);
  assert(adLicoreriaRepository.getStock("prod-agua", "wh-2") === before - 3, "sold");
  assert(
    adLicoreriaRepository.voidSale({
      saleId: sale.data.id,
      userName: "Admin",
      reason: "Error QA",
      authorizedBy: "Admin A&D",
    }).ok,
    "void",
  );
  assert(adLicoreriaRepository.getStock("prod-agua", "wh-2") === before, "restored");
  assert(
    adLicoreriaRepository.getState().movements.some((m) => m.type === "DEVOLUCION"),
    "kardex devolucion",
  );
});

// O — anulación cuenta con mercancía servida
run("O", "Anulación cuenta con 13 servidas → stock +13", () => {
  const stock0 = adLicoreriaRepository.getStock("prod-regional", "wh-2");
  const acc = adLicoreriaRepository.openAccount({
    tableId: "mesa-4",
    mesoneraName: "María",
    customerId: "cli-1",
    customerPhone: "0414-0000000",
  });
  assert(acc.ok, acc.ok ? "" : acc.error);
  const add = adLicoreriaRepository.addAccountItem({
    accountId: acc.data.id,
    productId: "prod-regional",
    presentationId: "pres-reg-1",
    qty: 20,
    userName: "María",
    deductStock: false,
  });
  assert(add.ok, add.ok ? "" : add.error);
  const itemId = adLicoreriaRepository
    .getState()
    .accounts.find((a) => a.id === acc.data.id)!.items[0].id;
  assert(
    adLicoreriaRepository.serveAccountItem({
      accountId: acc.data.id,
      itemId,
      qty: 8,
      mesoneraName: "María",
    }).ok,
    "s8",
  );
  assert(
    adLicoreriaRepository.serveAccountItem({
      accountId: acc.data.id,
      itemId,
      qty: 5,
      mesoneraName: "María",
    }).ok,
    "s5",
  );
  assert(
    adLicoreriaRepository.getStock("prod-regional", "wh-2") === stock0 - 13,
    "stock after serve",
  );
  const item = adLicoreriaRepository
    .getState()
    .accounts.find((a) => a.id === acc.data.id)!.items[0];
  assert(item.qty === 20 && item.qtyServed === 13 && accountAvailable(20, 13) === 7, "state");

  const voided = adLicoreriaRepository.voidAccount({
    accountId: acc.data.id,
    userName: "Admin",
    reason: "Cliente canceló",
    authorizedBy: "Admin A&D",
  });
  assert(voided.ok, voided.ok ? "" : voided.error);
  assert(voided.data.status === "CANCELADA", "anulada");
  assert(
    adLicoreriaRepository.getStock("prod-regional", "wh-2") === stock0,
    `stock restored got ${adLicoreriaRepository.getStock("prod-regional", "wh-2")} expected ${stock0}`,
  );
  const audit = adLicoreriaRepository
    .getState()
    .audit.find((a) => a.action === "void" && a.entity === "account");
  assert(!!audit?.beforeValue && !!audit.afterValue && !!audit.reason, "audit void");
  assert(
    adLicoreriaRepository.getState().movements.some(
      (m) =>
        m.type === "DEVOLUCION" &&
        m.qtyPresentation === 13 &&
        m.reference === acc.data.id,
    ),
    "devolucion 13",
  );
});

// P
run("P", "Auditoría before/after sensibles", () => {
  const acc = adLicoreriaRepository.openAccount({
    mesoneraName: "María",
    customerId: "cli-1",
    customerPhone: "0414-0000000",
  });
  assert(acc.ok, acc.ok ? "" : acc.error);
  adLicoreriaRepository.addAccountItem({
    accountId: acc.data.id,
    productId: "prod-regional",
    presentationId: "pres-reg-1",
    qty: 4,
    userName: "María",
    deductStock: true,
  });
  adLicoreriaRepository.applyDiscount({
    accountId: acc.data.id,
    discountUsd: 1,
    discountBs: 0,
    reason: "Cortesía",
    userName: "Cajero",
    authorizedBy: "Admin",
  });
  adLicoreriaRepository.addAccountPayment({
    accountId: acc.data.id,
    method: "efectivo_usd",
    currency: "USD",
    amount: 3,
    userName: "Cajero",
  });
  adLicoreriaRepository.closeAccount({
    accountId: acc.data.id,
    userName: "Cajero",
  });
  adLicoreriaRepository.reopenAccount({
    accountId: acc.data.id,
    userName: "Admin",
    reason: "Olvido ítem",
  });
  const pres = adLicoreriaRepository
    .getState()
    .presentations.find((p) => p.id === "pres-reg-1")!;
  adLicoreriaRepository.upsertPresentation({
    ...pres,
    price: { usd: 1.05, bs: 390 },
  });
  adLicoreriaRepository.transfer({
    productId: "prod-agua",
    presentationId: "pres-agua-1",
    qtyPresentation: 2,
    fromId: "wh-1",
    toId: "wh-2",
    userName: "Inv",
    reason: "P",
  });
  adLicoreriaRepository.registerMovement({
    type: "AJUSTE_SALIDA",
    productId: "prod-agua",
    presentationId: "pres-agua-1",
    qtyPresentation: 1,
    warehouseId: "wh-2",
    userName: "Inv",
    reason: "Rotura",
  });

  const audit = adLicoreriaRepository.getState().audit;
  for (const action of [
    "discount",
    "payment",
    "close",
    "reopen",
    "venta",
    "upsert",
    "TRASLADO_SALIDA",
    "AJUSTE_SALIDA",
  ]) {
    assert(audit.some((a) => a.action === action), `missing ${action}`);
  }
  const disc = audit.find((a) => a.action === "discount")!;
  assert(!!disc.beforeValue && !!disc.afterValue && !!disc.reason, "discount ba");
  const price = audit.find((a) => a.action === "upsert" && a.entity === "presentation")!;
  assert(!!price.beforeValue && !!price.afterValue, "price ba");
  const mov = audit.find((a) => a.action === "AJUSTE_SALIDA")!;
  assert(!!mov.beforeValue && !!mov.afterValue, "ajuste ba");
});

async function runWhatsApp() {
  try {
    adLicoreriaRepository.reset();
    const sale = adLicoreriaRepository.completeSale({
      items: [
        {
          productId: "prod-agua",
          presentationId: "pres-agua-1",
          qty: 1,
          unitPrice: { usd: 0.6, bs: 220 },
          qtyBase: 1,
        },
      ],
      payments: [{ method: "efectivo_usd", currency: "USD", amount: 0.6 }],
      warehouseId: "wh-2",
      userName: "Cajero",
      customerId: "cli-1",
      customerPhone: "0414-0000000",
    });
    if (!sale.ok) throw new Error(sale.error);
    await new Promise((r) => setTimeout(r, 80));
    const logs = adLicoreriaRepository.getState().whatsappLogs;
    if (!logs.some((l) => l.template === "purchase_thanks" && l.status === "mock_sent")) {
      throw new Error("sin purchase_thanks");
    }
    record("J", "WhatsApp mock", "PASS");
  } catch (e) {
    record(
      "J",
      "WhatsApp mock",
      "FAIL",
      e instanceof Error ? e.message : String(e),
      "notifyWhatsApp",
    );
  }
}

await runWhatsApp();

console.log("\n========== MATRIZ FASE 3 ==========\n");
console.log("| ID | Prueba | Resultado | Problema | Corrección |");
console.log("|---|---|---|---|---|");
for (const r of rows.sort((a, b) => a.id.localeCompare(b.id))) {
  const icon =
    r.resultado === "PASS" ? "✅ PASS" : r.resultado === "PARTIAL" ? "⚠️ PARTIAL" : "❌ FAIL";
  console.log(
    `| ${r.id} | ${r.prueba} | ${icon} | ${r.problema.replace(/\|/g, "/")} | ${r.correccion.replace(/\|/g, "/")} |`,
  );
}
const pass = rows.filter((r) => r.resultado === "PASS").length;
const partial = rows.filter((r) => r.resultado === "PARTIAL").length;
const fail = rows.filter((r) => r.resultado === "FAIL").length;
console.log(`\nResumen: ${pass} PASS · ${partial} PARTIAL · ${fail} FAIL\n`);
if (fail > 0) process.exitCode = 1;
