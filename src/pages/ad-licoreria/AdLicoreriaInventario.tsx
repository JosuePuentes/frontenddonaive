import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";

export default function AdLicoreriaInventario() {
  const { products, warehouses, stock, movements } = useAdLicoreria();

  return (
    <div className="space-y-5">
      <p className="max-w-2xl text-sm text-[var(--ad-muted)]">
        Existencias y kardex en <strong>unidad base</strong>. Los movimientos
        guardan presentación, equivalente base, depósitos, usuario y motivo.
      </p>

      <section className="ad-panel">
        <h2 className="ad-panel-title">Existencias por depósito</h2>
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Producto</th>
                {warehouses.map((w) => (
                  <th key={w.id}>{w.name}</th>
                ))}
                <th>Total base</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const rows = warehouses.map(
                  (w) =>
                    stock.find(
                      (s) => s.productId === p.id && s.warehouseId === w.id,
                    )?.qtyBase ?? 0,
                );
                return (
                  <tr key={p.id}>
                    <td>
                      {p.name}{" "}
                      <span className="text-[var(--ad-muted)]">
                        ({p.baseUnitLabel})
                      </span>
                    </td>
                    {rows.map((q, i) => (
                      <td key={warehouses[i].id}>{q}</td>
                    ))}
                    <td>{rows.reduce((a, b) => a + b, 0)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="ad-panel">
        <h2 className="ad-panel-title">Kardex / movimientos</h2>
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Producto</th>
                <th>Cant. pres.</th>
                <th>Base</th>
                <th>Origen</th>
                <th>Destino</th>
                <th>Usuario</th>
                <th>Motivo</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => {
                const product = products.find((p) => p.id === m.productId);
                const from = warehouses.find((w) => w.id === m.warehouseFromId);
                const to = warehouses.find((w) => w.id === m.warehouseToId);
                return (
                  <tr key={m.id}>
                    <td>{m.type}</td>
                    <td>{product?.name}</td>
                    <td>{m.qtyPresentation}</td>
                    <td>{m.qtyBase}</td>
                    <td>{from?.code ?? "—"}</td>
                    <td>{to?.code ?? "—"}</td>
                    <td>{m.userName}</td>
                    <td>{m.reason ?? "—"}</td>
                    <td>{new Date(m.createdAt).toLocaleString("es-VE")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
