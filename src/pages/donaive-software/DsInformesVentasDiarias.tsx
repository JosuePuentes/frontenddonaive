import { useMemo, useState } from "react";
import { Link } from "react-router";
import { DsBarChart } from "@/components/donaive-software/DsBarChart";
import DsRequirePermission from "@/components/donaive-software/DsRequirePermission";
import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";
import { formatDsNumber } from "@/lib/donaive-software/purchase-draft";
import { buildDailySalesSummary, downloadCsv } from "@/lib/donaive-software/planning";
import { buildYearlySalesReport, salesInClock } from "@/lib/donaive-software/reports";
import { DS_PAYMENT_LABELS } from "@/lib/donaive-software/sales";
import { useDonaiveSoftware } from "@/providers/donaive-software/DonaiveSoftwareProvider";
import type { DsPaymentMethod } from "@/types/donaive-software";

function DsInformesVentasDiariasInner() {
  const { sales } = useDonaiveSoftware();
  const routes = getDonaiveSoftwareRoutes();
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [fromHour, setFromHour] = useState("0");
  const [toHour, setToHour] = useState("23");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [mode, setMode] = useState<"dia" | "horas" | "anio">("dia");

  const hourSales = useMemo(
    () =>
      salesInClock(sales, {
        date,
        fromHour: Number(fromHour),
        toHour: Number(toHour),
      }),
    [sales, date, fromHour, toHour],
  );

  const summary = useMemo(
    () =>
      buildDailySalesSummary(
        mode === "horas" ? hourSales : sales,
        date,
      ),
    [sales, date, mode, hourSales],
  );
  const yearly = useMemo(
    () => buildYearlySalesReport(sales, Number(year)),
    [sales, year],
  );

  return (
    <div>
      <nav className="ds-crumb">
        <Link to={routes.home}>Módulos</Link>
        <span>/</span>
        <Link to={routes.informes}>Informes</Link>
        <span>/</span>
        <span>Ventas diarias</span>
      </nav>

      <section className="ds-panel">
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            gap: "0.75rem",
            alignItems: "flex-end",
          }}
        >
          <div>
            <h1 className="ds-title">Resumen de ventas diarias</h1>
            <p className="ds-lead">
              Tickets, recaudación y productos del día. Solo consulta.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end", flexWrap: "wrap" }}>
            <button
              type="button"
              className={`ds-chip${mode === "dia" ? " ds-chip--active" : ""}`}
              onClick={() => setMode("dia")}
            >
              Día
            </button>
            <button
              type="button"
              className={`ds-chip${mode === "horas" ? " ds-chip--active" : ""}`}
              onClick={() => setMode("horas")}
            >
              Horas
            </button>
            <button
              type="button"
              className={`ds-chip${mode === "anio" ? " ds-chip--active" : ""}`}
              onClick={() => setMode("anio")}
            >
              Año
            </button>
            <label className="ds-label">
              Fecha
              <input
                className="ds-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            {mode === "horas" ? (
              <>
                <label className="ds-label">
                  Desde hora
                  <input
                    className="ds-input"
                    type="number"
                    min={0}
                    max={23}
                    value={fromHour}
                    onChange={(e) => setFromHour(e.target.value)}
                  />
                </label>
                <label className="ds-label">
                  Hasta
                  <input
                    className="ds-input"
                    type="number"
                    min={0}
                    max={23}
                    value={toHour}
                    onChange={(e) => setToHour(e.target.value)}
                  />
                </label>
              </>
            ) : null}
            {mode === "anio" ? (
              <label className="ds-label">
                Año
                <input
                  className="ds-input"
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                />
              </label>
            ) : null}
            <button
              type="button"
              className="ds-btn"
              onClick={() => window.print()}
            >
              Imprimir
            </button>
            <button
              type="button"
              className="ds-btn"
              onClick={() =>
                downloadCsv(
                  `ventas-${mode}.csv`,
                  mode === "anio"
                    ? [
                        "Mes,Tickets,USD",
                        ...yearly.months.map(
                          (m) => `${m.label},${m.tickets},${m.usd.toFixed(2)}`,
                        ),
                      ].join("\n")
                    : [
                        "Fecha,Tickets,USD,Bs,Ticket promedio",
                        `${summary.date},${summary.tickets},${summary.totalUsd.toFixed(2)},${summary.totalBs.toFixed(2)},${summary.avgTicketUsd.toFixed(2)}`,
                      ].join("\n"),
                )
              }
            >
              CSV
            </button>
          </div>
        </div>

        <div
          style={{
            marginTop: "1.25rem",
            display: "grid",
            gap: "0.85rem",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          }}
        >
          <div>
            <div className="ds-muted" style={{ fontSize: "0.75rem" }}>
              Tickets
            </div>
            <div className="ds-stat">{summary.tickets}</div>
          </div>
          <div>
            <div className="ds-muted" style={{ fontSize: "0.75rem" }}>
              Total USD
            </div>
            <div className="ds-stat" style={{ fontSize: "1.15rem" }}>
              ${formatDsNumber(summary.totalUsd, 2)}
            </div>
          </div>
          <div>
            <div className="ds-muted" style={{ fontSize: "0.75rem" }}>
              Total Bs
            </div>
            <div className="ds-stat" style={{ fontSize: "1.15rem" }}>
              {formatDsNumber(summary.totalBs, 2)}
            </div>
          </div>
          <div>
            <div className="ds-muted" style={{ fontSize: "0.75rem" }}>
              Ticket promedio
            </div>
            <div className="ds-stat" style={{ fontSize: "1.15rem" }}>
              ${formatDsNumber(summary.avgTicketUsd, 2)}
            </div>
          </div>
        </div>
      </section>

      <section className="ds-panel" style={{ marginTop: "1rem" }}>
        <DsBarChart
          title="Por método (USD)"
          items={summary.byMethod
            .filter((m) => m.usd > 0)
            .map((m) => ({
              label:
                DS_PAYMENT_LABELS[m.label as DsPaymentMethod] ?? m.label,
              value: m.usd,
            }))}
          formatValue={(n) => `$${formatDsNumber(n, 0)}`}
          emptyText="Sin cobros USD ese día"
        />
      </section>

      <section className="ds-panel" style={{ marginTop: "1rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Top del día</h2>
        {summary.topProducts.length === 0 ? (
          <p className="ds-muted" style={{ marginTop: "0.75rem" }}>
            Sin ventas en esa fecha.
          </p>
        ) : (
          <div style={{ marginTop: "0.75rem", overflowX: "auto" }}>
            <table className="ds-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Unidades</th>
                  <th>Ingreso USD</th>
                </tr>
              </thead>
              <tbody>
                {summary.topProducts.map((p) => (
                  <tr key={p.label}>
                    <td>{p.label}</td>
                    <td>{formatDsNumber(p.qtyBase, 0)}</td>
                    <td>${formatDsNumber(p.revenueUsd, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default function DsInformesVentasDiarias() {
  return (
    <DsRequirePermission permission={["reports.read", "reports.daily", "president.view"]}>
      <DsInformesVentasDiariasInner />
    </DsRequirePermission>
  );
}
