import { useMemo, useState } from "react";
import {
  formatAdPrice,
  suggestBsFromUsd,
  uid,
} from "@/lib/ad-licoreria/conversions";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import { resolveAdResult } from "@/services/ad-licoreria/async-result";
import { adCommerceClient } from "@/services/ad-licoreria/commerce-client";
import { isAdApiDataSource } from "@/services/ad-licoreria/data-source";
import type { AdPresentation } from "@/types/ad-licoreria";
import { AdProductScanner } from "@/components/ad-licoreria/AdProductScanner";

/**
 * Presentaciones + precios (utilidad ↔ precio) con alertas bajo costo.
 * MOCK: upsert local. API: POST /pricing/presentation.
 */
export default function AdLicoreriaPresentaciones() {
  const {
    products,
    presentations,
    settings,
    upsertPresentation,
    hasPermission,
  } = useAdLicoreria();
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [name, setName] = useState("");
  const [units, setUnits] = useState(1);
  const [usd, setUsd] = useState(1);
  const [bs, setBs] = useState(370);
  const [utilityPct, setUtilityPct] = useState<number | "">("");
  const [priceMode, setPriceMode] = useState<"price" | "utility">("price");
  const [editPresId, setEditPresId] = useState("");
  const [belowReason, setBelowReason] = useState("");
  const [forceBelow, setForceBelow] = useState(false);
  const [alert, setAlert] = useState("");
  const [msg, setMsg] = useState("");

  const product = useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId],
  );
  const costUsd = useMemo(() => {
    const unit = product?.cost?.usd ?? 0;
    return unit * units;
  }, [product, units]);

  function onUsdChange(value: number) {
    setUsd(value);
    setPriceMode("price");
    if (settings.suggestBsFromRate) {
      setBs(suggestBsFromUsd(value, settings));
    }
    if (costUsd > 0) {
      const util = ((value - costUsd) / costUsd) * 100;
      setUtilityPct(Number(util.toFixed(2)));
      if (value < costUsd) setAlert("Precio por debajo del costo (CPP).");
      else if (util < 5) setAlert("Zona crítica: utilidad < 5% (umbral provisional).");
      else setAlert("");
    }
  }

  function onUtilityChange(value: number) {
    setUtilityPct(value);
    setPriceMode("utility");
    const price = costUsd * (1 + value / 100);
    setUsd(Number(price.toFixed(4)));
    if (settings.suggestBsFromRate) {
      setBs(suggestBsFromUsd(price, settings));
    }
    if (value < 0) setAlert("Precio por debajo del costo (CPP).");
    else if (value < 5) setAlert("Zona crítica: utilidad < 5% (umbral provisional).");
    else setAlert("");
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

  async function applyApiPrice() {
    if (!isAdApiDataSource()) {
      setMsg("Ajuste con utilidad/override requiere modo API.");
      return;
    }
    if (!hasPermission("pricing.manage")) {
      setMsg("Sin permiso pricing.manage");
      return;
    }
    if (!editPresId) {
      setMsg("Seleccione presentación existente");
      return;
    }
    const body: Record<string, unknown> = {
      presentationId: editPresId,
      kind: "NORMAL",
      currency: "USD",
      continueBelowCost: forceBelow,
      belowCostReason: forceBelow ? belowReason : undefined,
    };
    if (priceMode === "utility" && utilityPct !== "") {
      body.utilityPercent = Number(utilityPct);
    } else {
      body.price = usd;
    }
    const r = await adCommerceClient.setPresentationPrice(body);
    if (!r.ok) {
      setMsg(r.error);
      return;
    }
    const d = r.data as {
      belowCost?: boolean;
      nearCost?: boolean;
      price?: number;
      utilityPercent?: number;
    };
    setMsg(
      `Precio API $${Number(d.price).toFixed(4)} · util ${Number(d.utilityPercent).toFixed(1)}%` +
        (d.belowCost ? " · BAJO COSTO" : d.nearCost ? " · zona crítica" : ""),
    );
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
        Precios USD/Bs independientes. Utilidad deseada calcula precio y viceversa.
        CPP histórico no se altera. Costo de reposición usa tasas actuales en finanzas.
      </p>

      <AdProductScanner
        onSelect={(hit) => setProductId(hit.id)}
      />

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
          step="0.01"
          value={utilityPct === "" ? "" : utilityPct}
          onChange={(e) => onUtilityChange(Number(e.target.value))}
          placeholder="Utilidad %"
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
        <p className="sm:col-span-3 text-xs text-[var(--ad-muted)]">
          Costo presentación (CPP×u): ${costUsd.toFixed(4)}
        </p>
        {alert ? (
          <p className="sm:col-span-3 text-sm text-amber-400">{alert}</p>
        ) : null}
        <button type="button" className="ad-btn" onClick={() => void create()}>
          Crear presentación (local/MOCK)
        </button>
      </section>

      <section className="ad-panel grid gap-2 sm:grid-cols-2">
        <h2 className="sm:col-span-2 font-medium">Ajuste de precio (API)</h2>
        <select
          className="ad-select"
          value={editPresId}
          onChange={(e) => setEditPresId(e.target.value)}
        >
          <option value="">Presentación existente</option>
          {presentations
            .filter((p) => p.productId === productId)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={forceBelow}
            onChange={(e) => setForceBelow(e.target.checked)}
          />
          Continuar bajo costo (pricing.override)
        </label>
        {forceBelow ? (
          <input
            className="ad-input sm:col-span-2"
            placeholder="Motivo obligatorio"
            value={belowReason}
            onChange={(e) => setBelowReason(e.target.value)}
          />
        ) : null}
        <button type="button" className="ad-btn" onClick={() => void applyApiPrice()}>
          Guardar precio API
        </button>
      </section>

      {msg ? <p className="text-sm">{msg}</p> : null}

      <section className="ad-panel space-y-2">
        {presentations.map((p) => (
          <div
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 py-2 text-sm"
          >
            <div>
              {products.find((x) => x.id === p.productId)?.name} · {p.name} ·{" "}
              {p.unitsPerPresentation} u · {formatAdPrice(p.price)}
              {!p.active ? " (inactiva)" : ""}
            </div>
            <button type="button" className="ad-btn" onClick={() => void toggle(p)}>
              {p.active ? "Desactivar" : "Activar"}
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
