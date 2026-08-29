import { useMemo, useState } from "react";
import { Link } from "react-router";
import {
  AD_LICORERIA_ROUTES,
  adInventarioProductoPath,
} from "@/constants/ad-licoreria-routes";
import { AdPriceDisplay } from "@/components/ad-licoreria/AdPriceDisplay";
import { AdStockBreakdown } from "@/components/ad-licoreria/AdStockBreakdown";
import { useAdBcvRate } from "@/hooks/ad-licoreria/useAdBcvRate";
import { findUnitAndBox, pricesFromCost } from "@/lib/ad-licoreria/pack";
import { completeAdPrice, hasAdMoney } from "@/lib/ad-licoreria/rates";
import { warehouseLabel } from "@/lib/ad-licoreria/warehouses";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";

/**
 * Inventario operativo: consume getOperationalAvailability (mismo motor COP).
 * No cambia reglas: solo visualiza físico / comprometido / disponible / pendiente / déficit.
 */
export default function AdLicoreriaInventario() {
  const {
    products,
    warehouses,
    movements,
    getOperationalAvailability,
    canAccessWarehouse,
    hasPermission,
    getPresentationsFor,
  } = useAdLicoreria();
  const bcv = useAdBcvRate();

  const [warehouseId, setWarehouseId] = useState(
    warehouses.find((w) => w.active)?.id ?? "wh-2",
  );
  const [query, setQuery] = useState("");
  const [costFilter, setCostFilter] = useState<"all" | "with-cost" | "no-cost">(
    "all",
  );

  const canRead = hasPermission("inventory.read");
  const canEditProduct = hasPermission("products.manage");
  const visibleWh = warehouses.filter(
    (w) => w.active && canAccessWarehouse(w.id),
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => p.active)
      .filter(
        (p) =>
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode ?? "").toLowerCase().includes(q),
      )
      .map((p) => {
        const av = getOperationalAvailability(p.id, 0, warehouseId);
        const wh = av.byWarehouse.find((w) => w.warehouseId === warehouseId);
        const pack = findUnitAndBox(getPresentationsFor(p.id));
        const cost = completeAdPrice(p.cost, bcv);
        const fromUnit = completeAdPrice(
          pack.unit?.price ?? { usd: 0, bs: 0 },
          bcv,
        );
        const fromBox = completeAdPrice(
          pack.box?.price ?? { usd: 0, bs: 0 },
          bcv,
        );
        const computed = pricesFromCost(
          cost.usd,
          pack.box?.unitsPerPresentation ?? 1,
          p.defaultUtilityPercent ?? 0,
        );
        const pvpUnit = hasAdMoney(fromUnit)
          ? fromUnit
          : completeAdPrice({ usd: computed.unitSale, bs: 0 }, bcv);
        const pvpBox = hasAdMoney(fromBox)
          ? fromBox
          : pack.box
            ? completeAdPrice({ usd: computed.boxSale, bs: 0 }, bcv)
            : { usd: 0, bs: 0 };
        return {
          product: p,
          physical: wh?.physical ?? 0,
          committed: wh?.committedActive ?? 0,
          softOut: wh?.softReservedOutbound ?? 0,
          available: wh?.availableOperational ?? 0,
          pendingCustomers: av.customerPendingBase,
          deficit: av.customerCommitmentDeficit,
          pendingTransfers: av.pendingTransfers,
          pendingPurchases: av.pendingPurchases,
          status: av.status,
          cost,
          pvpUnit,
          pvpBox,
          hasBox: Boolean(pack.box),
          unitsPerBox: pack.box?.unitsPerPresentation ?? 1,
          brand: p.brand,
        };
      });
  }, [products, query, warehouseId, getOperationalAvailability, getPresentationsFor, bcv]);

  const visibleRows = useMemo(() => {
    if (costFilter === "with-cost") return rows.filter((r) => hasAdMoney(r.cost));
    if (costFilter === "no-cost") return rows.filter((r) => !hasAdMoney(r.cost));
    return rows;
  }, [rows, costFilter]);

  const downloadInventoryCsv = () => {
    const depositoNombre = warehouseLabel(warehouseId, warehouses);
    const filterLabel =
      costFilter === "with-cost"
        ? "con-costo"
        : costFilter === "no-cost"
          ? "sin-costo"
          : "general";
    const headers = [
      "Producto",
      "Marca",
      "SKU",
      "Codigo barras",
      "Deposito",
      "Unidades fisico",
      "Unidades comprometidas",
      "Unidades disponibles",
      "Unidades por caja",
      "Cajas equivalentes",
      "Costo USD",
      "Costo Bs",
      "PVP unidad USD",
      "PVP unidad Bs",
      "PVP caja USD",
      "PVP caja Bs",
      "Estado",
    ];
    const escape = (value: string | number | undefined | null) => {
      const text = String(value ?? "");
      if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
      return text;
    };
    const lines = [
      headers.join(","),
      ...visibleRows.map((r) => {
        const boxes =
          r.unitsPerBox > 1
            ? (r.physical / r.unitsPerBox).toFixed(2)
            : String(r.physical);
        return [
          r.product.name,
          r.brand,
          r.product.sku,
          r.product.barcode,
          depositoNombre,
          r.physical,
          r.committed,
          r.available,
          r.unitsPerBox,
          boxes,
          r.cost.usd.toFixed(4),
          r.cost.bs.toFixed(2),
          r.pvpUnit.usd.toFixed(2),
          r.pvpUnit.bs.toFixed(2),
          r.hasBox ? r.pvpBox.usd.toFixed(2) : "",
          r.hasBox ? r.pvpBox.bs.toFixed(2) : "",
          r.status,
        ]
          .map(escape)
          .join(",");
      }),
    ];
    const blob = new Blob(["\uFEFF" + lines.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventario-${filterLabel}-${depositoNombre.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!canRead) {
    return (
      <div className="ad-panel">
        <p className="text-sm text-[var(--ad-muted)]">
          Sin permiso inventory.read
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="ad-eyebrow">Existencias operativas</p>
          <h1 className="ad-panel-title">Inventario</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--ad-muted)]">
            El comprometido por mesas abiertas reduce el disponible operativo,
            pero el pendiente de clientes cerrados <strong>no bloquea</strong>{" "}
            ventas automáticamente. Déficit = obligación futura vs físico.
          </p>
        </div>
        <Link className="ad-btn" to={AD_LICORERIA_ROUTES.cop}>
          Ir al COP
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          className="ad-select max-w-xs"
          value={warehouseId}
          onChange={(e) => setWarehouseId(e.target.value)}
        >
          {visibleWh.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
        <input
          className="ad-input max-w-sm"
          placeholder="Buscar producto / SKU / código de barras"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex flex-wrap gap-1">
          {(
            [
              ["all", "General"],
              ["with-cost", "Con mi costo"],
              ["no-cost", "Sin costo"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`ad-btn text-xs ${costFilter === value ? "ad-btn--gold" : ""}`}
              onClick={() => setCostFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="ad-btn ad-btn--gold"
          onClick={downloadInventoryCsv}
          disabled={visibleRows.length === 0}
        >
          Descargar CSV
        </button>
        <span className="text-xs text-[var(--ad-muted)]">
          {visibleRows.length} de {rows.length} productos
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5 text-sm">
        <Legend color="var(--ad-text)" label="Físico" />
        <Legend color="var(--ad-gold)" label="Comprometido mesas" />
        <Legend color="var(--ad-success)" label="Disponible operativo" />
        <Legend color="var(--ad-muted)" label="Pendiente clientes" />
        <Legend color="var(--ad-danger)" label="Déficit" />
      </div>

      <section className="ad-panel">
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Depósito</th>
                <th>Costo (CPP)</th>
                <th>PVP unidad</th>
                <th>PVP caja</th>
                <th>U. / caja</th>
                <th>Físico (u. / cajas)</th>
                <th>Disponible (u. / cajas)</th>
                <th>Ficha</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-sm text-[var(--ad-muted)]">
                    {costFilter === "with-cost"
                      ? "No hay productos con costo en este depósito."
                      : costFilter === "no-cost"
                        ? "Todos los productos visibles ya tienen costo."
                        : "No hay productos que coincidan con la búsqueda."}
                  </td>
                </tr>
              ) : null}
              {visibleRows.map((r) => (
                <tr key={r.product.id}>
                  <td>
                    <Link
                      className="hover:underline"
                      to={adInventarioProductoPath(r.product.id)}
                    >
                      {r.product.name}
                    </Link>
                    <div className="text-xs text-[var(--ad-muted)]">
                      {r.product.sku}
                      {r.product.barcode ? ` · EAN ${r.product.barcode}` : ""}
                      {" · "}
                      {r.product.baseUnitLabel}
                    </div>
                  </td>
                  <td>{warehouseLabel(warehouseId, warehouses)}</td>
                  <td>
                    {hasAdMoney(r.cost) ? (
                      <AdPriceDisplay price={r.cost} stacked />
                    ) : (
                      <span className="text-xs text-[var(--ad-muted)]">—</span>
                    )}
                  </td>
                  <td>
                    {hasAdMoney(r.pvpUnit) ? (
                      <AdPriceDisplay price={r.pvpUnit} stacked />
                    ) : (
                      <span className="text-xs text-[var(--ad-muted)]">—</span>
                    )}
                  </td>
                  <td>
                    {r.hasBox && hasAdMoney(r.pvpBox) ? (
                      <AdPriceDisplay price={r.pvpBox} stacked />
                    ) : (
                      <span className="text-xs text-[var(--ad-muted)]">—</span>
                    )}
                  </td>
                  <td>{r.unitsPerBox > 1 ? r.unitsPerBox : "—"}</td>
                  <td>
                    <AdStockBreakdown
                      totalUnits={r.physical}
                      unitsPerBox={r.unitsPerBox}
                    />
                  </td>
                  <td
                    className={
                      r.available <= 0
                        ? "text-[var(--ad-danger)]"
                        : "text-[var(--ad-success)]"
                    }
                  >
                    <AdStockBreakdown
                      totalUnits={r.available}
                      unitsPerBox={r.unitsPerBox}
                      className={
                        r.available <= 0
                          ? "text-[var(--ad-danger)]"
                          : "text-[var(--ad-success)]"
                      }
                    />
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      <Link
                        className="ad-btn text-xs"
                        to={adInventarioProductoPath(r.product.id)}
                      >
                        Ver
                      </Link>
                      {canEditProduct ? (
                        <Link
                          className="ad-btn ad-btn--gold text-xs"
                          to={adInventarioProductoPath(r.product.id, {
                            edit: true,
                          })}
                        >
                          Editar
                        </Link>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="ad-panel">
        <h2 className="ad-panel-title">Kardex reciente</h2>
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Producto</th>
                <th>Base</th>
                <th>Depósito</th>
                <th>Usuario</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {movements.slice(0, 40).map((m) => {
                const product = products.find((p) => p.id === m.productId);
                return (
                  <tr key={m.id}>
                    <td>{m.type}</td>
                    <td>{product?.name}</td>
                    <td>{m.qtyBase}</td>
                    <td>{warehouseLabel(m.warehouseId)}</td>
                    <td>{m.userName}</td>
                    <td>{new Date(m.createdAt).toLocaleString("es-VE")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-[var(--ad-muted)]">
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}
