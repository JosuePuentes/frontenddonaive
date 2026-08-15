import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { AD_LICORERIA_ROUTES } from "@/constants/ad-licoreria-routes";
import {
  AD_REPORT_PRESET_LABELS,
  rangeForPreset,
  type AdReportPreset,
} from "@/lib/ad-licoreria/report-presets";
import { isAdApiDataSource } from "@/services/ad-licoreria/data-source";
import { adFinanceClient } from "@/services/ad-licoreria/finance-client";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";

type Dash = Record<string, unknown>;

function MetricCard(props: {
  label: string;
  value: string;
  hint?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className="ad-panel text-left transition hover:brightness-110"
      onClick={props.onClick}
      disabled={!props.onClick}
    >
      <div className="text-xs uppercase tracking-wide text-[var(--ad-muted)]">
        {props.label}
      </div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{props.value}</div>
      {props.hint ? (
        <div className="mt-1 text-[11px] text-[var(--ad-muted)]">{props.hint}</div>
      ) : null}
    </button>
  );
}

function n(v: unknown): number {
  return typeof v === "number" ? v : Number(v ?? 0);
}

/**
 * Dashboard F8 — solo lectura. API agregada o resumen MOCK local.
 */
export default function AdLicoreriaFinanzas() {
  const { hasPermission, sales, products } = useAdLicoreria();
  const canView =
    hasPermission("finance.dashboard.view") ||
    hasPermission("finance.view") ||
    hasPermission("reports.read");

  const [preset, setPreset] = useState<AdReportPreset>("hoy");
  const [from, setFrom] = useState(rangeForPreset("hoy").from);
  const [to, setTo] = useState(rangeForPreset("hoy").to);
  const [currency, setCurrency] = useState<"USD" | "BS">("USD");
  const [data, setData] = useState<Dash | null>(null);
  const [drill, setDrill] = useState<{
    section: string;
    items: unknown[];
  } | null>(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const apiMode = isAdApiDataSource();

  const mockSummary = useMemo(() => {
    if (apiMode) return null;
    const filtered = sales.filter((s) => {
      const d = s.createdAt.slice(0, 10);
      return (
        s.status === "completed" &&
        (!from || d >= from) &&
        (!to || d <= to)
      );
    });
    const salesUsd = filtered.reduce((a, s) => a + s.total.usd, 0);
    const salesBs = filtered.reduce((a, s) => a + s.total.bs, 0);
    const units = filtered.reduce(
      (a, s) => a + s.items.reduce((x, i) => x + i.qty, 0),
      0,
    );
    let cost = 0;
    for (const s of filtered) {
      for (const it of s.items) {
        const p = products.find((x) => x.id === it.productId);
        cost += (p?.cost?.usd ?? 0) * it.qtyBase;
      }
    }
    return {
      period: { fromDate: from, toDate: to, bcvRate: null, timezone: "local" },
      executive: {
        salesTotalUsd: salesUsd,
        salesTotalBs: salesBs,
        salesCount: filtered.length,
        ticketAvgUsd: filtered.length ? salesUsd / filtered.length : 0,
        unitsSold: units,
        estimatedProfitUsd: salesUsd - cost,
        marginPct: salesUsd ? ((salesUsd - cost) / salesUsd) * 100 : 0,
        purchasesUsd: 0,
        expenses: 0,
        cxpPending: 0,
        cxpCollected: 0,
        netFlow: 0,
        financialBalanceUsd: 0,
        financialBalanceBs: 0,
      },
      mock: true,
    } as Dash;
  }, [apiMode, sales, products, from, to]);

  const load = useCallback(async () => {
    if (!canView) return;
    if (!apiMode) {
      setData(mockSummary);
      return;
    }
    setLoading(true);
    const qs = new URLSearchParams({
      preset,
      displayCurrency: currency,
    });
    if (preset === "personalizado") {
      qs.set("from", from);
      qs.set("to", to);
    }
    const r = await adFinanceClient.getDashboard(`?${qs.toString()}`);
    setLoading(false);
    if (!r.ok) {
      setMsg(r.error);
      return;
    }
    setData(r.data);
    setMsg("");
  }, [apiMode, canView, preset, currency, from, to, mockSummary]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (preset === "personalizado") return;
    const r = rangeForPreset(preset);
    setFrom(r.from);
    setTo(r.to);
  }, [preset]);

  async function openDrill(section: string) {
    if (!apiMode) {
      setMsg("Drill-down completo disponible en modo API");
      return;
    }
    const qs = new URLSearchParams({
      section,
      from,
      to,
      limit: "60",
    });
    const r = await adFinanceClient.drillDashboard(`?${qs.toString()}`);
    if (!r.ok) {
      setMsg(r.error);
      return;
    }
    setDrill(r.data);
  }

  if (!canView) {
    return (
      <p className="text-sm text-[var(--ad-muted)]">
        Sin permiso finance.dashboard.view
      </p>
    );
  }

  const ex = (data?.executive ?? {}) as Record<string, number>;
  const period = (data?.period ?? {}) as Record<string, unknown>;
  const comparison = (data?.comparison ?? {}) as Record<
    string,
    { current?: number; previous?: number; pct?: number | null }
  >;
  const banks = (data?.banks ?? {}) as {
    balancesByCurrency?: { USD: number; BS: number };
    accounts?: { id: string; name: string; currency: string; balance: number }[];
  };
  const top = (data?.topProducts ?? {}) as {
    byUnits?: { name: string; units: number }[];
    byProfit?: { name: string; profitUsd: number }[];
  };
  const warehouses = (data?.warehouses ?? []) as {
    name: string;
    salesUsd: number;
    stockUnits: number;
  }[];
  const exchange = (data?.exchange ?? {}) as {
    operations?: unknown[];
    count?: number;
  };
  const inventory = (data?.inventory ?? {}) as Record<string, number>;
  const purchases = (data?.purchases ?? {}) as Record<string, number>;
  const expenses = (data?.expenses ?? {}) as Record<string, number>;
  const profitability = (data?.profitability ?? {}) as Record<string, unknown>;

  return (
    <div className="space-y-5 pb-16">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[var(--ad-ink)]">
            Finanzas · Dashboard
          </h1>
          <p className="text-sm text-[var(--ad-muted)]">
            Solo lectura · CPP histórico ≠ costo de reposición ·{" "}
            {apiMode ? "API" : "MOCK"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link className="ad-btn" to={AD_LICORERIA_ROUTES.bancos}>
            Bancos
          </Link>
          <Link className="ad-btn" to={AD_LICORERIA_ROUTES.movimientos}>
            Movimientos
          </Link>
          <Link className="ad-btn" to={AD_LICORERIA_ROUTES.casaCambio}>
            Casa de Cambio
          </Link>
        </div>
      </div>

      <section className="ad-panel flex flex-wrap items-end gap-3">
        <label className="text-sm">
          Período
          <select
            className="ad-input mt-1"
            value={preset}
            onChange={(e) => setPreset(e.target.value as AdReportPreset)}
          >
            {(Object.keys(AD_REPORT_PRESET_LABELS) as AdReportPreset[]).map(
              (k) => (
                <option key={k} value={k}>
                  {AD_REPORT_PRESET_LABELS[k]}
                </option>
              ),
            )}
          </select>
        </label>
        <label className="text-sm">
          Desde
          <input
            className="ad-input mt-1"
            type="date"
            value={from}
            onChange={(e) => {
              setPreset("personalizado");
              setFrom(e.target.value);
            }}
          />
        </label>
        <label className="text-sm">
          Hasta
          <input
            className="ad-input mt-1"
            type="date"
            value={to}
            onChange={(e) => {
              setPreset("personalizado");
              setTo(e.target.value);
            }}
          />
        </label>
        <label className="text-sm">
          Moneda vista
          <select
            className="ad-input mt-1"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as "USD" | "BS")}
          >
            <option value="USD">USD</option>
            <option value="BS">Bs</option>
          </select>
        </label>
        <button type="button" className="ad-btn" onClick={() => void load()}>
          Actualizar
        </button>
        <div className="text-xs text-[var(--ad-muted)]">
          {String(period.fromDate ?? from)} → {String(period.toDate ?? to)}
          {period.bcvRate != null ? ` · BCV ${String(period.bcvRate)}` : ""}
          {period.timezone ? ` · ${String(period.timezone)}` : ""}
        </div>
      </section>

      {loading && <p className="text-sm">Cargando…</p>}

      <section>
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-[var(--ad-muted)]">
          Resumen ejecutivo
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Ventas USD"
            value={n(ex.salesTotalUsd).toFixed(2)}
            onClick={() => void openDrill("sales")}
          />
          <MetricCard
            label="Ventas Bs"
            value={n(ex.salesTotalBs).toFixed(0)}
            onClick={() => void openDrill("sales")}
          />
          <MetricCard
            label="# Ventas"
            value={String(n(ex.salesCount))}
            onClick={() => void openDrill("sales")}
          />
          <MetricCard
            label="Ticket promedio USD"
            value={n(ex.ticketAvgUsd).toFixed(2)}
          />
          <MetricCard label="Unidades" value={n(ex.unitsSold).toFixed(1)} />
          <MetricCard
            label="Utilidad est. (CPP hist.)"
            value={n(ex.estimatedProfitUsd).toFixed(2)}
            hint="No usa costo de reposición"
            onClick={() => void openDrill("profitability")}
          />
          <MetricCard
            label="Margen %"
            value={`${n(ex.marginPct).toFixed(1)}%`}
          />
          <MetricCard
            label="Compras USD"
            value={n(ex.purchasesUsd).toFixed(2)}
            onClick={() => void openDrill("purchases")}
          />
          <MetricCard
            label="Gastos"
            value={n(ex.expenses).toFixed(2)}
            onClick={() => void openDrill("expenses")}
          />
          <MetricCard
            label="CxP pendiente"
            value={n(ex.cxpPending).toFixed(2)}
            onClick={() => void openDrill("purchases")}
          />
          <MetricCard
            label="Cobros CxP"
            value={n(ex.cxpCollected).toFixed(2)}
          />
          <MetricCard
            label="Flujo neto"
            value={n(ex.netFlow).toFixed(2)}
            hint="Ingresos − egresos del período"
            onClick={() => void openDrill("banks")}
          />
          <MetricCard
            label="Saldo fin. USD"
            value={n(ex.financialBalanceUsd).toFixed(2)}
            hint="No es utilidad"
          />
          <MetricCard
            label="Saldo fin. Bs"
            value={n(ex.financialBalanceBs).toFixed(0)}
          />
        </div>
      </section>

      {apiMode && (
        <>
          <section className="grid gap-4 lg:grid-cols-2">
            <div className="ad-panel space-y-2">
              <h2 className="font-medium">Comparativo vs período anterior</h2>
              <ul className="space-y-1 text-sm tabular-nums">
                {(["salesUsd", "units", "purchases", "expenses"] as const).map(
                  (k) => (
                    <li key={k}>
                      {k}: {n(comparison[k]?.current).toFixed(2)} (
                      {comparison[k]?.pct == null
                        ? "—"
                        : `${n(comparison[k]?.pct).toFixed(1)}%`}
                      )
                    </li>
                  ),
                )}
              </ul>
            </div>
            <div className="ad-panel space-y-2">
              <h2 className="font-medium">Rentabilidad</h2>
              <p className="text-sm">
                Costo histórico vendido:{" "}
                <strong className="tabular-nums">
                  {n(profitability.historicalCostUsd).toFixed(2)}
                </strong>
              </p>
              <p className="text-xs text-[var(--ad-muted)]">
                {(profitability.distinction as { cppHistorico?: string })
                  ?.cppHistorico ?? ""}
              </p>
              <button
                type="button"
                className="ad-btn"
                onClick={() => void openDrill("profitability")}
              >
                Ver detalle
              </button>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="ad-panel space-y-2">
              <h2 className="font-medium">Bancos (saldos actuales)</h2>
              <p className="text-sm tabular-nums">
                USD {n(banks.balancesByCurrency?.USD).toFixed(2)} · Bs{" "}
                {n(banks.balancesByCurrency?.BS).toFixed(0)}
              </p>
              <ul className="max-h-40 space-y-1 overflow-auto text-sm">
                {(banks.accounts ?? []).map((a) => (
                  <li key={a.id}>
                    <Link
                      className="underline"
                      to={`${AD_LICORERIA_ROUTES.movimientos}`}
                    >
                      {a.name}
                    </Link>{" "}
                    · {a.currency} {a.balance.toFixed(2)}
                  </li>
                ))}
              </ul>
            </div>
            <div className="ad-panel space-y-2">
              <h2 className="font-medium">Casa de Cambio</h2>
              <p className="text-sm">{n(exchange.count)} conversiones</p>
              <button
                type="button"
                className="ad-btn"
                onClick={() => void openDrill("exchange")}
              >
                Ver operaciones
              </button>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <div className="ad-panel space-y-1 text-sm">
              <h2 className="font-medium">Compras</h2>
              <p>Total USD {n(purchases.totalUsd).toFixed(2)}</p>
              <p>Contado {n(purchases.contado).toFixed(2)}</p>
              <p>Crédito {n(purchases.credito).toFixed(2)}</p>
              <p>IVA {n(purchases.tax).toFixed(2)}</p>
              <p>CxP pend. {n(purchases.cxpPending).toFixed(2)}</p>
            </div>
            <div className="ad-panel space-y-1 text-sm">
              <h2 className="font-medium">Gastos</h2>
              <p>Total {n(expenses.total).toFixed(2)}</p>
              <p>Gastos {n(expenses.gastos).toFixed(2)}</p>
              <p>Retiros {n(expenses.retiros).toFixed(2)}</p>
            </div>
            <div className="ad-panel space-y-1 text-sm">
              <h2 className="font-medium">Inventario</h2>
              <p>Físico {n(inventory.physicalTotal).toFixed(1)}</p>
              <p>Disponible {n(inventory.availableTotal).toFixed(1)}</p>
              <p>Comprometido {n(inventory.committedTotal).toFixed(1)}</p>
              <p>Déficit {n(inventory.deficit).toFixed(1)}</p>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="ad-panel">
              <h2 className="mb-2 font-medium">Top por unidades</h2>
              <ul className="max-h-48 space-y-1 overflow-auto text-sm">
                {(top.byUnits ?? []).map((p, i) => (
                  <li key={`${p.name}-${i}`}>
                    {p.name} · {p.units.toFixed(1)} u
                  </li>
                ))}
              </ul>
            </div>
            <div className="ad-panel">
              <h2 className="mb-2 font-medium">Top por utilidad</h2>
              <ul className="max-h-48 space-y-1 overflow-auto text-sm">
                {(top.byProfit ?? []).map((p, i) => (
                  <li key={`${p.name}-${i}`}>
                    {p.name} · {p.profitUsd.toFixed(2)}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="ad-panel">
            <h2 className="mb-2 font-medium">Depósitos</h2>
            <table className="ad-table w-full text-sm">
              <thead>
                <tr>
                  <th>Depósito</th>
                  <th>Ventas USD</th>
                  <th>Stock u.</th>
                </tr>
              </thead>
              <tbody>
                {warehouses.map((w) => (
                  <tr key={w.name}>
                    <td>{w.name}</td>
                    <td className="tabular-nums">{w.salesUsd.toFixed(2)}</td>
                    <td className="tabular-nums">{w.stockUnits.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}

      {drill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="ad-panel max-h-[85vh] w-full max-w-3xl space-y-3 overflow-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">Detalle · {drill.section}</h2>
              <button
                type="button"
                className="ad-btn"
                onClick={() => setDrill(null)}
              >
                Cerrar
              </button>
            </div>
            <pre className="overflow-auto text-xs">
              {JSON.stringify(drill.items, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {msg && <p className="text-sm">{msg}</p>}
    </div>
  );
}
