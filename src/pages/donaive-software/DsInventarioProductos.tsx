import { useMemo, useState } from "react";
import { Link } from "react-router";
import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";
import DsRequirePermission from "@/components/donaive-software/DsRequirePermission";
import { formatDsMoney, completeDsPrice } from "@/lib/donaive-software/rates";
import { splitStockUnits } from "@/lib/donaive-software/stock";
import { buildProductPlanningRows } from "@/lib/donaive-software/planning";
import { useDonaiveSoftware } from "@/providers/donaive-software/DonaiveSoftwareProvider";

function DsInventarioProductosInner() {
  const { products, rates, upsertProduct, sales, purchases, suppliers } =
    useDonaiveSoftware();
  const routes = getDonaiveSoftwareRoutes();
  const planning = useMemo(
    () =>
      buildProductPlanningRows({
        products,
        sales,
        purchases,
        suppliers,
      }),
    [products, sales, purchases, suppliers],
  );

  const [editId, setEditId] = useState<string | null>(null);
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [unitsPerBox, setUnitsPerBox] = useState(24);
  const [taxable, setTaxable] = useState(true);
  const [utilityPercent, setUtilityPercent] = useState(30);
  const [msg, setMsg] = useState("");

  function resetForm() {
    setEditId(null);
    setSku("");
    setName("");
    setBarcode("");
    setUnitsPerBox(24);
    setTaxable(true);
    setUtilityPercent(30);
    setMsg("");
  }

  function loadProduct(id: string) {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    setEditId(p.id);
    setSku(p.sku);
    setName(p.name);
    setBarcode(p.barcode ?? "");
    setUnitsPerBox(p.unitsPerBox);
    setTaxable(p.taxable);
    setUtilityPercent(p.utilityPercent);
    setMsg("");
  }

  function save() {
    const r = upsertProduct({
      id: editId ?? undefined,
      sku,
      name,
      barcode: barcode || undefined,
      unitsPerBox,
      taxable,
      utilityPercent,
    });
    setMsg(r.ok ? "Producto guardado" : r.error);
    if (r.ok) resetForm();
  }

  return (
    <div>
      <nav className="ds-crumb">
        <Link to={routes.home}>Módulos</Link>
        <span>/</span>
        <Link to={routes.inventario}>Inventario</Link>
        <span>/</span>
        <span>Productos</span>
      </nav>
      <section className="ds-panel">
        <h1 className="ds-title">Productos</h1>
        <p className="ds-lead">
          Ficha con empaque caja/unidad, CPP y PVP. Mínimo y máximo los calcula
          el sistema según ventas diarias y días de despacho del proveedor.
        </p>
        <div style={{ marginTop: "1rem", overflowX: "auto" }}>
          <table className="ds-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Stock</th>
                <th>Mín / Máx</th>
                <th>CPP</th>
                <th>PVP u.</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const s = splitStockUnits(p.stock.qtyBase, p.unitsPerBox);
                const row = planning.find((x) => x.productId === p.id);
                const cpp = completeDsPrice(
                  { usd: p.stock.unitCostUsd, bs: 0 },
                  rates.bcv,
                );
                const pvp = p.saleUnitUsd
                  ? completeDsPrice({ usd: p.saleUnitUsd, bs: 0 }, rates.bcv)
                  : null;
                return (
                  <tr key={p.id}>
                    <td>
                      {p.name}
                      <div className="ds-muted" style={{ fontSize: "0.75rem" }}>
                        {p.sku} · caja x{p.unitsPerBox}
                        {p.taxable ? " · IVA" : " · exento"}
                      </div>
                    </td>
                    <td>
                      {s.totalUnits} u.
                      {s.hasBoxPack ? (
                        <div className="ds-muted" style={{ fontSize: "0.75rem" }}>
                          {s.fullBoxes} caja(s) · {s.looseUnits} suelta(s)
                        </div>
                      ) : null}
                    </td>
                    <td>
                      {row
                        ? `${Math.round(row.minQtyBase)} / ${Math.round(row.maxQtyBase)}`
                        : "—"}
                      {row ? (
                        <div className="ds-muted" style={{ fontSize: "0.75rem" }}>
                          {row.avgDaily.toFixed(1)} u./día
                        </div>
                      ) : null}
                    </td>
                    <td>{formatDsMoney(cpp)}</td>
                    <td>{pvp ? formatDsMoney(pvp) : "—"}</td>
                    <td>
                      <button
                        type="button"
                        className="ds-btn"
                        onClick={() => loadProduct(p.id)}
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="ds-panel" style={{ marginTop: "1rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.1rem" }}>
          {editId ? "Editar producto" : "Nuevo producto"}
        </h2>
        <div
          style={{
            marginTop: "1rem",
            display: "grid",
            gap: "0.85rem",
            maxWidth: 420,
          }}
        >
          <label className="ds-label">
            SKU *
            <input className="ds-input" value={sku} onChange={(e) => setSku(e.target.value)} />
          </label>
          <label className="ds-label">
            Nombre *
            <input className="ds-input" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="ds-label">
            Código de barras
            <input
              className="ds-input"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
            />
          </label>
          <label className="ds-label">
            Unidades por caja
            <input
              className="ds-input"
              type="number"
              min={1}
              value={unitsPerBox}
              onChange={(e) => setUnitsPerBox(Number(e.target.value))}
            />
          </label>
          <label className="ds-label">
            Utilidad % (margen PVP)
            <input
              className="ds-input"
              type="number"
              min={0}
              max={99}
              value={utilityPercent}
              onChange={(e) => setUtilityPercent(Number(e.target.value))}
            />
          </label>
          <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input
              type="checkbox"
              checked={taxable}
              onChange={(e) => setTaxable(e.target.checked)}
            />
            Gravado con IVA
          </label>
          {msg ? (
            <p
              style={{
                margin: 0,
                color: msg.includes("guardado") ? "var(--ds-ok)" : "var(--ds-danger)",
              }}
            >
              {msg}
            </p>
          ) : null}
          <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
            <button type="button" className="ds-btn ds-btn--primary" onClick={save}>
              Guardar
            </button>
            {editId ? (
              <button type="button" className="ds-btn" onClick={resetForm}>
                Cancelar
              </button>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function DsInventarioProductos() {
  return (
    <DsRequirePermission permission="inventory.products">
      <DsInventarioProductosInner />
    </DsRequirePermission>
  );
}
