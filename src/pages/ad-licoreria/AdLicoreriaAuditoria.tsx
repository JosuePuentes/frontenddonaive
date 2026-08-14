import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";

export default function AdLicoreriaAuditoria() {
  const { audit } = useAdLicoreria();

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--ad-muted)]">
        Trazabilidad de transferencias, servicios de mesa y ventas POS.
      </p>
      <div className="ad-table-wrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Acción</th>
              <th>Entidad</th>
              <th>Usuario</th>
              <th>Detalle</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {audit.map((e) => (
              <tr key={e.id}>
                <td>{e.action}</td>
                <td>{e.entity}</td>
                <td>{e.userName}</td>
                <td>{e.detail}</td>
                <td>{new Date(e.createdAt).toLocaleString("es-VE")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
