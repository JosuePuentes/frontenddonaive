import { formatAdPrice } from "@/lib/ad-licoreria/conversions";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";

export default function AdLicoreriaPresentaciones() {
  const { products, presentations } = useAdLicoreria();

  return (
    <div className="space-y-4">
      <p className="max-w-2xl text-sm text-[var(--ad-muted)]">
        Cada presentación define conversión a unidad base y precios USD / BS
        independientes (no forzados por tasa).
      </p>
      <div className="ad-table-wrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Presentación</th>
              <th>Unidades base</th>
              <th>Precio USD</th>
              <th>Precio BS</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {presentations.map((pres) => {
              const product = products.find((p) => p.id === pres.productId);
              return (
                <tr key={pres.id}>
                  <td>{product?.name}</td>
                  <td>{pres.name}</td>
                  <td>{pres.unitsPerPresentation}</td>
                  <td>${pres.price.usd.toFixed(2)}</td>
                  <td>Bs {pres.price.bs.toLocaleString("es-VE")}</td>
                  <td>
                    <span className="ad-badge ad-badge--ok">
                      {pres.active ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="ad-panel text-sm text-[var(--ad-muted)]">
        Ejemplo Polar: Individual 1 · Balde 6 · Caja 36 →{" "}
        <span className="text-[var(--ad-gold-soft)]">
          {formatAdPrice({ usd: 1, bs: 100 })} /{" "}
          {formatAdPrice({ usd: 5, bs: 500 })} /{" "}
          {formatAdPrice({ usd: 28, bs: 2800 })}
        </span>
      </div>
    </div>
  );
}
