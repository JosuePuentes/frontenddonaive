import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";
import DsRequirePermission from "@/components/donaive-software/DsRequirePermission";
import { formatDsMoney, completeDsPrice } from "@/lib/donaive-software/rates";
import { useDonaiveSoftware } from "@/providers/donaive-software/DonaiveSoftwareProvider";

function DsFinanzasCppInner() {
  const { products, rates, applyPurchaseCpp } = useDonaiveSoftware();
  const routes = getDonaiveSoftwareRoutes();
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [qty, setQty] = useState("24");
  const [cost, setCost] = useState("1.10");
  const [msg, setMsg] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = Number(qty);
    const c = Number(cost);
    if (!productId || !(q > 0) || !(c >= 0)) {
      setMsg("Cantidad y costo válidos requeridos");
      return;
    }
    applyPurchaseCpp(productId, q, c);
    setMsg("CPP actualizado (ponderado con el stock actual)");
  }

  return (
    <div>
      <nav className="ds-crumb">
        <Link to={routes.home}>Módulos</Link>
        <span>/</span>
        <Link to={routes.finanzas}>Finanzas</Link>
        <span>/</span>
        <span>Costo promedio</span>
      </nav>
      <section className="ds-panel">
        <h1 className="ds-title">Costo promedio (CPP)</h1>
        <p className="ds-lead">
          Al entrar mercancía: nuevo CPP = (stock × CPP + entrada × costo) ÷
          (stock + entrada). Igual que en compras A&D.
        </p>
        <div className="ad-table-wrap" style={{ marginTop: "1rem", overflowX: "auto" }}>
          <table className="ds-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Stock (u.)</th>
                <th>CPP unidad</th>
                <th>U. / caja</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const money = completeDsPrice(
                  { usd: p.stock.unitCostUsd, bs: 0 },
                  rates.bcv,
                );
                return (
                  <tr key={p.id}>
                    <td>
                      {p.name}
                      <div className="ds-muted" style={{ fontSize: "0.75rem" }}>
                        {p.sku}
                      </div>
                    </td>
                    <td>{p.stock.qtyBase}</td>
                    <td>{formatDsMoney(money)}</td>
                    <td>{p.unitsPerBox}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <form
          onSubmit={onSubmit}
          style={{
            marginTop: "1.25rem",
            display: "grid",
            gap: "0.85rem",
            maxWidth: 420,
          }}
        >
          <label className="ds-label">
            Producto
            <select
              className="ds-input"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="ds-label">
            Unidades que entran
            <input
              className="ds-input"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              inputMode="numeric"
            />
          </label>
          <label className="ds-label">
            Costo unitario USD de esta entrada
            <input
              className="ds-input"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              inputMode="decimal"
            />
          </label>
          <button type="submit" className="ds-btn ds-btn--primary">
            Aplicar entrada al CPP
          </button>
          {msg ? <p className="ds-muted">{msg}</p> : null}
        </form>
      </section>
    </div>
  );
}

export default function DsFinanzasCpp() {
  return (
    <DsRequirePermission permission="finance.cpp">
      <DsFinanzasCppInner />
    </DsRequirePermission>
  );
}
