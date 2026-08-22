import { useEffect, useState } from "react";
import { adFinanceClient } from "@/services/ad-licoreria/finance-client";

export default function AdLicoreriaMovimientos() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    void (async () => {
      const r = await adFinanceClient.listMovements("?limit=80");
      if (!r.ok) setMsg(r.error);
      else setRows(r.data as Record<string, unknown>[]);
    })();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Movimientos financieros</h1>
      <p className="text-sm text-[var(--ad-muted)]">
        Historial de ingresos, egresos, transferencias y cambios de moneda.
      </p>
      <table className="ad-table w-full text-sm">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Estado</th>
            <th>Cuenta</th>
            <th>Monto</th>
            <th>Concepto</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={String(r.id)}>
              <td>
                {r.createdAt
                  ? new Date(String(r.createdAt)).toLocaleString("es-VE")
                  : "—"}
              </td>
              <td>{String(r.type)}</td>
              <td>{String(r.status)}</td>
              <td>
                {(r.account as { name?: string } | null)?.name ?? "—"}
              </td>
              <td className="tabular-nums">
                {Number(r.amount).toFixed(2)} {String(r.currency)}
              </td>
              <td>{String(r.concept ?? "—")}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {msg && <p className="text-sm">{msg}</p>}
    </div>
  );
}
