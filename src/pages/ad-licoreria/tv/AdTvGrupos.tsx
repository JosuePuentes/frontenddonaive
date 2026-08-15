import { useState } from "react";
import { Link } from "react-router";
import { AD_LICORERIA_ROUTES } from "@/constants/ad-licoreria-routes";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import { useAdTv } from "@/providers/ad-licoreria/AdTvProvider";

export default function AdTvGrupos() {
  const { hasPermission, getCurrentOperator } = useAdLicoreria();
  const {
    groups,
    screens,
    createGroup,
    addScreenToGroup,
    removeScreenFromGroup,
  } = useAdTv();
  const session = getCurrentOperator();
  const userName = session?.name ?? "Admin TV";
  const canManage =
    hasPermission("tv.groups.manage") || hasPermission("tv.manage");
  const canView = hasPermission("tv.view");

  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(groups[0]?.id ?? "");

  if (!canView) {
    return (
      <div className="ad-panel">
        <h1 className="ad-panel-title">Acceso no autorizado</h1>
      </div>
    );
  }

  const group = groups.find((g) => g.id === selectedGroup) ?? groups[0];

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="ad-eyebrow">TV</p>
          <h1 className="ad-display text-4xl text-[var(--ad-gold-soft)]">
            Grupos
          </h1>
        </div>
        <Link className="ad-btn" to={AD_LICORERIA_ROUTES.tv}>
          ← Hub
        </Link>
      </header>

      {canManage ? (
        <section className="ad-panel flex flex-wrap gap-2">
          <input
            className="ad-input"
            placeholder="Nombre del grupo"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            type="button"
            className="ad-btn ad-btn--gold"
            onClick={() => {
              const r = createGroup({ name, userName });
              setMsg(r.ok ? `Grupo ${r.data.name}` : r.error);
              if (r.ok) {
                setName("");
                setSelectedGroup(r.data.id);
              }
            }}
          >
            Crear grupo
          </button>
        </section>
      ) : null}

      {msg ? (
        <p className="text-sm text-[var(--ad-gold-soft)]">{msg}</p>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <div className="ad-panel space-y-1">
          <h2 className="ad-panel-title">Grupos</h2>
          {groups.map((g) => (
            <button
              key={g.id}
              type="button"
              className={`ad-btn w-full justify-between ${
                group?.id === g.id ? "ad-btn--gold" : ""
              }`}
              onClick={() => setSelectedGroup(g.id)}
            >
              <span>{g.name}</span>
              <span className="text-xs opacity-70">{g.screenIds.length}</span>
            </button>
          ))}
        </div>

        {group ? (
          <div className="ad-panel space-y-3">
            <h2 className="ad-panel-title">Miembros · {group.name}</h2>
            <ul className="space-y-2">
              {group.screenIds.map((id) => {
                const s = screens.find((x) => x.id === id);
                if (!s) return null;
                return (
                  <li
                    key={id}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span>
                      {s.name}{" "}
                      <span className="text-[var(--ad-muted)]">
                        ({s.code})
                      </span>
                    </span>
                    {canManage ? (
                      <button
                        type="button"
                        className="ad-btn"
                        onClick={() => {
                          const r = removeScreenFromGroup({
                            groupId: group.id,
                            screenId: id,
                            userName,
                          });
                          setMsg(r.ok ? "Quitada" : r.error);
                        }}
                      >
                        Quitar
                      </button>
                    ) : null}
                  </li>
                );
              })}
              {group.screenIds.length === 0 ? (
                <li className="text-sm text-[var(--ad-muted)]">Sin pantallas</li>
              ) : null}
            </ul>

            {canManage ? (
              <div className="border-t border-[var(--ad-line)] pt-3">
                <p className="mb-2 text-xs uppercase text-[var(--ad-muted)]">
                  Agregar pantalla
                </p>
                <div className="flex flex-wrap gap-1">
                  {screens
                    .filter((s) => !group.screenIds.includes(s.id))
                    .map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className="ad-btn"
                        onClick={() => {
                          const r = addScreenToGroup({
                            groupId: group.id,
                            screenId: s.id,
                            userName,
                          });
                          setMsg(r.ok ? `Agregada ${s.code}` : r.error);
                        }}
                      >
                        + {s.name}
                      </button>
                    ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}
