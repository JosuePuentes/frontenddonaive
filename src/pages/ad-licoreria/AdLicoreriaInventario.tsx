import { useMemo, useState } from "react";
import { Link } from "react-router";
import {
  AD_LICORERIA_ROUTES,
  adInventarioProductoPath,
} from "@/constants/ad-licoreria-routes";
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
  } = useAdLicoreria();

  const [warehouseId, setWarehouseId] = useState(
    warehouses.find((w) => w.active)?.id ?? "wh-2",
  );
  const [query, setQuery] = useState("");

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
        };
      });
  }, [products, query, warehouseId, getOperationalAvailability]);

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

      <div className="flex flex-wrap gap-2">
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
                <th>Físico</th>
                <th>Comprometido</th>
                <th>En TR / soft</th>
                <th>Disponible</th>
                <th>Pend. clientes</th>
                <th>Déficit</th>
                <th>TR / Compra</th>
                <th>Ficha</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
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
                  <td>{warehouseLabel(warehouseId)}</td>
                  <td>{r.physical}</td>
                  <td>{r.committed}</td>
                  <td>{r.softOut}</td>
                  <td
                    className={
                      r.available <= 0
                        ? "text-[var(--ad-danger)]"
                        : "text-[var(--ad-success)]"
                    }
                  >
                    {r.available}
                  </td>
                  <td>{r.pendingCustomers}</td>
                  <td
                    className={
                      r.deficit > 0 ? "text-[var(--ad-danger)]" : undefined
                    }
                  >
                    {r.deficit}
                  </td>
                  <td className="text-xs text-[var(--ad-muted)]">
                    TR {r.pendingTransfers} · C {r.pendingPurchases}
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
