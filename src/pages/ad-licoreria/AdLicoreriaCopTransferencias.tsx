import { useMemo, useState } from "react";
import { Link } from "react-router";
import { AD_LICORERIA_ROUTES } from "@/constants/ad-licoreria-routes";
import {
  AD_WH_BODEGON,
  AD_WH_LICORERIA,
  warehouseLabel,
} from "@/lib/ad-licoreria/warehouses";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import { resolveAdResult } from "@/services/ad-licoreria/async-result";

type DraftLine = {
  productId: string;
  presentationId: string;
  qty: number;
  observation?: string;
};

export default function AdLicoreriaCopTransferencias() {
  const {
    products,
    presentations,
    stockTransfers,
    getPresentationsFor,
    createTransferDraft,
    confirmTransfer,
    advanceTransferStatus,
    logDocumentAction,
  } = useAdLicoreria();

  const [fromId, setFromId] = useState(AD_WH_BODEGON);
  const [toId, setToId] = useState(AD_WH_LICORERIA);
  const [reason, setReason] = useState("Reposición operativa");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [presentationId, setPresentationId] = useState("");
  const [qty, setQty] = useState(10);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const availablePres = getPresentationsFor(productId);
  const activePres =
    presentations.find((p) => p.id === presentationId) ?? availablePres[0];
  const preview = stockTransfers.find((t) => t.id === previewId);

  const sorted = useMemo(
    () =>
      [...stockTransfers].sort((a, b) =>
        a.createdAt < b.createdAt ? 1 : -1,
      ),
    [stockTransfers],
  );

  function addLine() {
    if (!activePres || qty <= 0) return;
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.presentationId === activePres.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + qty };
        return next;
      }
      return [
        ...prev,
        {
          productId,
          presentationId: activePres.id,
          qty,
        },
      ];
    });
  }

  async function createDraft() {
    const r = await resolveAdResult(
      createTransferDraft({
        fromWarehouseId: fromId,
        toWarehouseId: toId,
        lines,
        createdBy: "COP A&D",
        reason,
        notes: notes.trim() || undefined,
      }),
    );
    if (!r.ok) {
      setMsg(r.error);
      return;
    }
    setPreviewId(r.data.id);
    setLines([]);
    setMsg(`Preliminar ${r.data.number}`);
  }

  async function doConfirm() {
    if (!previewId) return;
    const r = await resolveAdResult(
      confirmTransfer({ transferId: previewId, userName: "COP A&D" }),
    );
    setMsg(r.ok ? `Confirmada ${r.data.number}` : r.error);
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="ad-eyebrow">Documento de inventario</p>
          <h1 className="ad-display text-4xl text-[var(--ad-gold-soft)]">
            Transferencias
          </h1>
          <p className="mt-1 text-sm text-[var(--ad-muted)]">
            Borrador no mueve stock. Salida en ENVIADA · entrada en RECIBIDA.
            Confirmar ejecuta el ciclo completo auditado.
          </p>
        </div>
        <Link className="ad-btn" to={AD_LICORERIA_ROUTES.cop}>
          ← COP
        </Link>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="ad-panel space-y-3">
          <h2 className="ad-panel-title">Nueva transferencia</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <select
              className="ad-select"
              value={fromId}
              onChange={(e) => setFromId(e.target.value)}
            >
              <option value={AD_WH_BODEGON}>Origen: Bodegón</option>
              <option value={AD_WH_LICORERIA}>Origen: Licorería</option>
            </select>
            <select
              className="ad-select"
              value={toId}
              onChange={(e) => setToId(e.target.value)}
            >
              <option value={AD_WH_LICORERIA}>Destino: Licorería</option>
              <option value={AD_WH_BODEGON}>Destino: Bodegón</option>
            </select>
          </div>
          <input
            className="ad-input"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motivo"
          />
          <textarea
            className="ad-input min-h-16"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observaciones"
          />

          <div className="grid gap-2 sm:grid-cols-[1.2fr_1fr_0.5fr_auto]">
            <select
              className="ad-select"
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                setPresentationId("");
              }}
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
              value={activePres?.id ?? ""}
              onChange={(e) => setPresentationId(e.target.value)}
            >
              {availablePres.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <input
              className="ad-input"
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
            />
            <button type="button" className="ad-btn" onClick={addLine}>
              +
            </button>
          </div>

          <ul className="space-y-1 text-sm">
            {lines.map((l, i) => {
              const prod = products.find((p) => p.id === l.productId);
              const pres = presentations.find((p) => p.id === l.presentationId);
              return (
                <li
                  key={`${l.presentationId}-${i}`}
                  className="flex justify-between gap-2 border-b border-[var(--ad-line)] py-1"
                >
                  <span>
                    {prod?.name} · {pres?.name} × {l.qty}
                  </span>
                  <button
                    type="button"
                    className="ad-btn"
                    onClick={() =>
                      setLines((list) => list.filter((_, idx) => idx !== i))
                    }
                  >
                    Quitar
                  </button>
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            className="ad-btn ad-btn--gold"
            onClick={createDraft}
            disabled={!lines.length}
          >
            Generar preliminar
          </button>
          {msg ? (
            <p className="text-sm text-[var(--ad-gold-soft)]">{msg}</p>
          ) : null}
        </section>

        <section className="ad-panel space-y-3">
          <h2 className="ad-panel-title">Preliminar / documento</h2>
          {preview ? (
            <div className="ad-doc space-y-3">
              <p className="ad-eyebrow">Transferencia de inventario</p>
              <p className="ad-display text-2xl">{preview.number}</p>
              <p className="text-sm">
                Origen:{" "}
                <strong>{warehouseLabel(preview.fromWarehouseId)}</strong>
                <br />
                Destino:{" "}
                <strong>{warehouseLabel(preview.toWarehouseId)}</strong>
              </p>
              <p className="text-sm text-[var(--ad-muted)]">
                Estado: {preview.status} · Responsable: {preview.createdBy}
                <br />
                Motivo: {preview.reason ?? "—"}
                <br />
                Fecha: {new Date(preview.createdAt).toLocaleString("es-VE")}
              </p>
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Presentación</th>
                    <th>Cant.</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.lines.map((l) => (
                    <tr key={l.id}>
                      <td>
                        {products.find((p) => p.id === l.productId)?.name}
                      </td>
                      <td>
                        {
                          presentations.find((p) => p.id === l.presentationId)
                            ?.name
                        }
                      </td>
                      <td>{l.qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex flex-wrap gap-2">
                {preview.status === "BORRADOR" ? (
                  <button
                    type="button"
                    className="ad-btn ad-btn--gold"
                    onClick={doConfirm}
                  >
                    Confirmar
                  </button>
                ) : null}
                <button
                  type="button"
                  className="ad-btn"
                  onClick={() =>
                    logDocumentAction({
                      action: "print",
                      entity: "transfer",
                      entityId: preview.id,
                      userName: "COP A&D",
                      detail: preview.number,
                    })
                  }
                >
                  Imprimir
                </button>
                <button
                  type="button"
                  className="ad-btn"
                  onClick={() =>
                    logDocumentAction({
                      action: "download",
                      entity: "transfer",
                      entityId: preview.id,
                      userName: "COP A&D",
                      detail: preview.number,
                    })
                  }
                >
                  Descargar
                </button>
                {preview.status === "BORRADOR" ? (
                  <button
                    type="button"
                    className="ad-btn"
                    onClick={() =>
                      advanceTransferStatus({
                        transferId: preview.id,
                        userName: "COP A&D",
                        toStatus: "CANCELADA",
                      })
                    }
                  >
                    Cancelar
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--ad-muted)]">
              Genere un preliminar o seleccione una transferencia de la lista.
            </p>
          )}
        </section>
      </div>

      <section className="ad-panel">
        <h2 className="ad-panel-title mb-3">Historial</h2>
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Número</th>
                <th>Origen</th>
                <th>Destino</th>
                <th>Líneas</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {sorted.map((t) => (
                <tr key={t.id}>
                  <td>{t.number}</td>
                  <td>{warehouseLabel(t.fromWarehouseId)}</td>
                  <td>{warehouseLabel(t.toWarehouseId)}</td>
                  <td>{t.lines.length}</td>
                  <td>
                    <span className="ad-badge">{t.status}</span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="ad-btn"
                      onClick={() => setPreviewId(t.id)}
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
              {!sorted.length ? (
                <tr>
                  <td colSpan={6} className="text-[var(--ad-muted)]">
                    Sin transferencias
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
