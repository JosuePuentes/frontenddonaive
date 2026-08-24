import { Link } from "react-router";
import DsRequirePermission from "@/components/donaive-software/DsRequirePermission";
import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";
import { formatDsNumber, formatLineQtySummary } from "@/lib/donaive-software/purchase-draft";
import { formatDsMoney, amountToDisplay } from "@/lib/donaive-software/rates";
import { useDonaiveSoftware } from "@/providers/donaive-software/DonaiveSoftwareProvider";

function DsComprasHistorialInner() {
  const { purchases, rates } = useDonaiveSoftware();
  const routes = getDonaiveSoftwareRoutes();

  return (
    <div>
      <nav className="ds-crumb">
        <Link to={routes.home}>Módulos</Link>
        <span>/</span>
        <Link to={routes.compras}>Compras</Link>
        <span>/</span>
        <span>Historial</span>
      </nav>

      <section className="ds-panel">
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            gap: "0.75rem",
            alignItems: "flex-end",
          }}
        >
          <div>
            <h1 className="ds-title">Historial de compras</h1>
            <p className="ds-lead">
              Compras confirmadas en este equipo. Cada una actualizó stock y CPP.
            </p>
          </div>
          <Link className="ds-btn ds-btn--primary" to={routes.comprasNueva}>
            Nueva compra
          </Link>
        </div>

        {purchases.length === 0 ? (
          <p className="ds-muted" style={{ marginTop: "1.25rem" }}>
            Aún no hay compras registradas.
          </p>
        ) : (
          <div style={{ marginTop: "1.25rem", display: "grid", gap: "1rem" }}>
            {purchases.map((pur) => {
              const rateCtx = {
                currency: pur.currency,
                bcv: rates.bcv,
                protectedRate: rates.protectedRate,
                useProtected: false,
                invoiceRate: pur.invoiceRate,
              };
              const grand = amountToDisplay(pur.grandTotal, rateCtx);
              return (
                <article
                  key={pur.id}
                  className="ds-panel"
                  style={{
                    background: "rgba(0,0,0,0.18)",
                    padding: "1rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      justifyContent: "space-between",
                      gap: "0.5rem",
                    }}
                  >
                    <div>
                      <strong>{pur.supplierName}</strong>
                      {pur.invoiceNumber ? (
                        <span className="ds-muted"> · #{pur.invoiceNumber}</span>
                      ) : null}
                      <div className="ds-muted" style={{ fontSize: "0.8rem" }}>
                        {new Date(pur.createdAt).toLocaleString("es-VE")}
                        {pur.createdBy ? ` · ${pur.createdBy}` : ""}
                        {" · "}
                        {pur.currency}
                        {pur.invoiceRate
                          ? ` · tasa ${formatDsNumber(pur.invoiceRate, 2)}`
                          : ""}
                      </div>
                    </div>
                    <div className="ds-stat" style={{ fontSize: "1.1rem" }}>
                      {formatDsMoney(grand)}
                    </div>
                  </div>

                  <div style={{ marginTop: "0.75rem" }}>
                    {pur.lines.map((l) => (
                      <div key={l.key} className="ds-line-row">
                        <span>{l.productLabel}</span>
                        <span className="ds-muted" style={{ fontSize: "0.85rem" }}>
                          {formatLineQtySummary(l)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {pur.extraTaxes.length > 0 ? (
                    <p className="ds-muted" style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>
                      Impuestos extra:{" "}
                      {formatDsNumber(pur.extraTaxesTotalBs, 2)} Bs
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default function DsComprasHistorial() {
  return (
    <DsRequirePermission permission="purchases.manage">
      <DsComprasHistorialInner />
    </DsRequirePermission>
  );
}
