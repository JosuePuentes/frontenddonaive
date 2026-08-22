import { AdPriceDisplay } from "@/components/ad-licoreria/AdPriceDisplay";
import {
  draftPvpPreview,
  type DraftLine,
  purchaseAmountToDisplay,
} from "@/lib/ad-licoreria/purchase-draft";
import type { PurchaseRateContext } from "@/lib/ad-licoreria/rates";

type Props = {
  line: DraftLine;
  currency: "USD" | "BS";
  rateCtx: PurchaseRateContext;
  onChange: (patch: Partial<DraftLine>) => void;
  onAdd: () => void;
  onCancel: () => void;
  addLabel?: string;
};

function setBuyMode(line: DraftLine, buyMode: "UNIT" | "BOX"): Partial<DraftLine> {
  const nextId =
    buyMode === "BOX"
      ? line.boxPresentationId ?? line.presentationId
      : line.unitPresentationId ?? line.presentationId;
  const upp =
    buyMode === "BOX"
      ? Math.max(2, line.boxUnits || line.unitsPerPresentation)
      : 1;
  const label = buyMode === "BOX" ? `Caja x${upp}` : "Unidad";
  return {
    buyMode,
    costMode: buyMode === "BOX" ? "PRESENTATION" : "UNIT",
    presentationId: nextId,
    presentationLabel: label,
    unitsPerPresentation: upp,
  };
}

export function AdPurchaseLineForm({
  line: l,
  currency,
  rateCtx,
  onChange,
  onAdd,
  onCancel,
  addLabel = "Agregar a la factura",
}: Props) {
  const { m, unitDisp, boxDisp, costUnitDisp } = draftPvpPreview(l, rateCtx);
  const subtotalDisp = purchaseAmountToDisplay(m.subtotal, rateCtx);
  const hasBox = Boolean(l.boxPresentationId) || l.boxUnits > 1;
  const useProtected = rateCtx.useProtected;

  return (
    <article className="ad-purchase-draft space-y-3 rounded border border-[var(--ad-gold)]/40 bg-black/25 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="font-medium text-[var(--ad-gold-soft)]">
            {l.productLabel}
            {l.taxable ? (
              <span className="ml-2 ad-badge ad-badge--ok text-[10px]">IVA</span>
            ) : (
              <span className="ml-2 ad-badge text-[10px]">Exento</span>
            )}
          </div>
          <div className="text-xs text-[var(--ad-muted)]">
            {l.presentationLabel} · {l.unitsPerPresentation} u. por caja
          </div>
        </div>
        <button type="button" className="ad-btn" onClick={onCancel}>
          Cancelar
        </button>
      </div>

      {hasBox ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className={`ad-btn ${l.buyMode === "BOX" ? "ad-btn--gold" : ""}`}
            onClick={() => onChange(setBuyMode(l, "BOX"))}
          >
            Compré por caja
          </button>
          <button
            type="button"
            className={`ad-btn ${l.buyMode === "UNIT" ? "ad-btn--gold" : ""}`}
            onClick={() => onChange(setBuyMode(l, "UNIT"))}
          >
            Compré por unidad
          </button>
        </div>
      ) : null}

      <div>
        <p className="text-xs text-[var(--ad-muted)]">¿Este producto lleva IVA?</p>
        <div className="mt-1 grid max-w-sm grid-cols-2 gap-2">
          <button
            type="button"
            className={`ad-btn ${!l.taxable ? "ad-btn--gold" : ""}`}
            onClick={() => onChange({ taxable: false })}
          >
            Sin IVA
          </button>
          <button
            type="button"
            className={`ad-btn ${l.taxable ? "ad-btn--gold" : ""}`}
            onClick={() => onChange({ taxable: true })}
          >
            Con IVA 16%
          </button>
        </div>
      </div>

      <label className="text-xs text-[var(--ad-muted)]">
        {l.buyMode === "BOX" ? "¿Cuántas cajas compré?" : "¿Cuántas unidades?"}
        <input
          className="ad-input mt-1"
          type="number"
          min={0}
          value={l.qty}
          onChange={(e) => onChange({ qty: Number(e.target.value) })}
        />
      </label>

      <div>
        <p className="text-xs text-[var(--ad-muted)]">
          ¿Cómo viene el costo en la factura?
        </p>
        <div className="mt-1 grid max-w-md grid-cols-2 gap-2">
          {l.buyMode === "BOX" ? (
            <>
              <button
                type="button"
                className={`ad-btn ${l.costMode === "PRESENTATION" ? "ad-btn--gold" : ""}`}
                onClick={() => onChange({ costMode: "PRESENTATION" })}
              >
                Precio por caja
              </button>
              <button
                type="button"
                className={`ad-btn ${l.costMode === "TOTAL" ? "ad-btn--gold" : ""}`}
                onClick={() => onChange({ costMode: "TOTAL" })}
              >
                Total de la línea
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={`ad-btn ${l.costMode === "UNIT" ? "ad-btn--gold" : ""}`}
                onClick={() => onChange({ costMode: "UNIT" })}
              >
                Precio por unidad
              </button>
              <button
                type="button"
                className={`ad-btn ${l.costMode === "TOTAL" ? "ad-btn--gold" : ""}`}
                onClick={() => onChange({ costMode: "TOTAL" })}
              >
                Total de la línea
              </button>
            </>
          )}
        </div>
      </div>

      {l.costMode === "TOTAL" ? (
        <label className="text-xs text-[var(--ad-muted)]">
          Total facturado ({currency}) —{" "}
          {l.buyMode === "BOX" ? `${l.qty} caja(s)` : `${l.qty} unidad(es)`}
          <input
            className="ad-input mt-1"
            type="number"
            step="0.01"
            value={l.lineTotal}
            onChange={(e) => onChange({ lineTotal: Number(e.target.value) })}
          />
        </label>
      ) : l.buyMode === "BOX" ? (
        <label className="text-xs text-[var(--ad-muted)]">
          Costo de cada caja ({currency})
          <input
            className="ad-input mt-1"
            type="number"
            step="0.01"
            value={l.presentationCost}
            onChange={(e) =>
              onChange({ presentationCost: Number(e.target.value) })
            }
          />
        </label>
      ) : (
        <label className="text-xs text-[var(--ad-muted)]">
          Costo de cada unidad ({currency})
          <input
            className="ad-input mt-1"
            type="number"
            step="0.0001"
            value={l.unitCost}
            onChange={(e) => onChange({ unitCost: Number(e.target.value) })}
          />
        </label>
      )}

      <div className="rounded bg-black/20 p-2 text-sm leading-6">
        {useProtected && currency === "USD" ? (
          <p className="text-xs text-[var(--ad-muted)]">
            Pago con tasa protegida: el equivalente en Bs se calcula internamente;
            abajo ve USD (BCV) y Bs de referencia POS.
          </p>
        ) : null}
        {l.buyMode === "BOX" && l.qty > 0 ? (
          <div className="text-[var(--ad-muted)]">
            {l.qty} caja(s) × {m.box.toFixed(2)} {currency} ={" "}
            <strong>{m.subtotal.toFixed(2)}</strong> {currency}
          </div>
        ) : null}
        <div>
          Costo por unidad ({currency}):{" "}
          <strong>{m.unit.toFixed(4)}</strong>
          <span className="ml-2 text-[var(--ad-muted)]">→ POS:</span>{" "}
          <AdPriceDisplay
            price={{ usd: costUnitDisp.usd, bs: costUnitDisp.bs }}
            stacked
          />
        </div>
        <div>
          Total línea ({currency}): <strong>{m.subtotal.toFixed(2)}</strong>
          {l.taxable ? ` + IVA ${m.tax.toFixed(2)}` : ""}
          <div className="text-[var(--ad-muted)]">
            Referencia POS:{" "}
            <AdPriceDisplay
              price={{ usd: subtotalDisp.usd, bs: subtotalDisp.bs }}
              stacked
            />
          </div>
        </div>
        {l.utilityPercent > 0 ? (
          <>
            <div className="mt-1 text-[var(--ad-gold-soft)]">
              PVP estimado (utilidad {l.utilityPercent}%)
            </div>
            <div>
              Unidad:{" "}
              <AdPriceDisplay
                price={{ usd: unitDisp.usd, bs: unitDisp.bs }}
                stacked
              />
            </div>
            <div>
              Caja:{" "}
              <AdPriceDisplay
                price={{ usd: boxDisp.usd, bs: boxDisp.bs }}
                stacked
              />
            </div>
          </>
        ) : (
          <div className="text-xs text-[var(--ad-muted)]">
            Sin utilidad en la ficha: cárguela en Productos para ver el PVP.
          </div>
        )}
      </div>

      <button type="button" className="ad-btn ad-btn--gold w-full" onClick={onAdd}>
        {addLabel}
      </button>
    </article>
  );
}
