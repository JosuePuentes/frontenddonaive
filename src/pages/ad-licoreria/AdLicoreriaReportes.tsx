import { useMemo, useState } from "react";
import {
  AD_REPORT_PRESET_LABELS,
  inDateRange,
  rangeForPreset,
  type AdReportPreset,
} from "@/lib/ad-licoreria/report-presets";
import { prepaidAvailable } from "@/lib/ad-licoreria/conversions";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";

const PRESETS = Object.keys(AD_REPORT_PRESET_LABELS) as AdReportPreset[];

export default function AdLicoreriaReportes() {
  const {
    sales,
    movements,
    accounts,
    prepaids,
    products,
    presentations,
    categories,
    operators,
    inventory,
    customers,
    warehouses,
    tables,
    purchases,
    audit,
    dailyClosures,
    inventoryClosures,
    settings,
  } = useAdLicoreria();

  const [preset, setPreset] = useState<AdReportPreset>("hoy");
  const initial = rangeForPreset("hoy");
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [categoryId, setCategoryId] = useState("");
  const [mesonera, setMesonera] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [operatorId, setOperatorId] = useState("");
  const [cashierId, setCashierId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [productId, setProductId] = useState("");

  function applyPreset(p: AdReportPreset) {
    setPreset(p);
    if (p === "personalizado") return;
    const r = rangeForPreset(p);
    setFrom(r.from);
    setTo(r.to);
  }

  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      if (!inDateRange(s.createdAt, from, to)) return false;
      if (warehouseId && s.warehouseId !== warehouseId) return false;
      if (operatorId && s.operatorId !== operatorId) return false;
      if (
        cashierId &&
        s.operatorId !== cashierId &&
        s.userName !==
          operators.find((o) => o.id === cashierId)?.name
      ) {
        return false;
      }
      if (customerId && s.customerId !== customerId) return false;
      if (mesonera && (s.mesoneraName ?? s.userName) !== mesonera) return false;
      if (productId) {
        if (!s.items.some((it) => it.productId === productId)) return false;
      }
      if (categoryId) {
        const ok = s.items.some((it) => {
          const p = products.find((x) => x.id === it.productId);
          return p?.categoryId === categoryId;
        });
        if (!ok) return false;
      }
      return true;
    });
  }, [
    sales,
    from,
    to,
    mesonera,
    categoryId,
    products,
    warehouseId,
    operatorId,
    cashierId,
    customerId,
    productId,
    operators,
  ]);

  const completed = filteredSales.filter((s) => s.status === "completed");
  const voided = filteredSales.filter((s) => s.status === "voided");

  const byMethod = useMemo(() => {
    const map = new Map<string, { usd: number; bs: number }>();
    for (const s of completed) {
      for (const p of s.payments) {
        const cur = map.get(p.method) ?? { usd: 0, bs: 0 };
        if (p.currency === "USD") cur.usd += p.amount;
        else cur.bs += p.amount;
        map.set(p.method, cur);
      }
    }
    return [...map.entries()];
  }, [completed]);

  const byProduct = useMemo(() => {
    const map = new Map<string, { qty: number; usd: number; cost: number }>();
    for (const s of completed) {
      for (const it of s.items) {
        const prod = products.find((p) => p.id === it.productId);
        const cur = map.get(it.productId) ?? { qty: 0, usd: 0, cost: 0 };
        cur.qty += it.qtyBase;
        cur.usd += it.unitPrice.usd * it.qty;
        cur.cost += (prod?.cost.usd ?? 0) * it.qtyBase;
        map.set(it.productId, cur);
      }
    }
    return [...map.entries()]
      .map(([id, v]) => ({
        name: products.find((p) => p.id === id)?.name ?? id,
        ...v,
        margin: v.usd - v.cost,
      }))
      .sort((a, b) => b.usd - a.usd);
  }, [completed, products]);

  const byPresentation = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of completed) {
      for (const it of s.items) {
        map.set(it.presentationId, (map.get(it.presentationId) ?? 0) + it.qty);
      }
    }
    return [...map.entries()]
      .map(([id, qty]) => ({
        name: presentations.find((p) => p.id === id)?.name ?? id,
        qty,
      }))
      .sort((a, b) => b.qty - a.qty);
  }, [completed, presentations]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of completed) {
      for (const it of s.items) {
        const cat = products.find((p) => p.id === it.productId)?.categoryId;
        if (!cat) continue;
        map.set(cat, (map.get(cat) ?? 0) + it.unitPrice.usd * it.qty);
      }
    }
    return [...map.entries()]
      .map(([id, usd]) => ({
        name: categories.find((c) => c.id === id)?.name ?? id,
        usd,
      }))
      .sort((a, b) => b.usd - a.usd);
  }, [completed, products, categories]);

  const byMesonera = useMemo(() => {
    const map = new Map<string, { count: number; usd: number }>();
    for (const s of completed) {
      const name = s.mesoneraName ?? s.userName;
      const cur = map.get(name) ?? { count: 0, usd: 0 };
      cur.count += 1;
      cur.usd += s.total.usd;
      map.set(name, cur);
    }
    return [...map.entries()].sort((a, b) => b[1].usd - a[1].usd);
  }, [completed]);

  const byTable = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of completed) {
      const key = s.tableId
        ? (tables.find((t) => t.id === s.tableId)?.number ?? s.tableId)
        : "sin-mesa";
      map.set(key, (map.get(key) ?? 0) + s.total.usd);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [completed, tables]);

  const byCustomer = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of completed) {
      const key = s.customerName ?? "Mostrador";
      map.set(key, (map.get(key) ?? 0) + s.total.usd);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [completed]);

  const movFiltered = movements.filter((m) =>
    inDateRange(m.createdAt, from, to),
  );
  const transfers = movFiltered.filter((m) =>
    m.type.startsWith("TRASLADO"),
  );
  const adjustments = movFiltered.filter((m) =>
    m.type.startsWith("AJUSTE") || m.type === "DEVOLUCION",
  );
  const purchasesFiltered = purchases.filter((p) =>
    inDateRange(p.createdAt, from, to),
  );
  const auditFiltered = audit.filter((a) => inDateRange(a.createdAt, from, to));
  const discounts = completed.reduce((a, s) => a + s.discountUsd, 0);
  const openAccounts = accounts.filter(
    (a) =>
      a.status === "ABIERTA" ||
      a.status === "PREPAGADA" ||
      a.status === "PARCIALMENTE_PAGADA",
  );
  const closedAccounts = accounts.filter(
    (a) =>
      a.status === "CERRADA" &&
      a.closedAt &&
      inDateRange(a.closedAt, from, to),
  );
  const pendingMerch = openAccounts.reduce(
    (acc, a) =>
      acc + a.items.reduce((x, i) => x + Math.max(0, i.qty - i.qtyServed), 0),
    0,
  );
  const prepaidActiveUnits = prepaids
    .filter((p) => p.status === "ACTIVO")
    .reduce(
      (a, p) =>
        a +
        p.items.reduce(
          (x, i) => x + prepaidAvailable(i.qtyPurchased, i.qtyConsumed),
          0,
        ),
      0,
    );
  const lastDaily = dailyClosures[0];
  const lastInv = inventoryClosures[0];
  const lowStock = products.filter((p) => {
    const qty = inventory
      .filter((i) => i.productId === p.id)
      .reduce((a, i) => a + i.qtyBase, 0);
    return qty < p.minStockBase;
  });
  const marginTotal = byProduct.reduce((a, p) => a + p.margin, 0);
  const mesoneras = operators.filter((o) => o.role === "mesonera");
  const cajeros = operators.filter((o) => o.role === "cajero");
  const totalUsd = completed.reduce((a, s) => a + s.total.usd, 0);
  const collectedUsd = completed.reduce(
    (a, s) =>
      a +
      s.payments
        .filter((p) => p.currency === "USD")
        .reduce((x, p) => x + p.amount, 0),
    0,
  );
  const collectedBs = completed.reduce(
    (a, s) =>
      a +
      s.payments
        .filter((p) => p.currency === "BS")
        .reduce((x, p) => x + p.amount, 0),
    0,
  );

  return (
    <div className="space-y-5">
      <p className="text-sm text-[var(--ad-muted)]">
        Reportes derivados del repositorio mock. Tasa referencia:{" "}
        {settings.exchangeRateUsdToBs} (no fuerza precios).
      </p>

      <section className="ad-panel space-y-3">
        <h2 className="ad-panel-title">Filtro de período</h2>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((id) => (
            <button
              key={id}
              type="button"
              className={`ad-btn ${preset === id ? "ad-btn--gold" : ""}`}
              onClick={() => applyPreset(id)}
            >
              {AD_REPORT_PRESET_LABELS[id]}
            </button>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <input
            className="ad-input"
            type="date"
            value={from}
            onChange={(e) => {
              setPreset("personalizado");
              setFrom(e.target.value);
            }}
          />
          <input
            className="ad-input"
            type="date"
            value={to}
            onChange={(e) => {
              setPreset("personalizado");
              setTo(e.target.value);
            }}
          />
          <select
            className="ad-select"
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
          >
            <option value="">Todos los depósitos</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.code})
              </option>
            ))}
          </select>
          <select
            className="ad-select"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            className="ad-select"
            value={mesonera}
            onChange={(e) => setMesonera(e.target.value)}
          >
            <option value="">Todas las mesoneras</option>
            {mesoneras.map((m) => (
              <option key={m.id} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
          <select
            className="ad-select"
            value={cashierId}
            onChange={(e) => setCashierId(e.target.value)}
          >
            <option value="">Todos los cajeros</option>
            {cajeros.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            className="ad-select"
            value={operatorId}
            onChange={(e) => setOperatorId(e.target.value)}
          >
            <option value="">Todos los usuarios</option>
            {operators.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
          <select
            className="ad-select"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
          >
            <option value="">Todos los clientes</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            className="ad-select"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          >
            <option value="">Todos los productos</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="ad-panel space-y-3">
        <h2 className="ad-panel-title">Resumen operativo</h2>
        <div className="ad-grid-stats">
          <div className="ad-stat">
            <div className="ad-stat__value">{completed.length}</div>
            <div className="ad-stat__label">Ventas</div>
          </div>
          <div className="ad-stat">
            <div className="ad-stat__value">${totalUsd.toFixed(0)}</div>
            <div className="ad-stat__label">Vendido USD</div>
          </div>
          <div className="ad-stat">
            <div className="ad-stat__value">${collectedUsd.toFixed(0)}</div>
            <div className="ad-stat__label">Cobrado USD</div>
          </div>
          <div className="ad-stat">
            <div className="ad-stat__value">
              {collectedBs.toLocaleString("es-VE")}
            </div>
            <div className="ad-stat__label">Cobrado Bs</div>
          </div>
          <div className="ad-stat">
            <div className="ad-stat__value">{openAccounts.length}</div>
            <div className="ad-stat__label">Cuentas abiertas</div>
          </div>
          <div className="ad-stat">
            <div className="ad-stat__value">{closedAccounts.length}</div>
            <div className="ad-stat__label">Cuentas cerradas</div>
          </div>
          <div className="ad-stat">
            <div className="ad-stat__value">{voided.length}</div>
            <div className="ad-stat__label">Anulaciones</div>
          </div>
          <div className="ad-stat">
            <div className="ad-stat__value">${discounts.toFixed(0)}</div>
            <div className="ad-stat__label">Descuentos</div>
          </div>
          <div className="ad-stat">
            <div className="ad-stat__value">{pendingMerch}</div>
            <div className="ad-stat__label">Mercancía pendiente</div>
          </div>
          <div className="ad-stat">
            <div className="ad-stat__value">{prepaidActiveUnits}</div>
            <div className="ad-stat__label">Prepago disponible</div>
          </div>
          <div className="ad-stat">
            <div className="ad-stat__value">${marginTotal.toFixed(0)}</div>
            <div className="ad-stat__label">Margen estimado</div>
          </div>
          <div className="ad-stat">
            <div className="ad-stat__value">{lowStock.length}</div>
            <div className="ad-stat__label">Stock crítico</div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="ad-panel">
          <h2 className="ad-panel-title">Métodos de pago</h2>
          <ul className="space-y-1 text-sm text-[var(--ad-muted)]">
            {byMethod.map(([m, v]) => (
              <li key={m}>
                {m}: ${v.usd.toFixed(2)} · Bs {v.bs.toLocaleString("es-VE")}
              </li>
            ))}
            {!byMethod.length ? <li>Sin datos</li> : null}
          </ul>
          {lastDaily ? (
            <p className="mt-3 text-xs text-[var(--ad-muted)]">
              Último cierre caja {lastDaily.date}: esperado USD{" "}
              {lastDaily.expectedCashUsd} / contado {lastDaily.countedCashUsd} ·
              dif {lastDaily.cashDifferenceUsd}
            </p>
          ) : null}
        </section>
        <section className="ad-panel">
          <h2 className="ad-panel-title">Mesoneras / mesas / clientes</h2>
          <ul className="space-y-1 text-sm text-[var(--ad-muted)]">
            {byMesonera.slice(0, 5).map(([n, v]) => (
              <li key={n}>
                {n}: {v.count} · ${v.usd.toFixed(2)}
              </li>
            ))}
            {byTable.slice(0, 4).map(([n, usd]) => (
              <li key={`t-${n}`}>
                Mesa {n}: ${usd.toFixed(2)}
              </li>
            ))}
            {byCustomer.slice(0, 4).map(([n, usd]) => (
              <li key={`c-${n}`}>
                {n}: ${usd.toFixed(2)}
              </li>
            ))}
          </ul>
        </section>
        <section className="ad-panel">
          <h2 className="ad-panel-title">Productos / presentaciones / categorías</h2>
          <ul className="space-y-1 text-sm text-[var(--ad-muted)]">
            {byProduct.slice(0, 5).map((r) => (
              <li key={r.name}>
                {r.name}: {r.qty} u. · ${r.usd.toFixed(2)} · margen $
                {r.margin.toFixed(2)}
              </li>
            ))}
            {byPresentation.slice(0, 4).map((r) => (
              <li key={r.name}>
                Pres. {r.name}: {r.qty}
              </li>
            ))}
            {byCategory.slice(0, 4).map((r) => (
              <li key={r.name}>
                Cat. {r.name}: ${r.usd.toFixed(2)}
              </li>
            ))}
          </ul>
        </section>
        <section className="ad-panel">
          <h2 className="ad-panel-title">Inventario / compras / auditoría</h2>
          <ul className="space-y-1 text-sm text-[var(--ad-muted)]">
            {warehouses.map((w) => (
              <li key={w.id}>
                {w.name}:{" "}
                {inventory
                  .filter((i) => i.warehouseId === w.id)
                  .reduce((a, i) => a + i.qtyBase, 0)}{" "}
                u.
              </li>
            ))}
            <li>Traslados (período): {transfers.length}</li>
            <li>Ajustes/devoluciones: {adjustments.length}</li>
            <li>Compras: {purchasesFiltered.length}</li>
            <li>
              Diff inventario (último):{" "}
              {lastInv
                ? lastInv.lines.filter((l) => l.differenceBase !== 0).length
                : 0}
            </li>
            <li>Eventos auditoría: {auditFiltered.length}</li>
            <li>Clientes totales: {customers.length}</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
