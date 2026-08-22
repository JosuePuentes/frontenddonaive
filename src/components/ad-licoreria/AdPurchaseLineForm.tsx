import { AdNumberInput } from "@/components/ad-licoreria/AdNumberInput";
import { AdPriceDisplay } from "@/components/ad-licoreria/AdPriceDisplay";
import {
  draftPvpPreview,
  formatLineQtySummary,
  lineMoney,
  lineQtyBase,
  lineUnitsPerPresentation,
  type DraftLine,
  purchaseAmountToDisplay,
} from "@/lib/ad-licoreria/purchase-draft";
import type { LineRealCost } from "@/lib/ad-licoreria/purchase-invoice";
import { formatVeNumber } from "@/lib/ad-licoreria/number-format";
import type { PurchaseRateContext } from "@/lib/ad-licoreria/rates";

type Props = {
  line: DraftLine;
  currency: "USD" | "BS";
  rateCtx: PurchaseRateContext;
  realCost?: LineRealCost;
  onChange: (patch: Partial<DraftLine>) => void;
  onAdd: () => void;
  onCancel: () => void;
  addLabel?: string;
};

function setBuyMode(line: DraftLine, buyMode: "UNIT" | "BOX"): Partial<DraftLine> {
  const m = lineMoney(line);
  const boxUpp = Math.max(2, line.boxUnits || line.unitsPerPresentation || 1);
  const nextId =
    buyMode === "BOX"
      ? line.boxPresentationId ?? line.presentationId
      : line.unitPresentationId ?? line.presentationId;
  const upp = buyMode === "BOX" ? boxUpp : 1;
  let costMode = line.costMode;
  if (buyMode === "UNIT" && costMode === "PRESENTATION") {
    costMode = "UNIT";
  }
  return {
    buyMode,
    costMode,
    presentationId: nextId,
    presentationLabel: buyMode === "BOX" ? `Caja x${boxUpp}` : "Unidad suelta",
    unitsPerPresentation: upp,
    unitCost: m.unit,
    presentationCost: m.box,
    lineTotal: m.subtotal,
  };
}

export function AdPurchaseLineForm({
  line: l,
  currency,
  rateCtx,
  realCost,
  onChange,
  onAdd,
  onCancel,
  addLabel = "Agregar a la factura",
}: Props) {
  const { m, unitDisp, boxDisp, costUnitDisp } = draftPvpPreview(l, rateCtx);
  const subtotalDisp = purchaseAmountToDisplay(m.subtotal, rateCtx);
  const realUnitDisp = realCost
    ? purchaseAmountToDisplay(realCost.realUnit, rateCtx)
    : null;
  const realBoxDisp = realCost
    ? purchaseAmountToDisplay(realCost.realBox, rateCtx)
    : null;
  const hasBox = Boolean(l.boxPresentationId) || l.boxUnits > 1;
  const boxUpp = Math.max(1, l.boxUnits || l.unitsPerPresentation || 1);
  const useProtected = rateCtx.useProtected;
  const qtyBase = lineQtyBase(l);

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
            {l.buyMode === "BOX" ? (
              <>
                {l.presentationLabel} · ficha: <strong>{boxUpp} u. por caja</strong>
              </>
            ) : (
              <>
                Unidad suelta · ficha caja x{boxUpp} u. (no aplica en esta compra)
              </>
            )}
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
        {l.buyMode === "BOX"
          ? `Cantidad de cajas (cada caja = ${boxUpp} u.)`
          : "Cantidad de unidades sueltas"}
        <AdNumberInput
          value={l.qty}
          decimals={0}
          min={0}
          onChange={(qty) => onChange({ qty })}
        />
        {l.qty > 0 ? (
          <span className="mt-1 block text-[var(--ad-gold-soft)]">
            → {formatLineQtySummary(l)}
          </span>
        ) : null}
      </label>

      <div>
        <p className="text-xs text-[var(--ad-muted)]">
          ¿Cómo viene el precio en la factura del proveedor?
        </p>
        <div
          className={`mt-1 grid max-w-lg gap-2 ${l.buyMode === "BOX" ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2"}`}
        >
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
                Total lineal
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
                Total lineal
              </button>
            </>
          )}
        </div>
        {l.buyMode === "BOX" && l.costMode === "UNIT" ? (
          <p className="mt-1 text-xs text-[var(--ad-muted)]">
            Use esto si la factura trae precio unitario aunque haya comprado cajas
            de {boxUpp} u.
          </p>
        ) : null}
      </div>

      {l.costMode === "TOTAL" ? (
        <label className="text-xs text-[var(--ad-muted)]">
          Total lineal de la línea ({currency}) — {qtyBase} u. en total
          <AdNumberInput
            value={l.lineTotal}
            decimals={2}
            min={0}
            onChange={(lineTotal) => onChange({ lineTotal })}
          />
        </label>
      ) : l.costMode === "PRESENTATION" ? (
        <label className="text-xs text-[var(--ad-muted)]">
          Precio de cada caja ({currency}, sin IVA) · {boxUpp} u. por caja
          <AdNumberInput
            value={l.presentationCost}
            decimals={2}
            min={0}
            onChange={(presentationCost) => onChange({ presentationCost })}
          />
        </label>
      ) : (
        <label className="text-xs text-[var(--ad-muted)]">
          Precio de cada unidad ({currency}, sin IVA)
          {l.buyMode === "BOX" ? ` · dentro de caja x${boxUpp}` : ""}
          <AdNumberInput
            value={l.unitCost}
            decimals={4}
            min={0}
            onChange={(unitCost) => onChange({ unitCost })}
          />
        </label>
      )}

      <div className="rounded bg-black/20 p-2 text-sm leading-6">
        {useProtected && currency === "USD" ? (
          <p className="text-xs text-[var(--ad-muted)]">
            Pago con tasa protegida: el equivalente en Bs se calcula internamente.
          </p>
        ) : null}
        {rateCtx.invoiceRate && currency === "BS" ? (
          <p className="text-xs text-[var(--ad-muted)]">
            Tasa factura {formatVeNumber(rateCtx.invoiceRate, 2)} Bs/USD
          </p>
        ) : null}
        <div className="text-[var(--ad-gold-soft)] text-xs font-medium">
          Inventario: entrarán {qtyBase} u.
          {l.buyMode === "BOX" && boxUpp > 1
            ? ` (${l.qty} caja(s) × ${boxUpp} u.)`
            : ""}
        </div>
        {l.buyMode === "BOX" && l.qty > 0 && l.costMode !== "TOTAL" ? (
          <div className="text-[var(--ad-muted)]">
            {l.qty} caja(s) × {formatVeNumber(m.box, 2)} {currency}/caja ={" "}
            <strong>{formatVeNumber(m.subtotal, 2)}</strong> {currency}
          </div>
        ) : null}
        {l.buyMode === "BOX" && l.costMode === "UNIT" && l.qty > 0 ? (
          <div className="text-[var(--ad-muted)]">
            {l.qty} caja(s) × {boxUpp} u. × {formatVeNumber(m.unit, 4)} {currency}/u.
          </div>
        ) : null}
        <div>
          Costo unitario ({currency}): <strong>{formatVeNumber(m.unit, 4)}</strong>
          {l.buyMode === "BOX" ? (
            <span className="text-[var(--ad-muted)]">
              {" "}
              · caja ({boxUpp} u.): {formatVeNumber(m.box, 2)}
            </span>
          ) : null}
          <span className="ml-2 text-[var(--ad-muted)]">→ ref. POS:</span>{" "}
          <AdPriceDisplay
            price={{ usd: costUnitDisp.usd, bs: costUnitDisp.bs }}
            stacked
          />
        </div>
        {realCost && realCost.realUnit > m.unit ? (
          <div className="text-[var(--ad-success)]">
            Costo real/u.: {formatVeNumber(realCost.realUnit, 4)} {currency}
            {realUnitDisp ? (
              <span className="ml-2">
                <AdPriceDisplay
                  price={{ usd: realUnitDisp.usd, bs: realUnitDisp.bs }}
                  stacked
                />
              </span>
            ) : null}
            {hasBox ? (
              <div className="text-xs">
                Costo real/caja ({lineUnitsPerPresentation(l)} u.):{" "}
                {formatVeNumber(realCost.realBox, 2)} {currency}
                {realBoxDisp ? (
                  <span className="ml-2">
                    <AdPriceDisplay
                      price={{ usd: realBoxDisp.usd, bs: realBoxDisp.bs }}
                      stacked
                    />
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
        <div>
          Subtotal línea ({currency}): <strong>{formatVeNumber(m.subtotal, 2)}</strong>
          {l.taxable ? ` + IVA ${formatVeNumber(m.tax, 2)}` : ""}
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
              PVP estimado (utilidad {l.utilityPercent}% sobre PVP)
            </div>
            <div>
              Unidad:{" "}
              <AdPriceDisplay price={{ usd: unitDisp.usd, bs: unitDisp.bs }} stacked />
            </div>
            {hasBox ? (
              <div>
                Caja x{boxUpp}:{" "}
                <AdPriceDisplay price={{ usd: boxDisp.usd, bs: boxDisp.bs }} stacked />
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      <button type="button" className="ad-btn ad-btn--gold w-full" onClick={onAdd}>
        {addLabel}
      </button>
    </article>
  );
}
