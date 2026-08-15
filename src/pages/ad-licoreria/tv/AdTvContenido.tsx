import { useState } from "react";
import { Link } from "react-router";
import { AD_LICORERIA_ROUTES } from "@/constants/ad-licoreria-routes";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import { useAdTv } from "@/providers/ad-licoreria/AdTvProvider";
import type { AdTvContentType } from "@/types/ad-tv";

const TYPES: AdTvContentType[] = [
  "IMAGE",
  "VIDEO",
  "TEXT",
  "MENU",
  "PROMOTION",
];

export default function AdTvContenido() {
  const { hasPermission, getCurrentOperator } = useAdLicoreria();
  const { contents, createContent } = useAdTv();
  const session = getCurrentOperator();
  const userName = session?.name ?? "Admin TV";
  const canManage =
    hasPermission("tv.content.manage") || hasPermission("tv.manage");
  const canView = hasPermission("tv.view");

  const [name, setName] = useState("");
  const [type, setType] = useState<AdTvContentType>("PROMOTION");
  const [url, setUrl] = useState("");
  const [duration, setDuration] = useState(12);
  const [msg, setMsg] = useState("");

  if (!canView) {
    return (
      <div className="ad-panel">
        <h1 className="ad-panel-title">Acceso no autorizado</h1>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="ad-eyebrow">TV</p>
          <h1 className="ad-display text-4xl text-[var(--ad-gold-soft)]">
            Contenido
          </h1>
          <p className="mt-1 text-sm text-[var(--ad-muted)]">
            MOCK — URL/ruta local. Sin almacenamiento cloud.
          </p>
        </div>
        <Link className="ad-btn" to={AD_LICORERIA_ROUTES.tv}>
          ← Hub
        </Link>
      </header>

      {canManage ? (
        <section className="ad-panel space-y-3">
          <h2 className="ad-panel-title">Agregar contenido</h2>
          <p className="text-sm text-[var(--ad-muted)]">
            Pegue una URL pública de imagen o video. Luego vaya a Control →
            elija el contenido → Reproducir (con la TV vinculada).
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <input
              className="ad-input"
              placeholder="Nombre (ej. Promo viernes)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <select
              className="ad-select"
              value={type}
              onChange={(e) => setType(e.target.value as AdTvContentType)}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input
              className="ad-input"
              type="number"
              min={1}
              placeholder="Duración (s)"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value) || 1)}
            />
            <input
              className="ad-input sm:col-span-2 lg:col-span-3"
              placeholder="URL https://… (imagen o .mp4)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="ad-btn ad-btn--gold"
            onClick={() => {
              const r = createContent({
                name,
                type,
                url,
                durationSec: duration,
                userName,
              });
              setMsg(r.ok ? `Creado: ${r.data.name}` : r.error);
              if (r.ok) {
                setName("");
                setUrl("");
              }
            }}
          >
            Guardar contenido
          </button>
          {msg ? (
            <p className="text-sm text-[var(--ad-gold-soft)]">{msg}</p>
          ) : null}
        </section>
      ) : (
        <section className="ad-panel space-y-2">
          <h2 className="ad-panel-title">Sin permiso para agregar</h2>
          <p className="text-sm text-[var(--ad-muted)]">
            Puede ver el catálogo, pero no crear. Inicie sesión como{" "}
            <code>admin</code> / <code>AdDemo#2026</code> o{" "}
            <code>tvadmin</code> / <code>tvadmin</code> (permiso{" "}
            <code>tv.content.manage</code>).
          </p>
        </section>
      )}

      <section className="ad-panel">
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Duración</th>
                <th>URL</th>
                <th>Activo</th>
              </tr>
            </thead>
            <tbody>
              {contents.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.type}</td>
                  <td>{c.durationSec}s</td>
                  <td className="max-w-[220px] truncate text-xs">{c.url || "—"}</td>
                  <td>{c.active ? "Sí" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
