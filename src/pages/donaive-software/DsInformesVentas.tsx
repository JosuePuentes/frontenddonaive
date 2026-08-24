import { useMemo, useState } from "react";
import { Link } from "react-router";
import { DsBarChart } from "@/components/donaive-software/DsBarChart";
import DsRequirePermission from "@/components/donaive-software/DsRequirePermission";
import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";
import { formatDsNumber } from "@/lib/donaive-software/purchase-draft";
import { formatDsMoney } from "@/lib/donaive-software/rates";
import {
  buildSalesReportByKind,
  rangePreset,
  type DateRange,
} from "@/lib/donaive-software/reports";
import { useDonaiveSoftware } from "@/providers/donaive-software/DonaiveSoftwareProvider";

type Preset = "hoy" | "7d" | "30d" | "mes" | "custom";

function DsInformesVentasInner() {
  const { sales } = useDonaiveSoftware();
  const routes = getDonaiveSoftwareRoutes();
  const [preset, setPreset] = useState<Preset>("7d");
  const [saleKind, setSaleKind] = useState<"ALL" | "NORMAL" | "FISCAL">("ALL");
  const initial = rangePreset("7d");
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);

  function applyPreset(p: Preset) {
    setPreset(p);
    if (p === "custom") return;
    const r = rangePreset(p);
    setFrom(r.from);
    setTo(r.to);
  }

  const range: DateRange = useMemo(() => ({ from, to }), [from, to]);
  const report = useMemo(
    () => buildSalesReportByKind(sales, range, saleKind),
    [sales, range, saleKind],
  );

  return (
    <div>
      <nav className="ds-crumb">
        <Link to={routes.home}>Módulos</Link>
        <span>/</span>
        <Link to={routes.informes}>Informes</Link>
        <span>/</span>
        <span>Ventas</span>
      </nav>

      <section className="ds-panel">
        <h1 className="ds-title">Informe de ventas</h1>
        <p className="ds-lead">
          Totales, métodos de pago y productos más vendidos del período.
        </p>

        <div className="ds-chip-row">
          {(
            [
              ["hoy", "Hoy"],
              ["7d", "7 días"],
              ["30d", "30 días"],
              ["mes", "Mes"],
              ["custom", "Personalizado"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`ds-chip${preset === id ? " ds-chip--active" : ""}`}
              onClick={() => applyPreset(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <div style={{ marginTop: "0.85rem" }}>
          <label className="ds-label">
            Tipo de ventas
            <select
              className="ds-input"
              value={saleKind}
              onChange={(e) =>
                setSaleKind(e.target.value as "ALL" | "NORMAL" | "FISCAL")
              }
            >
              <option value="ALL">Todas</option>
              <option value="NORMAL">Solo normales</option>
              <option value="FISCAL">Solo fiscales</option>
            </select>
          </label>
        </div>

        {preset === "custom" ? (
          <div
            style={{
              marginTop: "0.85rem",
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
            }}
          >
            <label className="ds-label">
              Desde
              <input
                className="ds-input"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </label>
            <label className="ds-label">
              Hasta
              <input
                className="ds-input"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </label>
          </div>
        ) : null}

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
            <div className="ds-stat">{report.salesCount}</div>
          </div>
          <div>
            <div className="ds-muted" style={{ fontSize: "0.75rem" }}>
              Total USD
            </div>
            <div className="ds-stat" style={{ fontSize: "1.2rem" }}>
              ${formatDsNumber(report.totalUsd, 2)}
            </div>
          </div>
          <div>
            <div className="ds-muted" style={{ fontSize: "0.75rem" }}>
              Total Bs
            </div>
            <div className="ds-stat" style={{ fontSize: "1.2rem" }}>
              {formatDsNumber(report.totalBs, 2)}
            </div>
          </div>
        </div>
      </section>

      <section className="ds-panel" style={{ marginTop: "1rem" }}>
        <DsBarChart
          title="Ventas por día (USD)"
          items={report.byDay.map((d) => ({
            label: d.date.slice(5),
            value: d.usd,
            secondary: `${d.tickets} tkt`,
          }))}
          formatValue={(n) => `$${formatDsNumber(n, 0)}`}
        />
      </section>

      <section className="ds-panel" style={{ marginTop: "1rem" }}>
        <DsBarChart
          title="Por método de pago (USD cobrado)"
          items={report.byMethod
            .filter((m) => m.usd > 0)
            .map((m) => ({
              label: m.label,
              value: m.usd,
            }))}
          formatValue={(n) => `$${formatDsNumber(n, 0)}`}
          emptyText="Sin cobros en USD en el período"
        />
        <div style={{ marginTop: "1rem" }}>
          <DsBarChart
            title="Por método (Bs cobrado)"
            items={report.byMethod
              .filter((m) => m.bs > 0)
              .map((m) => ({
                label: m.label,
                value: m.bs,
              }))}
            formatValue={(n) => formatDsNumber(n, 0)}
            emptyText="Sin cobros en Bs en el período"
          />
        </div>
      </section>

      <section className="ds-panel" style={{ marginTop: "1rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Top productos</h2>
        {report.topProducts.length === 0 ? (
          <p className="ds-muted" style={{ marginTop: "0.75rem" }}>
            Sin ventas en el período. Prueba el POS.
          </p>
        ) : (
          <div style={{ marginTop: "0.75rem", overflowX: "auto" }}>
            <table className="ds-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Unidades</th>
                  <th>Ingreso</th>
                </tr>
              </thead>
              <tbody>
                {report.topProducts.map((p) => (
                  <tr key={p.productId}>
                    <td>{p.label}</td>
                    <td>{formatDsNumber(p.qtyBase, 0)}</td>
                    <td>
                      {formatDsMoney({ usd: p.revenueUsd, bs: 0 }).split(" ·")[0]}
                    </td>
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

export default function DsInformesVentas() {
  return (
    <DsRequirePermission permission="reports.read">
      <DsInformesVentasInner />
    </DsRequirePermission>
  );
}
