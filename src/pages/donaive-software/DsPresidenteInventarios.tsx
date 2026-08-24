import { useMemo, useState } from "react";
import { Link } from "react-router";
import DsRequirePermission from "@/components/donaive-software/DsRequirePermission";
import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";
import { formatDsNumber } from "@/lib/donaive-software/purchase-draft";
import { buildInventoryReport, buildInventoryReportFromStock } from "@/lib/donaive-software/reports";
import { useDonaiveSoftware } from "@/providers/donaive-software/DonaiveSoftwareProvider";

function toCsv(lines: { sku: string; name: string; qtyBase: number; unitCostUsd: number }[]) {
  const rows = ["SKU,Producto,Stock,CPP USD,Valor USD"];
  for (const r of lines) {
    rows.push(
      [`"${r.sku}"`, `"${r.name.replace(/"/g, '""')}"`, r.qtyBase, r.unitCostUsd.toFixed(2), (r.qtyBase * r.unitCostUsd).toFixed(2)].join(","),
    );
  }
  return rows.join("\n");
}

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function DsPresidenteInventariosInner() {
  const { products, movements, generalInventory, fiscalSettings, setFiscalPin } = useDonaiveSoftware();
  const routes = getDonaiveSoftwareRoutes();
  const [pin, setPin] = useState("");
  const [msg, setMsg] = useState("");

  const master = useMemo(() => buildInventoryReport(products), [products]);
  const general = useMemo(
    () => buildInventoryReportFromStock(products, generalInventory.stockByProduct),
    [products, generalInventory.stockByProduct],
  );

  function savePin() {
    const r = setFiscalPin(pin);
    if (!r.ok) {
      setMsg(r.error);
      return;
    }
    setPin("");
    setMsg("PIN fiscal actualizado.");
  }

  return (
    <div>
      <nav className="ds-crumb">
        <Link to={routes.home}>Módulos</Link>
        <span>/</span>
        <Link to={routes.presidente}>Presidencia</Link>
        <span>/</span>
        <span>Inventarios</span>
      </nav>

      <section className="ds-panel">
        <h1 className="ds-title">Inventario máster y general</h1>
        <p className="ds-lead">
          Máster: todo entra/sale (compras, ajustes, ventas). General: solo compras marcadas y ventas fiscales.
        </p>
        <div style={{ marginTop: "1rem", display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))" }}>
          <div><div className="ds-muted">Máster unidades</div><div className="ds-stat">{formatDsNumber(master.totalUnits, 0)}</div></div>
          <div><div className="ds-muted">General unidades</div><div className="ds-stat">{formatDsNumber(general.totalUnits, 0)}</div></div>
          <div><div className="ds-muted">Movimientos máster</div><div className="ds-stat">{movements.length}</div></div>
          <div><div className="ds-muted">Movimientos general</div><div className="ds-stat">{generalInventory.movements.length}</div></div>
          <div><div className="ds-muted">PIN fiscal</div><div className="ds-stat">{fiscalSettings.pinHash ? "Configurado" : "No configurado"}</div></div>
        </div>
      </section>

      <section className="ds-panel" style={{ marginTop: "1rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.05rem" }}>PIN para factura fiscal</h2>
        <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "end" }}>
          <label className="ds-label">
            Nuevo PIN
            <input className="ds-input" type="password" value={pin} onChange={(e) => setPin(e.target.value)} />
          </label>
          <button type="button" className="ds-btn ds-btn--primary" onClick={savePin}>Guardar PIN</button>
        </div>
        {msg ? <p style={{ marginTop: "0.5rem" }}>{msg}</p> : null}
      </section>

      <section className="ds-panel" style={{ marginTop: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Inventario máster (real)</h2>
          <button
            type="button"
            className="ds-btn"
            onClick={() => download(`inventario-master-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(master.rows))}
          >
            Exportar máster CSV
          </button>
        </div>
      </section>

      <section className="ds-panel" style={{ marginTop: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Inventario general (fiscal)</h2>
          <button
            type="button"
            className="ds-btn ds-btn--primary"
            onClick={() => download(`inventario-general-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(general.rows))}
          >
            Exportar general CSV
          </button>
        </div>
      </section>
    </div>
  );
}

export default function DsPresidenteInventarios() {
  return (
    <DsRequirePermission permission={["president.view", "inventory.master.view", "inventory.general.view"]}>
      <DsPresidenteInventariosInner />
    </DsRequirePermission>
  );
}
