import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import {
  AD_LICORERIA_ROUTES,
  adInventarioProductoPath,
} from "@/constants/ad-licoreria-routes";
import { formatAdPrice } from "@/lib/ad-licoreria/conversions";
import { findUnitAndBox, pricesFromCost } from "@/lib/ad-licoreria/pack";
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
    hasPermission,
  } = useAdLicoreria();

  const product = products.find((p) => p.id === productId);
  const canRead = hasPermission("inventory.read");
  const canEdit = hasPermission("products.manage");
  const editing = searchParams.get("edit") === "1" && canEdit;

  const pack = useMemo(
    () => findUnitAndBox(product ? getPresentationsFor(product.id) : []),
    [product, getPresentationsFor],
  );
  const unitsPerBox = pack.box?.unitsPerPresentation ?? 1;

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [sku, setSku] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [baseUnitLabel, setBaseUnitLabel] = useState("");
  const [minStock, setMinStock] = useState(0);
  const [utility, setUtility] = useState(0);
  const [boxUnits, setBoxUnits] = useState(1);
  const [active, setActive] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!product) return;
    setName(product.name);
    setBrand(product.brand);
    setSku(product.sku);
    setCategoryId(product.categoryId);
    setBaseUnitLabel(product.baseUnitLabel);
    setMinStock(product.minStockBase);
    setUtility(product.defaultUtilityPercent ?? 0);
    setBoxUnits(pack.box?.unitsPerPresentation ?? 1);
    setActive(product.active);
  }, [product, pack.box?.unitsPerPresentation]);

  const px = product
    ? pricesFromCost(product.cost.usd, unitsPerBox, product.defaultUtilityPercent ?? 0)
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
    setCategoryId(product.categoryId);
    setBaseUnitLabel(product.baseUnitLabel);
    setMinStock(product.minStockBase);
    setUtility(product.defaultUtilityPercent ?? 0);
    setBoxUnits(unitsPerBox);
    setActive(product.active);
    setSearchParams({});
    setMsg("");
  }

  async function save() {
    if (!product) return;
    if (!name.trim() || !sku.trim()) {
      setMsg("Nombre y SKU son obligatorios");
      return;
    }
    if (pack.box && !(boxUnits > 1)) {
      setMsg("Las unidades por caja deben ser mayores a 1");
      return;
    }
    const updated: AdProduct = {
      ...product,
      name: name.trim(),
      brand: brand.trim() || "—",
      sku: sku.trim().toUpperCase(),
      categoryId,
      baseUnitLabel: baseUnitLabel.trim() || "unidad",
      minStockBase: minStock,
      defaultUtilityPercent: utility,
      unitsPerBox: pack.box ? boxUnits : 1,
      active,
    };
    const r = await resolveAdResult(upsertProduct(updated));
    if (!r.ok) {
      setMsg(r.error);
      return;
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

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="ad-eyebrow">Ficha de producto</p>
          <h1 className="ad-panel-title">{product.name}</h1>
          <p className="mt-1 text-sm text-[var(--ad-muted)]">
            SKU {product.sku} · {product.brand}
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
        <Field label="Utilidad %">
          {editing ? (
            <input
              className="ad-input"
              type="number"
              min={0}
              step="0.1"
              value={utility}
              onChange={(e) => setUtility(Number(e.target.value))}
            />
          ) : (
            `${(product.defaultUtilityPercent ?? 0).toFixed(1)}%`
          )}
        </Field>
        <Field label="Empaque">
          {pack.box ? `Caja x${unitsPerBox} + unidad` : "Solo unidad"}
        </Field>
        {pack.box && editing ? (
          <Field label="Unidades por caja">
            <input
              className="ad-input"
              type="number"
              min={2}
              value={boxUnits}
              onChange={(e) => setBoxUnits(Number(e.target.value))}
            />
          </Field>
        ) : null}
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

      <section className="ad-panel">
        <h2 className="ad-panel-title">Costos y precios</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <Stat label="Costo unitario (CPP)" value={formatAdPrice(product.cost)} />
          {px && product.cost.usd > 0 ? (
            <>
              <Stat label="Costo caja" value={`$${px.boxCost.toFixed(2)}`} />
              <Stat label="PVP unidad" value={`$${px.unitSale.toFixed(2)}`} />
              <Stat label="PVP caja" value={`$${px.boxSale.toFixed(2)}`} />
            </>
          ) : (
            <p className="text-[var(--ad-muted)] sm:col-span-3">
              Sin costo registrado. Confirme una compra para calcular CPP y PVP.
            </p>
          )}
        </div>
        <div className="ad-table-wrap mt-4">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Presentación</th>
                <th>Conversión</th>
                <th>Precio USD</th>
                <th>Precio Bs</th>
              </tr>
            </thead>
            <tbody>
              {getPresentationsFor(product.id).map((pres) => (
                <tr key={pres.id}>
                  <td>{pres.name}</td>
                  <td>{pres.unitsPerPresentation} u. base</td>
                  <td>${pres.price.usd.toFixed(2)}</td>
                  <td>{pres.price.bs.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-[var(--ad-muted)]">
          Para ajustar precios manualmente use{" "}
          <Link className="underline" to={AD_LICORERIA_ROUTES.presentaciones}>
            Presentaciones / precios
          </Link>
          .
        </p>
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-[var(--ad-muted)]">{label}</div>
      <div className="mt-0.5 font-medium">{value}</div>
    </div>
  );
}
