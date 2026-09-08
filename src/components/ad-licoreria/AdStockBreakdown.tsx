import {
  formatStockBreakdown,
  stockBoxHint,
  splitStockUnits,
} from "@/lib/ad-licoreria/stock-units";

type Props = {
  totalUnits: number;
  unitsPerBox: number;
  showHint?: boolean;
  className?: string;
};

export function AdStockBreakdown({
  totalUnits,
  unitsPerBox,
  showHint = true,
  className = "",
}: Props) {
  const s = splitStockUnits(totalUnits, unitsPerBox);
  const hint = showHint ? stockBoxHint(totalUnits, unitsPerBox) : null;

  return (
    <div className={className}>
      <div className="font-medium tabular-nums">{formatStockBreakdown(totalUnits, unitsPerBox)}</div>
      {s.hasBoxPack ? (
        <div className="mt-0.5 text-xs text-[var(--ad-muted)] tabular-nums">
          {s.fullBoxes} caja{s.fullBoxes === 1 ? "" : "s"} · {s.looseUnits} u. suelta
          {s.looseUnits === 1 ? "" : "s"}
        </div>
      ) : null}
      {hint ? (
        <div className="mt-0.5 text-xs text-[var(--ad-gold-soft)]">{hint}</div>
      ) : null}
    </div>
  );
}
