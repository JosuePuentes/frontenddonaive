import { useState } from "react";
import { Link } from "react-router";
import { AD_LICORERIA_ROUTES, adInventarioProductoPath } from "@/constants/ad-licoreria-routes";
import { AdPriceDisplay } from "@/components/ad-licoreria/AdPriceDisplay";
import { useAdBcvRate } from "@/hooks/ad-licoreria/useAdBcvRate";
import { uid } from "@/lib/ad-licoreria/conversions";
import { findUnitAndBox, pricesFromCost } from "@/lib/ad-licoreria/pack";
import { completeAdPrice, hasAdMoney } from "@/lib/ad-licoreria/rates";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import { resolveAdResult } from "@/services/ad-licoreria/async-result";
import type { AdPresentation, AdProduct } from "@/types/ad-licoreria";

export default function AdLicoreriaProductos() {
  const {
    products,
    categories,
    getPresentationsFor,
    upsertProduct,
    upsertPresentation,
  } = useAdLicoreria();
  const bcv = useAdBcvRate();
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [baseUnitLabel, setBaseUnitLabel] = useState("unidad");
  const [minStock, setMinStock] = useState(12);
  const [packMode, setPackMode] = useState<"UNIT" | "BOX">("BOX");
  const [unitsPerBox, setUnitsPerBox] = useState(20);
  const [utility, setUtility] = useState(30);
  const [msg, setMsg] = useState("");

  async function create() {
    if (!name.trim() || !sku.trim()) {
      setMsg("Nombre y SKU son obligatorios");
      return;
    }
    if (packMode === "BOX" && !(unitsPerBox > 1)) {
      setMsg("Si es por caja, indique cuántas unidades trae cada caja");
      return;
    }
    const product: AdProduct = {
      id: uid("prod"),
      name: name.trim(),
      brand: brand.trim() || "—",
      categoryId,
      sku: sku.trim().toUpperCase(),
      barcode: barcode.trim() || undefined,
      baseUnitLabel,
      cost: { usd: 0, bs: 0 },
      minStockBase: minStock,
      defaultUtilityPercent: utility,
      packMode,
      unitsPerBox: packMode === "BOX" ? unitsPerBox : 1,
      active: true,
      createdAt: new Date().toISOString(),
    };
    const r = await resolveAdResult(upsertProduct(product));
    if (!r.ok) {
      setMsg(r.error);
      return;
    }
    const existing = getPresentationsFor(r.data.id);
    if (!existing.length) {
      const unitPres: AdPresentation = {
        id: uid("pres"),
        productId: r.data.id,
        name: "Unidad",
        code: "U",
        unitsPerPresentation: 1,
        barcode: barcode.trim() || undefined,
        price: { usd: 0, bs: 0 },
        active: true,
      };
      await resolveAdResult(upsertPresentation(unitPres));
      if (packMode === "BOX") {
        await resolveAdResult(
          upsertPresentation({
            id: uid("pres"),
            productId: r.data.id,
            name: `Caja x${unitsPerBox}`,
            code: "CAJA",
            unitsPerPresentation: unitsPerBox,
            price: { usd: 0, bs: 0 },
            active: true,
          }),
        );
      }
    }
    setMsg(
      packMode === "BOX"
        ? `Producto ${product.name}: Unidad + Caja x${unitsPerBox} · utilidad ${utility}%`
        : `Producto ${product.name}: se vende/compra por unidad · utilidad ${utility}%`,
    );
    setName("");
    setSku("");
    setBarcode("");
  }

  async function toggle(p: AdProduct) {
    const r = await resolveAdResult(upsertProduct({ ...p, active: !p.active }));
    if (!r.ok) setMsg(r.error);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-[var(--ad-muted)]">
          Al crear, indique si entra por caja o por unidad y la utilidad. En la
          compra, el costo + esta utilidad dan el precio de venta.
        </p>
        <Link to={AD_LICORERIA_ROUTES.presentaciones} className="ad-btn">
          Presentaciones / precios
        </Link>
      </div>

      <section className="ad-panel grid gap-2 sm:grid-cols-3">
        <input
          className="ad-input"
          placeholder="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="ad-input"
          placeholder="Marca"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
        />
        <input
          className="ad-input"
          placeholder="SKU / código interno"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
        />
        <input
          className="ad-input sm:col-span-2"
          placeholder="Código de barras EAN (unidad)"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          inputMode="numeric"
        />
        <select
          className="ad-select"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          className="ad-input"
          placeholder="Unidad base (cigarro, botella…)"
          value={baseUnitLabel}
          onChange={(e) => setBaseUnitLabel(e.target.value)}
        />
        <input
          className="ad-input"
          type="number"
          min={0}
          value={minStock}
          onChange={(e) => setMinStock(Number(e.target.value))}
        />
        <div className="sm:col-span-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            className={`ad-btn ${packMode === "UNIT" ? "ad-btn--gold" : ""}`}
            onClick={() => setPackMode("UNIT")}
          >
            Por unidad
          </button>
          <button
            type="button"
            className={`ad-btn ${packMode === "BOX" ? "ad-btn--gold" : ""}`}
            onClick={() => setPackMode("BOX")}
          >
            Por caja
          </button>
        </div>
        {packMode === "BOX" ? (
          <label className="sm:col-span-3 text-sm text-[var(--ad-muted)]">
            Unidades que trae cada caja
            <input
              className="ad-input mt-1"
              type="number"
              min={2}
              value={unitsPerBox}
              onChange={(e) => setUnitsPerBox(Number(e.target.value))}
            />
          </label>
        ) : null}
        <label className="sm:col-span-3 text-sm text-[var(--ad-muted)]">
          Utilidad contable % (margen sobre precio de venta)
          <input
            className="ad-input mt-1"
            type="number"
            min={0}
            step="0.1"
            value={utility}
            onChange={(e) => setUtility(Number(e.target.value))}
          />
        </label>
        <button
          type="button"
          className="ad-btn ad-btn--gold sm:col-span-3"
          onClick={() => void create()}
        >
          Crear producto
        </button>
        {msg ? (
          <p className="text-sm text-[var(--ad-gold-soft)] sm:col-span-3">
            {msg}
          </p>
        ) : null}
      </section>

      <div className="ad-table-wrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>SKU</th>
              <th>Cód. barras</th>
              <th>Caja / unidad</th>
              <th>Utilidad cont.</th>
              <th>Costo u.</th>
              <th>PVP unidad</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const pack = findUnitAndBox(getPresentationsFor(p.id));
              const cost = completeAdPrice(p.cost, bcv);
              const upp = pack.box?.unitsPerPresentation ?? 1;
              const px = pricesFromCost(
                cost.usd,
                upp,
                p.defaultUtilityPercent ?? 0,
              );
              const pvpUnit = hasAdMoney(pack.unit?.price)
                ? completeAdPrice(pack.unit!.price, bcv)
                : completeAdPrice({ usd: px.unitSale, bs: 0 }, bcv);
              return (
                <tr key={p.id}>
                  <td>
                    <Link
                      className="hover:underline"
                      to={adInventarioProductoPath(p.id)}
                    >
                      {p.name}
                    </Link>
                    <div className="text-xs text-[var(--ad-muted)]">
                      {p.brand}
                    </div>
                  </td>
                  <td>{p.sku}</td>
                  <td className="font-mono text-xs">
                    {p.barcode ?? "—"}
                  </td>
                  <td>
                    {pack.box
                      ? `Caja x${pack.box.unitsPerPresentation} + unidad`
                      : "Solo unidad"}
                  </td>
                  <td>{(p.defaultUtilityPercent ?? 0).toFixed(1)}%</td>
                  <td>
                    {hasAdMoney(cost) ? (
                      <AdPriceDisplay price={cost} stacked />
                    ) : (
                      <span className="text-xs text-[var(--ad-muted)]">—</span>
                    )}
                    {pack.box && cost.usd > 0 ? (
                      <div className="text-[10px] text-[var(--ad-muted)]">
                        caja ${px.boxCost.toFixed(2)}
                      </div>
                    ) : null}
                  </td>
                  <td>
                    {hasAdMoney(pvpUnit) ? (
                      <AdPriceDisplay price={pvpUnit} stacked />
                    ) : (
                      <span className="text-xs text-[var(--ad-muted)]">—</span>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className={
                        p.active ? "ad-badge ad-badge--ok" : "ad-badge"
                      }
                      onClick={() => void toggle(p)}
                    >
                      {p.active ? "Activo" : "Inactivo"}
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
