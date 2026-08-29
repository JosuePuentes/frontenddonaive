import { AdNumberInput } from "@/components/ad-licoreria/AdNumberInput";
import { AdPriceDisplay } from "@/components/ad-licoreria/AdPriceDisplay";
import {
  draftPvpPreview,
  formatLineQtySummary,
  lineMoney,
  lineQtyBase,
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

/** Precio unitario en factura: por caja si compró por caja, por unidad suelta si no. */
function invoiceUnitarioCostMode(buyMode: "UNIT" | "BOX"): "UNIT" | "PRESENTATION" {
  return buyMode === "BOX" ? "PRESENTATION" : "UNIT";
}

function setBuyMode(line: DraftLine, buyMode: "UNIT" | "BOX"): Partial<DraftLine> {
  const m = lineMoney(line);
  const boxUpp = Math.max(2, line.boxUnits || line.unitsPerPresentation || 1);
  const nextId =
    buyMode === "BOX"
      ? line.boxPresentationId ?? line.presentationId
      : line.unitPresentationId ?? line.presentationId;
  const upp = buyMode === "BOX" ? boxUpp : 1;
  let costMode = line.costMode;
  if (costMode !== "TOTAL") {
    costMode = invoiceUnitarioCostMode(buyMode);
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

function setPriceKind(
  line: DraftLine,
  kind: "UNITARIO" | "LINEAL",
): Partial<DraftLine> {
  if (kind === "LINEAL") return { costMode: "TOTAL" };
  return { costMode: invoiceUnitarioCostMode(line.buyMode) };
}

function isUnitarioMode(l: DraftLine): boolean {
  return l.costMode === invoiceUnitarioCostMode(l.buyMode);
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
  const realUnitDisp = realCost
    ? purchaseAmountToDisplay(realCost.realUnit, rateCtx)
    : null;
  const hasBox = Boolean(l.boxPresentationId) || l.boxUnits > 1;
  const boxUpp = Math.max(1, l.boxUnits || l.unitsPerPresentation || 1);
  const useProtected = rateCtx.useProtected;
  const qtyBase = lineQtyBase(l);
  const unitario = isUnitarioMode(l);

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
                Ficha: <strong>caja x{boxUpp} u.</strong> — en factura 1 unitario = 1 caja
              </>
            ) : (
              <>
                Compra por <strong>unidad suelta</strong> — en factura 1 unitario = 1 u.
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
          ? `Cantidad de cajas (c/u caja trae ${boxUpp} u.)`
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
          ¿Cómo viene el precio en la factura?
        </p>
        <div className="mt-1 grid max-w-md grid-cols-2 gap-2">
          <button
            type="button"
            className={`ad-btn ${unitario ? "ad-btn--gold" : ""}`}
            onClick={() => onChange(setPriceKind(l, "UNITARIO"))}
          >
            Precio unitario
          </button>
          <button
            type="button"
            className={`ad-btn ${l.costMode === "TOTAL" ? "ad-btn--gold" : ""}`}
            onClick={() => onChange(setPriceKind(l, "LINEAL"))}
          >
            Total lineal
          </button>
        </div>
        <p className="mt-1 text-xs text-[var(--ad-muted)]">
          {l.buyMode === "BOX" ? (
            unitario ? (
              <>
                <strong>Unitario = precio por caja</strong> (como dice la factura). El
                sistema calcula el costo de cada una de las {boxUpp} u.
              </>
            ) : (
              <>Total de toda la línea ({l.qty} caja(s), {qtyBase} u.).</>
            )
          ) : unitario ? (
            <>Unitario = precio por unidad suelta.</>
          ) : (
            <>Total lineal de la línea ({l.qty} u.).</>
          )}
        </p>
      </div>

      {l.costMode === "TOTAL" ? (
        <label className="text-xs text-[var(--ad-muted)]">
          Total lineal ({currency}, sin IVA) — {qtyBase} u. en inventario
          <AdNumberInput
            value={l.lineTotal}
            decimals={2}
            min={0}
            onChange={(lineTotal) => onChange({ lineTotal })}
          />
        </label>
      ) : l.buyMode === "BOX" ? (
        <label className="text-xs text-[var(--ad-muted)]">
          Precio unitario en factura ({currency}) —{" "}
          <strong>1 u. factura = 1 caja de {boxUpp} u.</strong>
          <AdNumberInput
            value={l.presentationCost}
            decimals={2}
            min={0}
            onChange={(presentationCost) => onChange({ presentationCost })}
          />
          {l.presentationCost > 0 ? (
            <span className="mt-1 block text-[var(--ad-gold-soft)]">
              → Sistema: {formatVeNumber(l.presentationCost / boxUpp, 4)} {currency}{" "}
              por unidad suelta ({formatVeNumber(l.presentationCost, 2)} ÷ {boxUpp})
            </span>
          ) : null}
        </label>
      ) : (
        <label className="text-xs text-[var(--ad-muted)]">
          Precio unitario en factura ({currency}) — 1 u. = 1 unidad suelta
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
            Pago con tasa protegida: equivalente Bs interno.
          </p>
        ) : null}
        {rateCtx.invoiceRate && currency === "BS" ? (
          <p className="text-xs text-[var(--ad-muted)]">
            Tasa factura {formatVeNumber(rateCtx.invoiceRate, 2)} Bs/USD
          </p>
        ) : null}
        <div className="text-[var(--ad-gold-soft)] text-xs font-medium">
          Inventario: +{qtyBase} u.
          {l.buyMode === "BOX" ? ` (${l.qty} caja(s) × ${boxUpp} u./caja)` : ""}
        </div>
        {l.buyMode === "BOX" && l.qty > 0 && unitario ? (
          <div className="text-[var(--ad-muted)]">
            {l.qty} caja(s) × {formatVeNumber(m.box, 2)} {currency}/caja (unitario factura)
            = <strong>{formatVeNumber(m.subtotal, 2)}</strong> {currency}
          </div>
        ) : null}
        {l.buyMode === "UNIT" && l.qty > 0 && unitario ? (
          <div className="text-[var(--ad-muted)]">
            {l.qty} u. × {formatVeNumber(m.unit, 4)} {currency}/u. ={" "}
            <strong>{formatVeNumber(m.subtotal, 2)}</strong> {currency}
          </div>
        ) : null}
        <div>
          Costo por unidad suelta ({currency}):{" "}
          <strong>{formatVeNumber(m.unit, 4)}</strong>
          {l.buyMode === "BOX" && boxUpp > 1 ? (
            <span className="text-[var(--ad-muted)]">
              {" "}
              (calculado: {formatVeNumber(m.box, 2)} ÷ {boxUpp})
            </span>
          ) : null}
          <span className="ml-2 text-[var(--ad-muted)]">→ ref. POS:</span>{" "}
          <AdPriceDisplay
            price={{ usd: costUnitDisp.usd, bs: costUnitDisp.bs }}
            stacked
          />
        </div>
        {l.buyMode === "BOX" && boxUpp > 1 ? (
          <div className="text-[var(--ad-muted)]">
            Costo por caja ({boxUpp} u.): {formatVeNumber(m.box, 2)} {currency}
          </div>
        ) : null}
        {realCost && realCost.realUnit > m.unit ? (
          <div className="text-[var(--ad-success)]">
            Costo real/u. suelta: {formatVeNumber(realCost.realUnit, 4)} {currency}
            {realUnitDisp ? (
              <span className="ml-2">
                <AdPriceDisplay
                  price={{ usd: realUnitDisp.usd, bs: realUnitDisp.bs }}
                  stacked
                />
              </span>
            ) : null}
            {l.buyMode === "BOX" ? (
              <div className="text-xs">
                Costo real/caja: {formatVeNumber(realCost.realBox, 2)} {currency}
              </div>
            ) : null}
          </div>
        ) : null}
        <div>
          Subtotal ({currency}): <strong>{formatVeNumber(m.subtotal, 2)}</strong>
          {l.taxable ? ` + IVA ${formatVeNumber(m.tax, 2)}` : ""}
        </div>
        {l.utilityPercent > 0 ? (
          <>
            <div className="mt-1 text-[var(--ad-gold-soft)]">
              PVP estimado (utilidad {l.utilityPercent}%)
            </div>
            <div>
              Unidad suelta:{" "}
              <AdPriceDisplay price={{ usd: unitDisp.usd, bs: unitDisp.bs }} stacked />
            </div>
            {hasBox && l.buyMode === "BOX" ? (
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
