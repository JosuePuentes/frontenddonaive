import { formatAdPrice } from "@/lib/ad-licoreria/conversions";
import type { AdPrice } from "@/types/ad-licoreria";

type Props = {
  productName: string;
  unitPrice?: AdPrice;
  boxPrice?: AdPrice;
  boxUnits?: number;
  onPick: (mode: "UNIT" | "BOX") => void;
  onCancel: () => void;
};

/** Modal rápido: ¿vender/comprar por unidad o por caja? */
export function AdPackPickPrompt(props: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ad-pack-pick-title"
    >
      <div className="ad-panel w-full max-w-sm space-y-4">
        <h2 id="ad-pack-pick-title" className="text-lg font-semibold">
          ¿Por unidad o por caja?
        </h2>
        <p className="text-sm text-[var(--ad-muted)]">{props.productName}</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className="ad-btn ad-btn--gold"
            onClick={() => props.onPick("UNIT")}
          >
            Unidad
            {props.unitPrice ? (
              <span className="mt-1 block text-xs opacity-80">
                {formatAdPrice(props.unitPrice)}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            className="ad-btn ad-btn--gold"
            onClick={() => props.onPick("BOX")}
          >
            Caja x{props.boxUnits ?? "?"}
            {props.boxPrice ? (
              <span className="mt-1 block text-xs opacity-80">
                {formatAdPrice(props.boxPrice)}
              </span>
            ) : null}
          </button>
        </div>
        <button type="button" className="ad-btn w-full" onClick={props.onCancel}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
