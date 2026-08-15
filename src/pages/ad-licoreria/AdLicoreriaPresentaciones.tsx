import { useState } from "react";
import {
  formatAdPrice,
  suggestBsFromUsd,
  uid,
} from "@/lib/ad-licoreria/conversions";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import { resolveAdResult } from "@/services/ad-licoreria/async-result";
import type { AdPresentation } from "@/types/ad-licoreria";

export default function AdLicoreriaPresentaciones() {
  const { products, presentations, settings, upsertPresentation } =
    useAdLicoreria();
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [name, setName] = useState("");
  const [units, setUnits] = useState(1);
  const [usd, setUsd] = useState(1);
  const [bs, setBs] = useState(370);
  const [msg, setMsg] = useState("");

  function onUsdChange(value: number) {
    setUsd(value);
    if (settings.suggestBsFromRate) {
      setBs(suggestBsFromUsd(value, settings));
    }
  }

  async function create() {
    if (!name.trim() || units <= 0) {
      setMsg("Nombre y conversión > 0");
      return;
    }
    const pres: AdPresentation = {
      id: uid("pres"),
      productId,
      name: name.trim(),
      unitsPerPresentation: units,
      price: { usd, bs },
      active: true,
    };
    const r = await resolveAdResult(upsertPresentation(pres));
    setMsg(
      r.ok
        ? `${pres.name}: ${units} u. base · ${formatAdPrice(pres.price)}`
        : r.error,
    );
    if (r.ok) setName("");
  }

  async function toggle(p: AdPresentation) {
    const r = await resolveAdResult(
      upsertPresentation({ ...p, active: !p.active }),
    );
    if (!r.ok) setMsg(r.error);
  }

  return (
    <div className="space-y-4">
      <p className="max-w-2xl text-sm text-[var(--ad-muted)]">
        Precios USD y Bs independientes. La tasa ({settings.exchangeRateUsdToBs})
        solo sugiere Bs si está activada; nunca fuerza el precio.
      </p>

      <section className="ad-panel grid gap-2 sm:grid-cols-3">
        <select
          className="ad-select"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <input
          className="ad-input"
          placeholder="Nombre presentación"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="ad-input"
          type="number"
          min={1}
          value={units}
          onChange={(e) => setUnits(Number(e.target.value))}
          title="Unidades base por presentación"
        />
        <input
          className="ad-input"
          type="number"
          min={0}
          step="0.01"
          value={usd}
          onChange={(e) => onUsdChange(Number(e.target.value))}
          placeholder="USD"
        />
        <input
          className="ad-input"
          type="number"
          min={0}
          step="0.01"
          value={bs}
          onChange={(e) => setBs(Number(e.target.value))}
          placeholder="Bs"
        />
        <button type="button" className="ad-btn ad-btn--gold" onClick={create}>
          Crear presentación
        </button>
        {msg ? (
          <p className="text-sm text-[var(--ad-gold-soft)] sm:col-span-3">{msg}</p>
        ) : null}
      </section>

      <div className="ad-table-wrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Presentación</th>
              <th>U. base</th>
              <th>USD</th>
              <th>Bs</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {presentations.map((pres) => {
              const product = products.find((p) => p.id === pres.productId);
              return (
                <tr key={pres.id}>
                  <td>{product?.name}</td>
                  <td>{pres.name}</td>
                  <td>{pres.unitsPerPresentation}</td>
                  <td>${pres.price.usd.toFixed(2)}</td>
                  <td>Bs {pres.price.bs.toLocaleString("es-VE")}</td>
                  <td>
                    <button
                      type="button"
                      className={
                        pres.active ? "ad-badge ad-badge--ok" : "ad-badge"
                      }
                      onClick={() => void toggle(pres)}
                    >
                      {pres.active ? "Activa" : "Inactiva"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
