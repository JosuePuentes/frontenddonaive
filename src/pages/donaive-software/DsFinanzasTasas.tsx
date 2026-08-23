import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";
import { formatDsMoney, completeDsPrice } from "@/lib/donaive-software/rates";
import { useDonaiveSoftware } from "@/providers/donaive-software/DonaiveSoftwareProvider";

export default function DsFinanzasTasas() {
  const { rates, setBcv, setProtectedRate } = useDonaiveSoftware();
  const routes = getDonaiveSoftwareRoutes();
  const [bcv, setBcvLocal] = useState(String(rates.bcv));
  const [prot, setProtLocal] = useState(String(rates.protectedRate));
  const example = completeDsPrice({ usd: 10, bs: 0 }, rates.bcv);

  function save(e: FormEvent) {
    e.preventDefault();
    const b = Number(bcv);
    const p = Number(prot);
    if (b > 0) setBcv(b);
    if (p > 0) setProtectedRate(p);
  }

  return (
    <div>
      <nav className="ds-crumb">
        <Link to={routes.home}>Módulos</Link>
        <span>/</span>
        <Link to={routes.finanzas}>Finanzas</Link>
        <span>/</span>
        <span>Tasas</span>
      </nav>
      <section className="ds-panel">
        <h1 className="ds-title">Tasas</h1>
        <p className="ds-lead">
          Misma lógica que A&D: BCV para referencia POS y tasa protegida para
          pagos especiales. Los montos se muestran en USD y Bs.
        </p>
        <form
          onSubmit={save}
          style={{ marginTop: "1.25rem", display: "grid", gap: "1rem", maxWidth: 360 }}
        >
          <label className="ds-label">
            Tasa BCV (Bs por 1 USD)
            <input
              className="ds-input"
              value={bcv}
              onChange={(e) => setBcvLocal(e.target.value)}
              inputMode="decimal"
            />
          </label>
          <label className="ds-label">
            Tasa protegida (Bs por 1 USD)
            <input
              className="ds-input"
              value={prot}
              onChange={(e) => setProtLocal(e.target.value)}
              inputMode="decimal"
            />
          </label>
          <button type="submit" className="ds-btn ds-btn--primary">
            Guardar tasas
          </button>
        </form>
        <p className="ds-muted" style={{ marginTop: "1.25rem" }}>
          Ejemplo $10 → {formatDsMoney(example)}
        </p>
      </section>
    </div>
  );
}
