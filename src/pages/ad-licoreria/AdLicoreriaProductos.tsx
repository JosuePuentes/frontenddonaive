import { useState } from "react";
import { Link } from "react-router";
import { AD_LICORERIA_ROUTES } from "@/constants/ad-licoreria-routes";
import { formatAdPrice, uid } from "@/lib/ad-licoreria/conversions";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import { resolveAdResult } from "@/services/ad-licoreria/async-result";
import type { AdProduct } from "@/types/ad-licoreria";

export default function AdLicoreriaProductos() {
  const { products, categories, getPresentationsFor, upsertProduct } =
    useAdLicoreria();
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [sku, setSku] = useState("");
  const [baseUnitLabel, setBaseUnitLabel] = useState("unidad");
  const [minStock, setMinStock] = useState(12);
  const [msg, setMsg] = useState("");

  async function create() {
    if (!name.trim() || !sku.trim()) {
      setMsg("Nombre y SKU son obligatorios");
      return;
    }
    const product: AdProduct = {
      id: uid("prod"),
      name: name.trim(),
      brand: brand.trim() || "—",
      categoryId,
      sku: sku.trim().toUpperCase(),
      baseUnitLabel,
      cost: { usd: 0, bs: 0 },
      minStockBase: minStock,
      active: true,
      createdAt: new Date().toISOString(),
    };
    const r = await resolveAdResult(upsertProduct(product));
    setMsg(r.ok ? `Producto ${product.name} creado` : r.error);
    if (r.ok) {
      setName("");
      setSku("");
    }
  }

  async function toggle(p: AdProduct) {
    const r = await resolveAdResult(
      upsertProduct({ ...p, active: !p.active }),
    );
    if (!r.ok) setMsg(r.error);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-[var(--ad-muted)]">
          Producto + presentaciones con conversión configurable a unidad base.
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
          placeholder="SKU"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
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
          placeholder="Unidad base"
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
        <button type="button" className="ad-btn ad-btn--gold sm:col-span-3" onClick={create}>
          Crear producto
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
              <th>Marca</th>
              <th>Categoría</th>
              <th>SKU</th>
              <th>Unidad</th>
              <th>Costo</th>
              <th>Mín.</th>
              <th>Presentaciones</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const cat = categories.find((c) => c.id === p.categoryId);
              return (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.brand}</td>
                  <td>{cat?.name ?? "—"}</td>
                  <td>{p.sku}</td>
                  <td>{p.baseUnitLabel}</td>
                  <td>{formatAdPrice(p.cost)}</td>
                  <td>{p.minStockBase}</td>
                  <td>
                    {getPresentationsFor(p.id)
                      .map((x) => `${x.name}×${x.unitsPerPresentation}`)
                      .join(", ") || "—"}
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
