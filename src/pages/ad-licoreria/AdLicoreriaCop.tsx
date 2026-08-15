import { useMemo, useState } from "react";
import { Link } from "react-router";
import { AD_LICORERIA_ROUTES } from "@/constants/ad-licoreria-routes";
import {
  AD_WH_BODEGON,
  AD_WH_LICORERIA,
  warehouseLabel,
} from "@/lib/ad-licoreria/warehouses";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";

export default function AdLicoreriaCop() {
  const {
    products,
    stockTransfers,
    purchaseRequests,
    customerCommitments,
    getOperationalAvailability,
    getCopDashboard,
    getPresentationsFor,
    createTransferDraft,
    confirmTransfer,
    createPurchaseRequest,
  } = useAdLicoreria();

  const dash = getCopDashboard();
  const [productId, setProductId] = useState("prod-regional");
  const [warehouseId, setWarehouseId] = useState(AD_WH_LICORERIA);
  const [requestQty, setRequestQty] = useState(20);
  const [msg, setMsg] = useState("");
  const [query, setQuery] = useState("");

  const av = getOperationalAvailability(productId, requestQty, warehouseId);
  const product = products.find((p) => p.id === productId);
  const lic = av.byWarehouse.find((w) => w.warehouseId === AD_WH_LICORERIA);
  const bod = av.byWarehouse.find((w) => w.warehouseId === AD_WH_BODEGON);
  const defaultPres = getPresentationsFor(productId)[0];

  const filteredCritical = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return dash.inventory.critical;
    return dash.inventory.critical.filter((c) =>
      c.name.toLowerCase().includes(q),
    );
  }, [dash.inventory.critical, query]);

  const statusLabel =
    av.status === "OK"
      ? "PUEDE CUMPLIRSE"
      : av.status === "TRANSFER_NEEDED"
        ? "ABASTECIMIENTO · TRANSFERIR"
        : av.status === "TRANSFER_AND_PURCHASE"
          ? "TRANSFERIR + COMPRAR"
          : av.status === "COMMITMENT_DEFICIT"
            ? "DÉFICIT COMPROMISO CLIENTE"
            : "COMPRA NECESARIA";

  function prepareTransfer() {
    const qty = av.plan.transferSuggestion;
    if (qty <= 0 || !av.plan.transferFromId || !defaultPres) {
      setMsg("No hay sugerencia de transferencia o presentación");
      return;
    }
    const result = createTransferDraft({
      fromWarehouseId: av.plan.transferFromId,
      toWarehouseId: warehouseId,
      lines: [{ productId, presentationId: defaultPres.id, qty }],
      createdBy: "COP A&D",
      reason: `COP · cubrir pedido de ${requestQty} u. base`,
    });
    if (!result.ok) {
      setMsg(result.error);
      return;
    }
    setMsg(
      `Transferencia borrador ${result.data.number} lista · confirmar en Transferencias`,
    );
  }

  function confirmSuggestedTransfer() {
    const pending = stockTransfers.find(
      (t) =>
        t.status === "BORRADOR" &&
        t.lines.some((l) => l.productId === productId),
    );
    if (!pending) {
      prepareTransfer();
      return;
    }
    const conf = confirmTransfer({
      transferId: pending.id,
      userName: "COP A&D",
    });
    setMsg(
      conf.ok
        ? `Transferencia confirmada ${conf.data.number}`
        : conf.error,
    );
  }

  function createBuy() {
    const need =
      av.plan.purchaseNeeded ||
      Math.max(0, requestQty - av.availableOperationalTotal);
    if (need <= 0 || !defaultPres) {
      setMsg("No hace falta compra");
      return;
    }
    const r = createPurchaseRequest({
      productId,
      presentationId: defaultPres.id,
      qty: need,
      warehouseId,
      createdBy: "COP A&D",
      reason: `Faltante operativo pedido ${requestQty}`,
    });
    setMsg(r.ok ? `Solicitud ${r.data.number} · ${need} u.` : r.error);
  }

  return (
    <div className="ad-cop space-y-5">
      <header className="ad-cop__hero">
        <div>
          <p className="ad-eyebrow">A&D · tiempo real</p>
          <h1 className="ad-display text-4xl text-[var(--ad-gold-soft)] md:text-5xl">
            Centro de operaciones
          </h1>
          <p className="mt-2 max-w-xl text-sm text-[var(--ad-muted)]">
            ¿Tenemos mercancía suficiente? Si no: cuánto falta y dónde
            conseguirla. Facturar, servir, comprometer y transferir son eventos
            distintos.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            className="ad-btn ad-btn--gold"
            to={AD_LICORERIA_ROUTES.copTransferencias}
          >
            Transferencias
          </Link>
          <Link className="ad-btn" to={AD_LICORERIA_ROUTES.copReportes}>
            Reportes COP
          </Link>
          <Link className="ad-btn" to={AD_LICORERIA_ROUTES.ventas}>
            POS
          </Link>
        </div>
      </header>

      <section className="ad-cop__grid">
        <article className="ad-panel ad-cop__stat">
          <div className="ad-stat__label">Cuentas abiertas</div>
          <div className="ad-display text-3xl">{dash.operation.openAccounts}</div>
        </article>
        <article className="ad-panel ad-cop__stat">
          <div className="ad-stat__label">Mesas ocupadas</div>
          <div className="ad-display text-3xl">
            {dash.operation.occupiedTables}
          </div>
        </article>
        <article className="ad-panel ad-cop__stat">
          <div className="ad-stat__label">Mesoneras en piso</div>
          <div className="ad-display text-3xl">
            {dash.operation.workingMesoneras}
          </div>
        </article>
        <article className="ad-panel ad-cop__stat">
          <div className="ad-stat__label">Ventas hoy</div>
          <div className="ad-display text-3xl">
            {dash.operation.completedSalesToday}
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="ad-panel space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="ad-panel-title">Consulta operativa</h2>
            <span
              className={`ad-badge ${
                av.status === "OK" ? "ad-badge--ok" : "ad-badge--warn"
              }`}
            >
              {statusLabel}
            </span>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <select
              className="ad-select"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              {products
                .filter((p) => p.active)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
            <select
              className="ad-select"
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
            >
              <option value={AD_WH_LICORERIA}>Servicio: Licorería</option>
              <option value={AD_WH_BODEGON}>Servicio: Bodegón</option>
            </select>
            <input
              className="ad-input"
              type="number"
              min={0}
              value={requestQty}
              onChange={(e) => setRequestQty(Number(e.target.value) || 0)}
              placeholder="Cantidad pedida"
            />
          </div>

          <div className="ad-cop__avail">
            <div>
              <div className="ad-stat__label">Necesario</div>
              <strong>{av.requestedBase}</strong>
            </div>
            <div>
              <div className="ad-stat__label">Disponible operativo</div>
              <strong>{av.availableOperationalTotal}</strong>
            </div>
            <div>
              <div className="ad-stat__label">Faltante</div>
              <strong className="text-[var(--ad-danger)]">
                {Math.max(0, av.requestedBase - av.availableOperationalTotal)}
              </strong>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="ad-cop__wh">
              <h3 className="ad-eyebrow">Licorería</h3>
              <ul className="space-y-1 text-sm">
                <li>Físico: {lic?.physical ?? 0}</li>
                <li>Comprometido activo: {lic?.committedActive ?? 0}</li>
                <li>Disponible operativo: {lic?.availableOperational ?? 0}</li>
              </ul>
            </div>
            <div className="ad-cop__wh">
              <h3 className="ad-eyebrow">Bodegón</h3>
              <ul className="space-y-1 text-sm">
                <li>Físico: {bod?.physical ?? 0}</li>
                <li>Comprometido activo: {bod?.committedActive ?? 0}</li>
                <li>Disponible operativo: {bod?.availableOperational ?? 0}</li>
              </ul>
            </div>
          </div>

          <div className="grid gap-2 text-sm text-[var(--ad-muted)] sm:grid-cols-3">
            <div>
              Total físico:{" "}
              <strong className="text-[var(--ad-text)]">{av.physicalTotal}</strong>
            </div>
            <div>
              Total comprometido:{" "}
              <strong className="text-[var(--ad-text)]">
                {av.committedActiveTotal}
              </strong>
            </div>
            <div>
              Pendiente clientes:{" "}
              <strong className="text-[var(--ad-text)]">
                {av.customerPendingBase}
              </strong>
              {av.customerCommitmentDeficit > 0 ? (
                <span className="ml-2 ad-badge ad-badge--warn">
                  Déficit {av.customerCommitmentDeficit}
                </span>
              ) : null}
            </div>
          </div>

          {av.plan.transferSuggestion > 0 || av.plan.purchaseNeeded > 0 ? (
            <div className="ad-cop__alert">
              <p>
                {av.plan.transferSuggestion > 0
                  ? `Sugerencia: transferir ${av.plan.transferSuggestion} · ${warehouseLabel(av.plan.transferFromId ?? AD_WH_BODEGON)} → ${warehouseLabel(warehouseId)}`
                  : null}
              </p>
              {av.plan.purchaseNeeded > 0 ? (
                <p>Compra necesaria: {av.plan.purchaseNeeded} unidades</p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                {av.plan.transferSuggestion > 0 ? (
                  <>
                    <button
                      type="button"
                      className="ad-btn ad-btn--gold"
                      onClick={prepareTransfer}
                    >
                      Preparar transferencia {av.plan.transferSuggestion}
                    </button>
                    <button
                      type="button"
                      className="ad-btn ad-btn--primary"
                      onClick={confirmSuggestedTransfer}
                    >
                      Confirmar última borrador
                    </button>
                  </>
                ) : null}
                {av.plan.purchaseNeeded > 0 ? (
                  <button
                    type="button"
                    className="ad-btn"
                    onClick={createBuy}
                  >
                    Crear compra de {av.plan.purchaseNeeded}
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--ad-success)]">
              ● Operación cubrible con disponibilidad actual
              {product ? ` · ${product.name}` : ""}
            </p>
          )}

          {msg ? (
            <p className="text-sm text-[var(--ad-gold-soft)]">{msg}</p>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="ad-panel space-y-3">
            <h2 className="ad-panel-title">Inventario crítico</h2>
            <input
              className="ad-input"
              placeholder="Filtrar producto…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <ul className="max-h-64 space-y-2 overflow-auto text-sm">
              {filteredCritical.map((c) => (
                <li key={c.productId}>
                  <button
                    type="button"
                    className="ad-cop__crit"
                    onClick={() => setProductId(c.productId)}
                  >
                    <span>{c.name}</span>
                    <span className="text-[var(--ad-muted)]">
                      disp {c.availability.availableOperationalTotal} · comp{" "}
                      {c.availability.committedActiveTotal}
                      {c.availability.customerCommitmentDeficit > 0
                        ? ` · déficit ${c.availability.customerCommitmentDeficit}`
                        : ""}
                    </span>
                  </button>
                </li>
              ))}
              {!filteredCritical.length ? (
                <li className="text-[var(--ad-muted)]">Sin alertas</li>
              ) : null}
            </ul>
          </div>

          <div className="ad-panel space-y-2">
            <h2 className="ad-panel-title">Abastecimiento</h2>
            <p className="text-sm text-[var(--ad-muted)]">
              Transferencias pendientes:{" "}
              <strong className="text-[var(--ad-text)]">
                {dash.supply.pendingTransfers.length}
              </strong>
            </p>
            <p className="text-sm text-[var(--ad-muted)]">
              Compras pendientes:{" "}
              <strong className="text-[var(--ad-text)]">
                {dash.supply.pendingPurchases.length}
              </strong>
            </p>
            <p className="text-sm text-[var(--ad-muted)]">
              Compromisos cliente:{" "}
              <strong className="text-[var(--ad-text)]">
                {customerCommitments.filter((c) => c.status === "PENDIENTE")
                  .length}
              </strong>
            </p>
            <p className="text-sm text-[var(--ad-muted)]">
              Solicitudes:{" "}
              <strong className="text-[var(--ad-text)]">
                {purchaseRequests.filter((p) => p.status === "SOLICITADA")
                  .length}
              </strong>
            </p>
          </div>

          <div className="ad-panel space-y-2">
            <h2 className="ad-panel-title">Documentos</h2>
            <p className="text-sm text-[var(--ad-muted)]">
              Pre-facturas: {dash.documents.preliminars.length}
            </p>
            <p className="text-sm text-[var(--ad-muted)]">
              Transferencias recientes: {stockTransfers.length}
            </p>
          </div>
        </div>
      </section>

      <section className="ad-panel space-y-3">
        <h2 className="ad-panel-title">
          Vista por depósito · {warehouseLabel(warehouseId)}
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            className={`ad-btn ${warehouseId === AD_WH_LICORERIA ? "ad-btn--gold" : ""}`}
            onClick={() => setWarehouseId(AD_WH_LICORERIA)}
          >
            Licorería
          </button>
          <button
            type="button"
            className={`ad-btn ${warehouseId === AD_WH_BODEGON ? "ad-btn--gold" : ""}`}
            onClick={() => setWarehouseId(AD_WH_BODEGON)}
          >
            Bodegón
          </button>
        </div>
        <WarehousePanel warehouseId={warehouseId} productId={productId} />
      </section>
    </div>
  );
}

function WarehousePanel({
  warehouseId,
  productId,
}: {
  warehouseId: string;
  productId: string;
}) {
  const {
    getOperationalAvailability,
    stockTransfers,
    purchaseRequests,
    inventory,
  } = useAdLicoreria();
  const av = getOperationalAvailability(productId, 0, warehouseId);
  const wh = av.byWarehouse.find((w) => w.warehouseId === warehouseId);
  const lines = inventory.filter((i) => i.warehouseId === warehouseId);
  const incoming = stockTransfers.filter(
    (t) =>
      t.toWarehouseId === warehouseId &&
      t.status !== "RECIBIDA" &&
      t.status !== "CANCELADA",
  );
  const outgoing = stockTransfers.filter(
    (t) =>
      t.fromWarehouseId === warehouseId &&
      t.status !== "RECIBIDA" &&
      t.status !== "CANCELADA",
  );
  const buys = purchaseRequests.filter(
    (p) =>
      p.warehouseId === warehouseId &&
      (p.status === "SOLICITADA" || p.status === "APROBADA"),
  );

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 text-sm">
      <div>
        <div className="ad-stat__label">Físico (producto)</div>
        <div className="ad-display text-2xl">{wh?.physical ?? 0}</div>
      </div>
      <div>
        <div className="ad-stat__label">Comprometido</div>
        <div className="ad-display text-2xl">{wh?.committedActive ?? 0}</div>
      </div>
      <div>
        <div className="ad-stat__label">Disponible</div>
        <div className="ad-display text-2xl">
          {wh?.availableOperational ?? 0}
        </div>
      </div>
      <div>
        <div className="ad-stat__label">SKUs en depósito</div>
        <div className="ad-display text-2xl">{lines.length}</div>
      </div>
      <div className="text-[var(--ad-muted)]">
        Transferencias entrantes: {incoming.length}
      </div>
      <div className="text-[var(--ad-muted)]">
        Transferencias salientes: {outgoing.length}
      </div>
      <div className="text-[var(--ad-muted)]">
        Compras pendientes: {buys.length}
      </div>
    </div>
  );
}
