import { useMemo, useState } from "react";
import { Link } from "react-router";
import DsRequirePermission from "@/components/donaive-software/DsRequirePermission";
import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";
import {
  aggregateByMethod,
  expectedCashFromSales,
  methodLabel,
  salesForDate,
} from "@/lib/donaive-software/closures";
import { formatDsNumber } from "@/lib/donaive-software/purchase-draft";
import { formatDsMoney } from "@/lib/donaive-software/rates";
import { useDonaiveSoftware } from "@/providers/donaive-software/DonaiveSoftwareProvider";

function DsPosCierresInner() {
  const { sales, closures, currentUser, createCashClosure, rates } =
    useDonaiveSoftware();
  const routes = getDonaiveSoftwareRoutes();

  const today = new Date().toISOString().slice(0, 10);
  const [countedUsd, setCountedUsd] = useState("");
  const [countedBs, setCountedBs] = useState("");
  const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState("");

  const scoped = useMemo(() => {
    const opId =
      currentUser?.role === "cajero" ? currentUser.id : undefined;
    return salesForDate(sales, today, { operatorId: opId });
  }, [sales, today, currentUser]);

  const byMethod = useMemo(() => aggregateByMethod(scoped), [scoped]);
  const expected = useMemo(() => expectedCashFromSales(scoped), [scoped]);

  const dayTotals = useMemo(() => {
    let usd = 0;
    let bs = 0;
    for (const s of scoped) {
      usd += s.totalUsd;
      bs += s.totalBs;
    }
    return { usd, bs };
  }, [scoped]);

  function runClosure() {
    const r = createCashClosure({
      countedCashUsd: Number(countedUsd) || 0,
      countedCashBs: Number(countedBs) || 0,
      notes,
      date: today,
    });
    if (!r.ok) {
      setMsg(r.error);
      return;
    }
    setMsg(
      `Cierre guardado · diff USD ${formatDsNumber(r.closure.diffUsd, 2)} · Bs ${formatDsNumber(r.closure.diffBs, 2)}`,
    );
    setCountedUsd("");
    setCountedBs("");
    setNotes("");
  }

  return (
    <div>
      <nav className="ds-crumb">
        <Link to={routes.home}>Módulos</Link>
        <span>/</span>
        <Link to={routes.pos}>Punto de venta</Link>
        <span>/</span>
        <span>Cierres</span>
      </nav>

      <section className="ds-panel">
        <h1 className="ds-title">Cierre de caja</h1>
        <p className="ds-lead">
          Ventas de hoy ({today}). Efectivo esperado vs contado. BCV{" "}
          {formatDsNumber(rates.bcv, 2)}.
        </p>

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
            <div className="ds-stat">{scoped.length}</div>
          </div>
          <div>
            <div className="ds-muted" style={{ fontSize: "0.75rem" }}>
              Total ventas
            </div>
            <div className="ds-stat" style={{ fontSize: "1.1rem" }}>
              {formatDsMoney({ usd: dayTotals.usd, bs: dayTotals.bs })}
            </div>
          </div>
          <div>
            <div className="ds-muted" style={{ fontSize: "0.75rem" }}>
              Efectivo USD esp.
            </div>
            <div className="ds-stat" style={{ fontSize: "1.1rem" }}>
              ${formatDsNumber(expected.usd, 2)}
            </div>
          </div>
          <div>
            <div className="ds-muted" style={{ fontSize: "0.75rem" }}>
              Efectivo Bs esp.
            </div>
            <div className="ds-stat" style={{ fontSize: "1.1rem" }}>
              {formatDsNumber(expected.bs, 2)}
            </div>
          </div>
        </div>
      </section>

      <section className="ds-panel" style={{ marginTop: "1rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Por método de pago</h2>
        {Object.keys(byMethod).length === 0 ? (
          <p className="ds-muted" style={{ marginTop: "0.75rem" }}>
            Sin ventas hoy.
          </p>
        ) : (
          <div style={{ marginTop: "0.75rem", overflowX: "auto" }}>
            <table className="ds-table">
              <thead>
                <tr>
                  <th>Método</th>
                  <th>USD</th>
                  <th>Bs</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(byMethod).map(([code, v]) => (
                  <tr key={code}>
                    <td>{methodLabel(code)}</td>
                    <td>{formatDsNumber(v.usd, 2)}</td>
                    <td>{formatDsNumber(v.bs, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="ds-panel" style={{ marginTop: "1rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Contar efectivo</h2>
        <div
          style={{
            marginTop: "0.85rem",
            display: "grid",
            gap: "0.85rem",
            maxWidth: 360,
          }}
        >
          <label className="ds-label">
            Efectivo USD contado
            <input
              className="ds-input"
              type="number"
              step="0.01"
              value={countedUsd}
              onChange={(e) => setCountedUsd(e.target.value)}
              placeholder={String(expected.usd)}
            />
          </label>
          <label className="ds-label">
            Efectivo Bs contado
            <input
              className="ds-input"
              type="number"
              step="0.01"
              value={countedBs}
              onChange={(e) => setCountedBs(e.target.value)}
              placeholder={String(expected.bs)}
            />
          </label>
          <label className="ds-label">
            Notas
            <input
              className="ds-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="ds-btn ds-btn--primary"
            onClick={runClosure}
          >
            Guardar cierre del día
          </button>
        </div>
        {msg ? (
          <p
            style={{
              marginTop: "0.85rem",
              color: msg.includes("guardado")
                ? "var(--ds-ok)"
                : "var(--ds-danger)",
            }}
          >
            {msg}
          </p>
        ) : null}
      </section>

      {closures.length > 0 ? (
        <section className="ds-panel" style={{ marginTop: "1rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.05rem" }}>
            Cierres anteriores
          </h2>
          <div style={{ marginTop: "0.75rem" }}>
            {closures.slice(0, 10).map((c) => (
              <div key={c.id} className="ds-line-row">
                <div>
                  <strong>{c.date}</strong>
                  <div className="ds-muted" style={{ fontSize: "0.8rem" }}>
                    {c.salesCount} ventas · {c.createdBy ?? "—"}
                  </div>
                </div>
                <div style={{ textAlign: "right", fontSize: "0.9rem" }}>
                  Diff USD {formatDsNumber(c.diffUsd, 2)}
                  <br />
                  Diff Bs {formatDsNumber(c.diffBs, 2)}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div style={{ marginTop: "1rem" }}>
        <Link className="ds-btn" to={routes.posVender}>
          ← Volver a vender
        </Link>
      </div>
    </div>
  );
}

export default function DsPosCierres() {
  return (
    <DsRequirePermission permission="pos.closures">
      <DsPosCierresInner />
    </DsRequirePermission>
  );
}
