import { useState } from "react";
import { Link } from "react-router";
import { AD_LICORERIA_ROUTES } from "@/constants/ad-licoreria-routes";
import { uid } from "@/lib/ad-licoreria/conversions";
import { warehouseLabel } from "@/lib/ad-licoreria/warehouses";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import type { AdSpaceType, AdTable } from "@/types/ad-licoreria";

const SPACE_TYPES: AdSpaceType[] = [
  "mesa",
  "barra",
  "area",
  "privado",
  "terraza",
  "otro",
];

export default function AdLicoreriaMesas() {
  const { tables, accounts, warehouses, upsertTable, reassignMesonera, operators } =
    useAdLicoreria();
  const [msg, setMsg] = useState("");
  const [code, setCode] = useState("");
  const [number, setNumber] = useState("");
  const [spaceType, setSpaceType] = useState<AdSpaceType>("mesa");
  const [capacity, setCapacity] = useState(4);
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id ?? "");
  const [reassignAccountId, setReassignAccountId] = useState("");
  const [newMesoneraId, setNewMesoneraId] = useState("");

  const mesoneras = operators.filter((o) => o.role === "mesonera" && o.active);

  function createSpace() {
    const table: AdTable = {
      id: uid("spc"),
      number: number || code,
      code: code || undefined,
      spaceType,
      capacity,
      status: "disponible",
      active: true,
      warehouseId: warehouseId || null,
    };
    const r = upsertTable(table);
    setMsg(r.ok ? `Espacio ${r.data.code ?? r.data.number} creado` : r.error);
  }

  function doReassign() {
    const r = reassignMesonera({
      accountId: reassignAccountId,
      newMesoneraId,
      userName: "Supervisor A&D",
    });
    setMsg(r.ok ? `Reasignada a ${r.data.mesoneraName}` : r.error);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--ad-muted)]">
        Espacios: mesa, barra, área, privado, terraza. Cada uno puede pertenecer
        a un depósito.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tables.map((t) => {
          const account = accounts.find(
            (a) =>
              a.tableId === t.id &&
              a.status !== "CERRADA" &&
              a.status !== "CANCELADA",
          );
          return (
            <article key={t.id} className="ad-panel">
              <p className="ad-eyebrow">
                {(t.spaceType ?? "mesa").toUpperCase()}
              </p>
              <h3 className="ad-display mt-1 text-3xl text-[var(--ad-gold-soft)]">
                {t.code ?? t.number}
              </h3>
              <p className="mt-2 text-sm text-[var(--ad-muted)]">
                Capacidad {t.capacity}
                {t.warehouseId
                  ? ` · ${warehouseLabel(t.warehouseId, warehouses)}`
                  : ""}
              </p>
              <span className="ad-badge mt-3">
                {t.status.replace(/_/g, " ")}
              </span>
              {account ? (
                <p className="mt-3 text-sm">
                  Cuenta #{account.number}
                  <br />
                  <span className="text-[var(--ad-muted)]">
                    {account.mesoneraName ?? "Sin mesonera"} · {account.status}
                  </span>
                </p>
              ) : null}
            </article>
          );
        })}
      </div>

      <section className="ad-panel grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <input
          className="ad-input"
          placeholder="Código (MESA-01)"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <input
          className="ad-input"
          placeholder="Número"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
        />
        <select
          className="ad-select"
          value={spaceType}
          onChange={(e) => setSpaceType(e.target.value as AdSpaceType)}
        >
          {SPACE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          className="ad-select"
          value={warehouseId}
          onChange={(e) => setWarehouseId(e.target.value)}
        >
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
        <button type="button" className="ad-btn ad-btn--gold" onClick={createSpace}>
          Crear espacio
        </button>
        <input
          className="ad-input"
          type="number"
          min={1}
          value={capacity}
          onChange={(e) => setCapacity(Number(e.target.value))}
        />
      </section>

      <section className="ad-panel space-y-2">
        <h2 className="ad-panel-title">Reasignar mesonera</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          <select
            className="ad-select"
            value={reassignAccountId}
            onChange={(e) => setReassignAccountId(e.target.value)}
          >
            <option value="">Cuenta abierta</option>
            {accounts
              .filter(
                (a) => a.status !== "CERRADA" && a.status !== "CANCELADA",
              )
              .map((a) => (
                <option key={a.id} value={a.id}>
                  #{a.number} · {a.mesoneraName ?? "—"}
                </option>
              ))}
          </select>
          <select
            className="ad-select"
            value={newMesoneraId}
            onChange={(e) => setNewMesoneraId(e.target.value)}
          >
            <option value="">Nueva mesonera</option>
            {mesoneras.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <button type="button" className="ad-btn" onClick={doReassign}>
            Reasignar (audita)
          </button>
        </div>
      </section>

      {msg ? <p className="text-sm text-[var(--ad-gold-soft)]">{msg}</p> : null}
      <Link to={AD_LICORERIA_ROUTES.mesonera} className="ad-btn ad-btn--primary">
        Ir a interfaz mesonera
      </Link>
    </div>
  );
}
