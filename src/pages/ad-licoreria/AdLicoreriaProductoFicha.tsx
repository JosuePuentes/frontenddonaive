import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import {
  AD_LICORERIA_ROUTES,
  adInventarioProductoPath,
} from "@/constants/ad-licoreria-routes";
import { AdPriceDisplay } from "@/components/ad-licoreria/AdPriceDisplay";
import { useAdBcvRate } from "@/hooks/ad-licoreria/useAdBcvRate";
import {
  findUnitAndBox,
  pricesFromCost,
  type PackMode,
} from "@/lib/ad-licoreria/pack";
import { completeAdPrice, hasAdMoney } from "@/lib/ad-licoreria/rates";
import { warehouseLabel } from "@/lib/ad-licoreria/warehouses";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import { resolveAdResult } from "@/services/ad-licoreria/async-result";
import type { AdProduct } from "@/types/ad-licoreria";

export default function AdLicoreriaProductoFicha() {
  const { productId = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    products,
    categories,
    warehouses,
    getPresentationsFor,
    getOperationalAvailability,
    canAccessWarehouse,
    upsertProduct,
    upsertPresentation,
    hasPermission,
  } = useAdLicoreria();
  const bcv = useAdBcvRate();

  const product = products.find((p) => p.id === productId);
  const canRead = hasPermission("inventory.read");
  const canEdit = hasPermission("products.manage");
  const editing = searchParams.get("edit") === "1" && canEdit;

  const pack = useMemo(
    () => findUnitAndBox(product ? getPresentationsFor(product.id) : []),
    [product, getPresentationsFor],
  );

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [baseUnitLabel, setBaseUnitLabel] = useState("");
  const [minStock, setMinStock] = useState(0);
  const [packMode, setPackMode] = useState<PackMode>("UNIT");
  const [boxUnits, setBoxUnits] = useState(20);
  const [utility, setUtility] = useState(0);
  const [active, setActive] = useState(true);
  const [msg, setMsg] = useState("");
  const [presBarcodes, setPresBarcodes] = useState<Record<string, string>>({});

  const productPresentations = useMemo(
    () => (product ? getPresentationsFor(product.id) : []),
    [product, getPresentationsFor],
  );

  useEffect(() => {
    if (!product) return;
    setName(product.name);
    setBrand(product.brand);
    setSku(product.sku);
    setBarcode(product.barcode ?? "");
    setCategoryId(product.categoryId);
    setBaseUnitLabel(product.baseUnitLabel);
    setMinStock(product.minStockBase);
    setUtility(product.defaultUtilityPercent ?? 0);
    setActive(product.active);
    const hasBox = Boolean(pack.box?.active !== false && pack.box);
    setPackMode(hasBox ? "BOX" : "UNIT");
    setBoxUnits(
      hasBox ? Math.max(2, pack.box?.unitsPerPresentation ?? 20) : 20,
    );
    const nextBarcodes: Record<string, string> = {};
    for (const pres of getPresentationsFor(product.id)) {
      nextBarcodes[pres.id] = pres.barcode ?? "";
    }
    setPresBarcodes(nextBarcodes);
  }, [product, pack.box, getPresentationsFor]);

  const unitsPerBox = packMode === "BOX" ? boxUnits : 1;
  const displayCost = product ? completeAdPrice(product.cost, bcv) : { usd: 0, bs: 0 };
  const previewPx = product
    ? pricesFromCost(displayCost.usd, unitsPerBox, utility)
    : null;

  const stockRows = useMemo(() => {
    if (!product) return [];
    return warehouses
      .filter((w) => w.active && canAccessWarehouse(w.id))
      .map((w) => {
        const av = getOperationalAvailability(product.id, 0, w.id);
        const wh = av.byWarehouse.find((x) => x.warehouseId === w.id);
        return {
          warehouseId: w.id,
          name: w.name,
          physical: wh?.physical ?? 0,
          available: wh?.availableOperational ?? 0,
          committed: wh?.committedActive ?? 0,
        };
      });
  }, [product, warehouses, canAccessWarehouse, getOperationalAvailability]);

  function startEdit() {
    setSearchParams({ edit: "1" });
  }

  function cancelEdit() {
    if (!product) return;
    setName(product.name);
    setBrand(product.brand);
    setSku(product.sku);
    setBarcode(product.barcode ?? "");
    setCategoryId(product.categoryId);
    setBaseUnitLabel(product.baseUnitLabel);
    setMinStock(product.minStockBase);
    setUtility(product.defaultUtilityPercent ?? 0);
    setActive(product.active);
    const hasBox = Boolean(pack.box?.active !== false && pack.box);
    setPackMode(hasBox ? "BOX" : "UNIT");
    setBoxUnits(hasBox ? pack.box!.unitsPerPresentation : 20);
    const nextBarcodes: Record<string, string> = {};
    for (const pres of getPresentationsFor(product.id)) {
      nextBarcodes[pres.id] = pres.barcode ?? "";
    }
    setPresBarcodes(nextBarcodes);
    setSearchParams({});
    setMsg("");
  }

  async function save() {
    if (!product) return;
    if (!name.trim() || !sku.trim()) {
      setMsg("Nombre y SKU son obligatorios");
      return;
    }
    if (packMode === "BOX" && !(boxUnits > 1)) {
      setMsg("Indique cuántas unidades trae cada caja (mínimo 2)");
      return;
    }
    if (utility >= 100) {
      setMsg("La utilidad contable debe ser menor a 100%");
      return;
    }
    const updated: AdProduct = {
      ...product,
      name: name.trim(),
      brand: brand.trim() || "—",
      sku: sku.trim().toUpperCase(),
      barcode: barcode.trim() || undefined,
      categoryId,
      baseUnitLabel: baseUnitLabel.trim() || "unidad",
      minStockBase: minStock,
      defaultUtilityPercent: utility,
      packMode,
      unitsPerBox: packMode === "BOX" ? boxUnits : 1,
      active,
    };
    const r = await resolveAdResult(upsertProduct(updated));
    if (!r.ok) {
      setMsg(r.error);
      return;
    }
    for (const pres of productPresentations) {
      const nextBarcode = (presBarcodes[pres.id] ?? "").trim();
      const prevBarcode = pres.barcode?.trim() ?? "";
      if (nextBarcode === prevBarcode) continue;
      const pr = await resolveAdResult(
        upsertPresentation({
          ...pres,
          barcode: nextBarcode || undefined,
        }),
      );
      if (!pr.ok) {
        setMsg(`Producto guardado; barcode ${pres.name}: ${pr.error}`);
        setSearchParams({});
        return;
      }
    }
    setMsg("Ficha guardada");
    setSearchParams({});
  }

  if (!canRead) {
    return (
      <div className="ad-panel">
        <p className="text-sm text-[var(--ad-muted)]">
          Sin permiso inventory.read
        </p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="ad-panel space-y-3">
        <p className="text-sm text-[var(--ad-muted)]">Producto no encontrado.</p>
        <Link className="ad-btn" to={AD_LICORERIA_ROUTES.inventario}>
          Volver a inventario
        </Link>
      </div>
    );
  }

  const categoryName =
    categories.find((c) => c.id === product.categoryId)?.name ?? "—";
  const cost = completeAdPrice(product.cost, bcv);
  const viewPx = pricesFromCost(
    cost.usd,
    pack.box?.unitsPerPresentation ?? 1,
    product.defaultUtilityPercent ?? 0,
  );
  const pvpUnit = hasAdMoney(pack.unit?.price)
    ? completeAdPrice(pack.unit!.price, bcv)
    : completeAdPrice({ usd: viewPx.unitSale, bs: 0 }, bcv);
  const pvpBox = pack.box
    ? hasAdMoney(pack.box.price)
      ? completeAdPrice(pack.box.price, bcv)
      : completeAdPrice({ usd: viewPx.boxSale, bs: 0 }, bcv)
    : { usd: 0, bs: 0 };
  const hasCost = hasAdMoney(cost) || hasAdMoney(pvpUnit);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="ad-eyebrow">Ficha de producto</p>
          <h1 className="ad-panel-title">{product.name}</h1>
          <p className="mt-1 text-sm text-[var(--ad-muted)]">
            SKU {product.sku}
            {product.barcode ? ` · EAN ${product.barcode}` : ""} · {product.brand}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="ad-btn" to={AD_LICORERIA_ROUTES.inventario}>
            Volver a inventario
          </Link>
          {!editing && canEdit ? (
            <button type="button" className="ad-btn ad-btn--gold" onClick={startEdit}>
              Editar
            </button>
          ) : null}
          {editing ? (
            <>
              <button type="button" className="ad-btn" onClick={cancelEdit}>
                Cancelar
              </button>
              <button
                type="button"
                className="ad-btn ad-btn--gold"
                onClick={() => void save()}
              >
                Guardar
              </button>
            </>
          ) : null}
        </div>
      </div>

      {msg ? (
        <p className="text-sm text-[var(--ad-gold-soft)]">{msg}</p>
      ) : null}

      <section className="ad-panel grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Nombre">
          {editing ? (
            <input className="ad-input" value={name} onChange={(e) => setName(e.target.value)} />
          ) : (
            product.name
          )}
        </Field>
        <Field label="Marca">
          {editing ? (
            <input className="ad-input" value={brand} onChange={(e) => setBrand(e.target.value)} />
          ) : (
            product.brand
          )}
        </Field>
        <Field label="SKU">
          {editing ? (
            <input className="ad-input" value={sku} onChange={(e) => setSku(e.target.value)} />
          ) : (
            product.sku
          )}
        </Field>
        <Field label="Código de barras (producto)">
          {editing ? (
            <input
              className="ad-input font-mono"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="EAN unidad / código escáner"
              inputMode="numeric"
            />
          ) : (
            <span className="font-mono text-sm">{product.barcode ?? "—"}</span>
          )}
        </Field>
        <Field label="Categoría">
          {editing ? (
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
          ) : (
            categoryName
          )}
        </Field>
        <Field label="Unidad base">
          {editing ? (
            <input
              className="ad-input"
              value={baseUnitLabel}
              onChange={(e) => setBaseUnitLabel(e.target.value)}
            />
          ) : (
            product.baseUnitLabel
          )}
        </Field>
        <Field label="Stock mínimo (base)">
          {editing ? (
            <input
              className="ad-input"
              type="number"
              min={0}
              value={minStock}
              onChange={(e) => setMinStock(Number(e.target.value))}
            />
          ) : (
            product.minStockBase
          )}
        </Field>
        <Field label="Estado">
          {editing ? (
            <button
              type="button"
              className={active ? "ad-badge ad-badge--ok" : "ad-badge"}
              onClick={() => setActive(!active)}
            >
              {active ? "Activo" : "Inactivo"}
            </button>
          ) : (
            <span className={product.active ? "ad-badge ad-badge--ok" : "ad-badge"}>
              {product.active ? "Activo" : "Inactivo"}
            </span>
          )}
        </Field>
      </section>

      <section className="ad-panel space-y-4">
        <div>
          <h2 className="ad-panel-title">Empaque y utilidad</h2>
          <p className="mt-1 text-sm text-[var(--ad-muted)]">
            Defina si compra/vende por caja o por unidad, cuántas unidades trae
            la caja y la utilidad contable (margen sobre el precio de venta, no
            markup lineal sobre el costo).
          </p>
        </div>

        {editing ? (
          <>
            <div className="grid grid-cols-2 gap-2 max-w-md">
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
              <label className="block max-w-xs text-sm text-[var(--ad-muted)]">
                Unidades que trae cada caja
                <input
                  className="ad-input mt-1"
                  type="number"
                  min={2}
                  value={boxUnits}
                  onChange={(e) => setBoxUnits(Number(e.target.value))}
                />
              </label>
            ) : (
              <p className="text-sm text-[var(--ad-muted)]">
                Se compra y vende solo por unidad (presentación ×1).
              </p>
            )}
            <label className="block max-w-xs text-sm text-[var(--ad-muted)]">
              Utilidad contable % (margen sobre PVP)
              <input
                className="ad-input mt-1"
                type="number"
                min={0}
                max={99.9}
                step="0.1"
                value={utility}
                onChange={(e) => setUtility(Number(e.target.value))}
              />
            </label>
            {previewPx && displayCost.usd > 0 ? (
              <div className="rounded border border-[var(--ad-line)] p-3 text-sm">
                <p className="text-[var(--ad-muted)]">Vista previa PVP (utilidad {utility}% contable):</p>
                <p className="mt-1">
                  Unidad ${previewPx.unitSale.toFixed(2)}
                  {packMode === "BOX" ? (
                    <> · Caja x{boxUnits} ${previewPx.boxSale.toFixed(2)}</>
                  ) : null}
                </p>
              </div>
            ) : null}
          </>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
            <Stat
              label="Empaque"
              value={
                pack.box
                  ? `Caja x${pack.box.unitsPerPresentation} + unidad`
                  : "Solo unidad"
              }
            />
            {pack.box ? (
              <Stat
                label="Unidades por caja"
                value={String(pack.box.unitsPerPresentation)}
              />
            ) : null}
            <Stat
              label="Utilidad contable"
              value={`${(product.defaultUtilityPercent ?? 0).toFixed(1)}% sobre PVP`}
            />
          </div>
        )}
      </section>

      <section className="ad-panel">
        <h2 className="ad-panel-title">Costos y precios</h2>
        {editing ? (
          <p className="mt-1 text-xs text-[var(--ad-muted)]">
            Código de barras por presentación: use el de la caja si escanea
            empaques; el del producto arriba es para la unidad suelta.
          </p>
        ) : null}
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <Stat
            label="Costo unitario (CPP)"
            value={
              hasAdMoney(cost) ? (
                <AdPriceDisplay price={cost} stacked />
              ) : (
                "—"
              )
            }
          />
          {hasCost ? (
            <>
              {pack.box ? (
                <Stat
                  label="Costo caja"
                  value={
                    <AdPriceDisplay
                      price={completeAdPrice(
                        { usd: viewPx.boxCost, bs: 0 },
                        bcv,
                      )}
                      stacked
                    />
                  }
                />
              ) : null}
              <Stat
                label="PVP unidad"
                value={<AdPriceDisplay price={pvpUnit} stacked />}
              />
              {pack.box ? (
                <Stat
                  label="PVP caja"
                  value={<AdPriceDisplay price={pvpBox} stacked />}
                />
              ) : null}
            </>
          ) : (
            <p className="text-[var(--ad-muted)] sm:col-span-3">
              Sin costo ni PVP. Confirme una compra (con utilidad en la ficha)
              para calcularlos, o fije precio en Presentaciones.
            </p>
          )}
        </div>
        <div className="ad-table-wrap mt-4">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Presentación</th>
                <th>Cód. barras</th>
                <th>Conversión</th>
                <th>PVP</th>
              </tr>
            </thead>
            <tbody>
              {productPresentations.map((pres) => (
                <tr key={pres.id}>
                  <td>{pres.name}</td>
                  <td className="font-mono text-xs">
                    {editing ? (
                      <input
                        className="ad-input font-mono text-xs"
                        value={presBarcodes[pres.id] ?? ""}
                        onChange={(e) =>
                          setPresBarcodes((prev) => ({
                            ...prev,
                            [pres.id]: e.target.value,
                          }))
                        }
                        placeholder="EAN caja/unidad"
                        inputMode="numeric"
                      />
                    ) : (
                      pres.barcode ?? "—"
                    )}
                  </td>
                  <td>{pres.unitsPerPresentation} u. base</td>
                  <td>
                    <AdPriceDisplay
                      price={completeAdPrice(pres.price, bcv)}
                      stacked
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="ad-panel">
        <h2 className="ad-panel-title">Existencias por depósito</h2>
        <div className="ad-table-wrap mt-3">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Depósito</th>
                <th>Físico</th>
                <th>Comprometido</th>
                <th>Disponible</th>
              </tr>
            </thead>
            <tbody>
              {stockRows.map((row) => (
                <tr key={row.warehouseId}>
                  <td>{warehouseLabel(row.warehouseId) || row.name}</td>
                  <td>{row.physical}</td>
                  <td>{row.committed}</td>
                  <td
                    className={
                      row.available <= 0
                        ? "text-[var(--ad-danger)]"
                        : "text-[var(--ad-success)]"
                    }
                  >
                    {row.available}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {!editing && canEdit ? (
        <div className="flex justify-end">
          <button
            type="button"
            className="ad-btn ad-btn--gold"
            onClick={() =>
              navigate(adInventarioProductoPath(product.id, { edit: true }))
            }
          >
            Editar ficha
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-[var(--ad-muted)]">
        {label}
      </div>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <div className="text-xs text-[var(--ad-muted)]">{label}</div>
      <div className="mt-0.5 font-medium">{value}</div>
    </div>
  );
}
