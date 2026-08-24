import {
  draftPvpPreview,
  formatLineQtySummary,
  type DsDraftLine,
} from "@/lib/donaive-software/purchase-draft";
import {
  amountToDisplay,
  formatDsMoney,
  type DsRateContext,
} from "@/lib/donaive-software/rates";

type Props = {
  line: DsDraftLine;
  currency: "USD" | "BS";
  rateCtx: DsRateContext;
  onChange: (patch: Partial<DsDraftLine>) => void;
  onAdd: () => void;
  onCancel: () => void;
  addLabel?: string;
};

function setBuyMode(buyMode: "UNIT" | "BOX"): Partial<DsDraftLine> {
  return {
    buyMode,
    costMode: buyMode === "BOX" ? "PRESENTATION" : "UNIT",
    presentationCost: 0,
    unitCost: 0,
    lineTotal: 0,
  };
}

export function DsPurchaseLineForm({
  line: l,
  currency,
  rateCtx,
  onChange,
  onAdd,
  onCancel,
  addLabel = "Agregar a la factura",
}: Props) {
  const { m, unitDisp, boxDisp, costUnitDisp } = draftPvpPreview(l, rateCtx);
  const subtotalDisp = amountToDisplay(m.subtotal, rateCtx);
  const hasBox = l.unitsPerBox > 1;

  return (
    <article className="ds-purchase-draft">
      <div className="ds-purchase-draft__head">
        <div>
          <div className="ds-purchase-draft__title">
            {l.productLabel}
            {l.taxable ? (
              <span className="ds-badge ds-badge--ok">IVA</span>
            ) : (
              <span className="ds-badge">Exento</span>
            )}
          </div>
          <div className="ds-muted" style={{ fontSize: "0.8rem" }}>
            {formatLineQtySummary(l)}
          </div>
        </div>
        <button type="button" className="ds-btn" onClick={onCancel}>
          Cancelar
        </button>
      </div>

      {hasBox ? (
        <div className="ds-toggle-row">
          <button
            type="button"
            className={`ds-btn${l.buyMode === "BOX" ? " ds-btn--primary" : ""}`}
            onClick={() => onChange(setBuyMode("BOX"))}
          >
            Compré por caja
          </button>
          <button
            type="button"
            className={`ds-btn${l.buyMode === "UNIT" ? " ds-btn--primary" : ""}`}
            onClick={() => onChange(setBuyMode("UNIT"))}
          >
            Compré por unidad
          </button>
        </div>
      ) : null}

      <div>
        <p className="ds-muted" style={{ fontSize: "0.8rem", margin: 0 }}>
          ¿Este producto lleva IVA?
        </p>
        <div className="ds-toggle-row">
          <button
            type="button"
            className={`ds-btn${!l.taxable ? " ds-btn--primary" : ""}`}
            onClick={() => onChange({ taxable: false })}
          >
            Sin IVA
          </button>
          <button
            type="button"
            className={`ds-btn${l.taxable ? " ds-btn--primary" : ""}`}
            onClick={() => onChange({ taxable: true })}
          >
            Con IVA 16%
          </button>
        </div>
      </div>

      <label className="ds-label">
        {l.buyMode === "BOX" ? "¿Cuántas cajas?" : "¿Cuántas unidades?"}
        <input
          className="ds-input"
          type="number"
          min={0}
          value={l.qty}
          onChange={(e) => onChange({ qty: Number(e.target.value) })}
        />
      </label>

      <label className="ds-label">
        Unidades de regalo (bonificación)
        <input
          className="ds-input"
          type="number"
          min={0}
          value={l.qtyBonus}
          onChange={(e) => onChange({ qtyBonus: Number(e.target.value) })}
        />
      </label>

      <div>
        <p className="ds-muted" style={{ fontSize: "0.8rem", margin: 0 }}>
          ¿Cómo viene el costo en la factura?
        </p>
        <div className="ds-toggle-row">
          {l.buyMode === "BOX" ? (
            <>
              <button
                type="button"
                className={`ds-btn${l.costMode === "PRESENTATION" ? " ds-btn--primary" : ""}`}
                onClick={() => onChange({ costMode: "PRESENTATION" })}
              >
                Precio por caja
              </button>
              <button
                type="button"
                className={`ds-btn${l.costMode === "TOTAL" ? " ds-btn--primary" : ""}`}
                onClick={() => onChange({ costMode: "TOTAL" })}
              >
                Total de la línea
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={`ds-btn${l.costMode === "UNIT" ? " ds-btn--primary" : ""}`}
                onClick={() => onChange({ costMode: "UNIT" })}
              >
                Precio por unidad
              </button>
              <button
                type="button"
                className={`ds-btn${l.costMode === "TOTAL" ? " ds-btn--primary" : ""}`}
                onClick={() => onChange({ costMode: "TOTAL" })}
              >
                Total de la línea
              </button>
            </>
          )}
        </div>
      </div>

      {l.costMode === "TOTAL" ? (
        <label className="ds-label">
          Total facturado ({currency})
          <input
            className="ds-input"
            type="number"
            step="0.01"
            value={l.lineTotal}
            onChange={(e) => onChange({ lineTotal: Number(e.target.value) })}
          />
        </label>
      ) : l.buyMode === "BOX" ? (
        <label className="ds-label">
          Costo de cada caja ({currency})
          <input
            className="ds-input"
            type="number"
            step="0.01"
            value={l.presentationCost}
            onChange={(e) =>
              onChange({ presentationCost: Number(e.target.value) })
            }
          />
        </label>
      ) : (
        <label className="ds-label">
          Costo por unidad ({currency})
          <input
            className="ds-input"
            type="number"
            step="0.01"
            value={l.unitCost}
            onChange={(e) => onChange({ unitCost: Number(e.target.value) })}
          />
        </label>
      )}

      <label className="ds-label">
        Utilidad % (PVP)
        <input
          className="ds-input"
          type="number"
          min={0}
          max={99}
          value={l.utilityPercent}
          onChange={(e) =>
            onChange({ utilityPercent: Number(e.target.value) })
          }
        />
      </label>

      <div className="ds-purchase-draft__summary">
        <div>
          <span className="ds-muted">Costo unit. real</span>
          <div>{formatDsMoney(costUnitDisp)}</div>
        </div>
        <div>
          <span className="ds-muted">Subtotal línea</span>
          <div>{formatDsMoney(subtotalDisp)}</div>
        </div>
        <div>
          <span className="ds-muted">PVP unidad</span>
          <div>{formatDsMoney(unitDisp)}</div>
        </div>
        {hasBox ? (
          <div>
            <span className="ds-muted">PVP caja</span>
            <div>{formatDsMoney(boxDisp)}</div>
          </div>
        ) : null}
      </div>

      <button type="button" className="ds-btn ds-btn--primary" onClick={onAdd}>
        {addLabel}
      </button>
    </article>
  );
}
