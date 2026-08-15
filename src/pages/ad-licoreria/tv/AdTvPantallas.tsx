import { useState } from "react";
import { Link } from "react-router";
import {
  AD_LICORERIA_ROUTES,
  adTvPlayerPath,
} from "@/constants/ad-licoreria-routes";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import { useAdTv } from "@/providers/ad-licoreria/AdTvProvider";

function statusDot(status: string) {
  if (status === "ONLINE") return "🟢";
  if (status === "PAIRING") return "🟡";
  return "🔴";
}

function relativeSeen(iso?: string) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "ahora";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min`;
  return new Date(iso).toLocaleString();
}

export default function AdTvPantallas() {
  const { hasPermission, getCurrentOperator } = useAdLicoreria();
  const {
    screens,
    contents,
    createScreen,
    updateScreen,
    pairWithCode,
    unpairScreen,
  } = useAdTv();

  const session = getCurrentOperator();
  const userName = session?.name ?? "Admin TV";
  const canManage =
    hasPermission("tv.screen.manage") || hasPermission("tv.manage");
  const canView = hasPermission("tv.view");

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [pairCode, setPairCode] = useState("");
  const [msg, setMsg] = useState("");
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState("");
  const [renameLoc, setRenameLoc] = useState("");

  if (!canView) {
    return (
      <div className="ad-panel">
        <h1 className="ad-panel-title">Acceso no autorizado</h1>
        <p className="text-sm text-[var(--ad-muted)]">
          Se requiere permiso tv.view.
        </p>
      </div>
    );
  }

  function contentName(id?: string | null) {
    if (!id) return "Sin contenido";
    return contents.find((c) => c.id === id)?.name ?? id;
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="ad-eyebrow">TV</p>
          <h1 className="ad-display text-4xl text-[var(--ad-gold-soft)]">
            Pantallas
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="ad-btn" to={AD_LICORERIA_ROUTES.tv}>
            ← Hub
          </Link>
          <Link
            className="ad-btn ad-btn--gold"
            to={AD_LICORERIA_ROUTES.tvControl}
          >
            Control
          </Link>
        </div>
      </header>

      {canManage ? (
        <section className="ad-panel space-y-3">
          <h2 className="ad-panel-title">Crear pantalla</h2>
          <div className="flex flex-wrap gap-2">
            <input
              className="ad-input"
              placeholder="Nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="ad-input"
              placeholder="Ubicación"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <button
              type="button"
              className="ad-btn ad-btn--gold"
              onClick={() => {
                const r = createScreen({ name, location, userName });
                setMsg(r.ok ? `Creada ${r.data.code}` : r.error);
                if (r.ok) {
                  setName("");
                  setLocation("");
                }
              }}
            >
              Crear
            </button>
          </div>
          <div className="flex flex-wrap gap-2 border-t border-[var(--ad-line)] pt-3">
            <input
              className="ad-input"
              placeholder="Código A&D-####"
              value={pairCode}
              onChange={(e) => setPairCode(e.target.value)}
            />
            <button
              type="button"
              className="ad-btn ad-btn--gold"
              onClick={() => {
                const r = pairWithCode({ pairingCode: pairCode, userName });
                setMsg(
                  r.ok
                    ? `✓ Pantalla vinculada · ${r.data.code} ${r.data.name}`
                    : r.error,
                );
                if (r.ok) setPairCode("");
              }}
            >
              Vincular pantalla
            </button>
          </div>
        </section>
      ) : null}

      {msg ? (
        <p className="text-sm text-[var(--ad-gold-soft)]">{msg}</p>
      ) : null}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {screens.map((s) => (
          <article key={s.id} className="ad-panel space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="ad-display text-2xl text-[var(--ad-gold-soft)]">
                  {s.name}
                </h3>
                <p className="text-xs text-[var(--ad-muted)]">
                  {s.code} · {s.location}
                </p>
              </div>
              <span className="text-sm">
                {statusDot(s.status)} {s.status}
              </span>
            </div>
            <p className="text-sm">
              Contenido:{" "}
              <span className="text-[var(--ad-gold-soft)]">
                {contentName(s.currentContentId)}
              </span>
            </p>
            <p className="text-xs text-[var(--ad-muted)]">
              Última conexión: {relativeSeen(s.lastSeenAt)}
            </p>
            {renameId === s.id ? (
              <div className="flex flex-wrap gap-2">
                <input
                  className="ad-input"
                  value={renameName}
                  onChange={(e) => setRenameName(e.target.value)}
                />
                <input
                  className="ad-input"
                  value={renameLoc}
                  onChange={(e) => setRenameLoc(e.target.value)}
                />
                <button
                  type="button"
                  className="ad-btn ad-btn--gold"
                  onClick={() => {
                    const r = updateScreen({
                      screenId: s.id,
                      name: renameName,
                      location: renameLoc,
                      userName,
                    });
                    setMsg(r.ok ? "Actualizada" : r.error);
                    setRenameId(null);
                  }}
                >
                  Guardar
                </button>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-1">
              <Link className="ad-btn" to={AD_LICORERIA_ROUTES.tvControl}>
                CONTROLAR
              </Link>
              <Link
                className="ad-btn ad-btn--gold"
                to={adTvPlayerPath(s.code)}
                target="_blank"
              >
                Abrir como TV
              </Link>
              {canManage ? (
                <>
                  <button
                    type="button"
                    className="ad-btn"
                    onClick={() => {
                      setRenameId(s.id);
                      setRenameName(s.name);
                      setRenameLoc(s.location);
                    }}
                  >
                    RENOMBRAR
                  </button>
                  <button
                    type="button"
                    className="ad-btn"
                    onClick={() => {
                      setRenameId(s.id);
                      setRenameName(s.name);
                      setRenameLoc(s.location);
                    }}
                  >
                    CAMBIAR UBICACIÓN
                  </button>
                  {s.paired ? (
                    <button
                      type="button"
                      className="ad-btn"
                      onClick={() => {
                        const r = unpairScreen({
                          screenId: s.id,
                          userName,
                        });
                        setMsg(r.ok ? "Desvinculada" : r.error);
                      }}
                    >
                      DESVINCULAR
                    </button>
                  ) : (
                    <span className="ad-btn opacity-60">
                      VINCULAR (código en TV)
                    </span>
                  )}
                </>
              ) : null}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
