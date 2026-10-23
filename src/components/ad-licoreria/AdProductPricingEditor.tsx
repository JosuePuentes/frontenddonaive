import { useMemo } from "react";
import { AdNumberInput } from "@/components/ad-licoreria/AdNumberInput";
import { AdPriceDisplay } from "@/components/ad-licoreria/AdPriceDisplay";
import {
  marginFromSale,
  saleFromMargin,
} from "@/lib/ad-licoreria/pack";
import { completeAdPrice } from "@/lib/ad-licoreria/rates";
import { formatVeNumber } from "@/lib/ad-licoreria/number-format";

export type PricingRowState = {
  presentationId: string;
  label: string;
  unitsPerPresentation: number;
  saleUsd: number;
  marginPercent: number;
  /** Último campo editado para evitar loops al sincronizar. */
  lastEdited: "sale" | "margin" | null;
};

type Props = {
  rows: PricingRowState[];
  unitCostUsd: number;
  boxCostUsd: number;
  bcv: number;
  onChange: (presentationId: string, patch: Partial<PricingRowState>) => void;
};

export function AdProductPricingEditor({
  rows,
  unitCostUsd,
  boxCostUsd,
  bcv,
  onChange,
}: Props) {
  const costUnit = completeAdPrice({ usd: unitCostUsd, bs: 0 }, bcv);
  const costBox = completeAdPrice({ usd: boxCostUsd, bs: 0 }, bcv);

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--ad-muted)]">
        Defina el precio de venta (PVP) por presentación. Puede escribir el PVP
        en USD y verá el margen, o escribir el margen % contable y se calculará
        el PVP. El margen es sobre el precio de venta (contable), no markup
        lineal sobre el costo.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 text-sm">
        <div className="rounded border border-[var(--ad-line)] p-3">
          <div className="text-xs text-[var(--ad-muted)]">Costo por unidad (CPP)</div>
          <div className="mt-1 font-medium">
            {unitCostUsd > 0 ? (
              <AdPriceDisplay price={costUnit} stacked />
            ) : (
              "— (confirme una compra)"
            )}
          </div>
        </div>
        {boxCostUsd > 0 ? (
          <div className="rounded border border-[var(--ad-line)] p-3">
            <div className="text-xs text-[var(--ad-muted)]">Costo por caja</div>
            <div className="mt-1 font-medium">
              <AdPriceDisplay price={costBox} stacked />
            </div>
          </div>
        ) : null}
      </div>

      {rows.map((row) => (
        <PricingRowEditor
          key={row.presentationId}
          row={row}
          unitCostUsd={unitCostUsd}
          presentationCostUsd={
            row.unitsPerPresentation > 1
              ? unitCostUsd * row.unitsPerPresentation
              : unitCostUsd
          }
          bcv={bcv}
          onChange={onChange}
        />
      ))}
    </div>
  );
}

function PricingRowEditor({
  row,
  unitCostUsd,
  presentationCostUsd,
  bcv,
  onChange,
}: {
  row: PricingRowState;
  unitCostUsd: number;
  presentationCostUsd: number;
  bcv: number;
  onChange: (presentationId: string, patch: Partial<PricingRowState>) => void;
}) {
  const isBox = row.unitsPerPresentation > 1;
  const costForMargin = isBox ? presentationCostUsd : unitCostUsd;

  const preview = useMemo(() => {
    const sale = row.saleUsd;
    const margin =
      row.lastEdited === "margin"
        ? row.marginPercent
        : marginFromSale(costForMargin, sale);
    const saleFromMarginVal =
      row.lastEdited === "sale"
        ? sale
        : saleFromMargin(costForMargin, row.marginPercent);
    return {
      margin,
      saleUsd: saleFromMarginVal,
      display: completeAdPrice({ usd: saleFromMarginVal, bs: 0 }, bcv),
    };
  }, [
    row.saleUsd,
    row.marginPercent,
    row.lastEdited,
    costForMargin,
    unitCostUsd,
    row.unitsPerPresentation,
    bcv,
  ]);

  return (
    <article className="rounded border border-[var(--ad-gold)]/30 bg-black/20 p-3 space-y-3">
      <h3 className="font-medium text-[var(--ad-gold-soft)]">
        {row.label}
        {isBox ? ` · ${row.unitsPerPresentation} u. por caja` : " · venta por unidad"}
      </h3>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-xs text-[var(--ad-muted)]">
          PVP en USD ({isBox ? "precio de la caja completa" : "precio por unidad"})
          <AdNumberInput
            value={row.saleUsd}
            decimals={2}
            min={0}
            onChange={(saleUsd) =>
              onChange(row.presentationId, {
                saleUsd,
                marginPercent: marginFromSale(costForMargin, saleUsd),
                lastEdited: "sale",
              })
            }
          />
        </label>
        <label className="text-xs text-[var(--ad-muted)]">
          Margen contable % (sobre PVP, no sobre costo)
          <AdNumberInput
            value={row.marginPercent}
            decimals={1}
            min={0}
            max={99.9}
            onChange={(marginPercent) =>
              onChange(row.presentationId, {
                marginPercent,
                saleUsd: saleFromMargin(costForMargin, marginPercent),
                lastEdited: "margin",
              })
            }
          />
        </label>
        <div className="text-xs text-[var(--ad-muted)] self-end pb-1">
          <div>Equivalente Bs (BCV)</div>
          <div className="mt-1 font-medium text-[var(--ad-ink)]">
            {row.saleUsd > 0 ? (
              <AdPriceDisplay price={preview.display} stacked />
            ) : (
              "—"
            )}
          </div>
          {costForMargin > 0 && row.saleUsd > 0 ? (
            <div className="mt-1 text-[var(--ad-success)]">
              Utilidad: {formatVeNumber(preview.margin, 1)}%
            </div>
          ) : null}
        </div>
      </div>

      {costForMargin > 0 ? (
        <p className="text-xs text-[var(--ad-muted)]">
          Costo base: ${formatVeNumber(costForMargin, 2)} USD
          {isBox ? " (caja)" : " (unidad)"} → PVP ${formatVeNumber(row.saleUsd, 2)} USD
        </p>
      ) : null}
    </article>
  );
}

export function buildPricingRowsFromPresentations(
  presentations: {
    id: string;
    name: string;
    unitsPerPresentation: number;
    price: { usd: number; bs: number };
  }[],
  unitCostUsd: number,
  defaultUtility: number,
): PricingRowState[] {
  const sorted = [...presentations].sort(
    (a, b) => a.unitsPerPresentation - b.unitsPerPresentation,
  );
  return sorted.map((pres) => {
    const isBox = pres.unitsPerPresentation > 1;
    const cost = isBox
      ? unitCostUsd * pres.unitsPerPresentation
      : unitCostUsd;
    const stored = pres.price.usd;
    const saleUsd =
      stored > 0 ? stored : cost > 0 ? saleFromMargin(cost, defaultUtility) : 0;
    const marginPercent =
      stored > 0 ? marginFromSale(cost, stored) : defaultUtility;
    return {
      presentationId: pres.id,
      label: pres.name,
      unitsPerPresentation: pres.unitsPerPresentation,
      saleUsd,
      marginPercent,
      lastEdited: null,
    };
  });
}
