import { formatAdPrice } from "@/lib/ad-licoreria/conversions";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";

export default function AdLicoreriaProductos() {
  const { products, getPresentationsFor } = useAdLicoreria();

  return (
    <div className="space-y-4">
      <p className="max-w-2xl text-sm text-[var(--ad-muted)]">
        Producto + presentaciones + unidad base. El inventario se mueve siempre
        en unidad base (ej. 1 caja = 36 cervezas → −36).
      </p>
      <div className="ad-table-wrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Marca</th>
              <th>Categoría</th>
              <th>SKU</th>
              <th>Unidad base</th>
              <th>Costo</th>
              <th>Presentaciones</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.brand}</td>
                <td>{p.category}</td>
                <td>{p.sku}</td>
                <td>{p.baseUnitLabel}</td>
                <td>{formatAdPrice(p.cost)}</td>
                <td>
                  {getPresentationsFor(p.id)
                    .map((x) => `${x.name}×${x.unitsPerPresentation}`)
                    .join(", ")}
                </td>
                <td>
                  <span className={p.active ? "ad-badge ad-badge--ok" : "ad-badge"}>
                    {p.active ? "Activo" : "Inactivo"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
