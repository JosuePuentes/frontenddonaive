import { useRef, useState } from "react";
import { Link } from "react-router";
import {
  adTvPlayerPath,
  getAdLicoreriaRoutes,
} from "@/constants/ad-licoreria-routes";
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

const MAX_BYTES = 4.5 * 1024 * 1024;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.readAsDataURL(file);
  });
}

export default function AdTvContenido() {
  const { hasPermission, getCurrentOperator } = useAdLicoreria();
  const { contents, screens, createContent } = useAdTv();
  const routes = getAdLicoreriaRoutes();
  const session = getCurrentOperator();
  const userName = session?.name ?? "Admin TV";
  const canManage =
    hasPermission("tv.content.manage") || hasPermission("tv.manage");
  const canView = hasPermission("tv.view");
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState<AdTvContentType>("IMAGE");
  const [url, setUrl] = useState("");
  const [duration, setDuration] = useState(12);
  const [msg, setMsg] = useState("");
  const [fileLabel, setFileLabel] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const demoScreen = screens[0];
  const playerExample = demoScreen
    ? adTvPlayerPath(demoScreen.code)
    : adTvPlayerPath("TV-001");

  if (!canView) {
    return (
      <div className="ad-panel">
        <h1 className="ad-panel-title">Acceso no autorizado</h1>
      </div>
    );
  }

  async function onPickFile(file: File | null) {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setMsg("Archivo muy grande (máx. ~4,5 MB en modo demo).");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setUrl(dataUrl);
      setFileLabel(file.name);
      setPreview(file.type.startsWith("image/") ? dataUrl : null);
      if (file.type.startsWith("video/")) {
        setType("VIDEO");
        setPreview(null);
      } else if (file.type.startsWith("image/")) {
        if (type === "VIDEO" || type === "TEXT") setType("IMAGE");
      }
      if (!name.trim()) {
        setName(file.name.replace(/\.[^.]+$/, "").slice(0, 60));
      }
      setMsg(`Archivo listo: ${file.name}`);
    } catch {
      setMsg("No se pudo cargar el archivo");
    } finally {
      setBusy(false);
    }
  }

  function save() {
    if (!name.trim()) {
      setMsg("Escriba un nombre");
      return;
    }
    if (type !== "TEXT" && !url.trim()) {
      setMsg("Suba una imagen/video o pegue una URL");
      return;
    }
    const r = createContent({
      name,
      type,
      url,
      durationSec: duration,
      userName,
    });
    setMsg(r.ok ? `✓ Creado: ${r.data.name}` : r.error);
    if (r.ok) {
      setName("");
      setUrl("");
      setFileLabel("");
      setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
    }
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
            Suba una imagen desde el teléfono o pegue una URL. Luego reprodúzcala
            en la pantalla TV.
          </p>
        </div>
        <Link className="ad-btn" to={routes.tv}>
          ← Hub
        </Link>
      </header>

      <section className="ad-panel space-y-3">
        <h2 className="ad-panel-title">Cómo verlo en el TV</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-[var(--ad-muted)]">
          <li>
            <strong className="text-[var(--ad-text)]">Guarde el contenido</strong>{" "}
            aquí (imagen subida o URL).
          </li>
          <li>
            <strong className="text-[var(--ad-text)]">En el televisor</strong>{" "}
            abra el navegador (Chrome/Safari) y entre a esta URL del reproductor
            (no es el login admin):
            <div className="mt-2">
              <Link
                className="ad-btn ad-btn--gold"
                to={playerExample}
                target="_blank"
                rel="noreferrer"
              >
                Abrir como TV
                {demoScreen ? ` · ${demoScreen.code}` : " · TV-001"}
              </Link>
            </div>
            <p className="mt-2 text-xs">
              Ruta: <code className="text-[var(--ad-gold-soft)]">{playerExample}</code>
            </p>
          </li>
          <li>
            La TV muestra un código <code>A&amp;D-####</code>. En el celular/admin
            vaya a{" "}
            <Link className="text-[var(--ad-gold-soft)] underline" to={routes.tvPantallas}>
              Pantallas
            </Link>{" "}
            → pegue el código → <strong className="text-[var(--ad-text)]">Vincular</strong>.
          </li>
          <li>
            Vaya a{" "}
            <Link className="text-[var(--ad-gold-soft)] underline" to={routes.tvControl}>
              Control TV
            </Link>
            , elija este contenido y pulse <strong className="text-[var(--ad-text)]">▶ Reproducir</strong>.
          </li>
        </ol>
      </section>

      {canManage ? (
        <section className="ad-panel space-y-3">
          <h2 className="ad-panel-title">Agregar contenido</h2>
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
          </div>

          <div className="space-y-2 rounded border border-[var(--ad-line)] p-3">
            <p className="text-xs uppercase tracking-wide text-[var(--ad-gold)]">
              Subir imagen o video
            </p>
            <input
              ref={fileRef}
              className="ad-input"
              type="file"
              accept="image/*,video/*"
              disabled={busy}
              onChange={(e) => void onPickFile(e.target.files?.[0] ?? null)}
            />
            {fileLabel ? (
              <p className="text-sm text-[var(--ad-gold-soft)]">{fileLabel}</p>
            ) : (
              <p className="text-xs text-[var(--ad-muted)]">
                JPG, PNG, WebP o MP4 · máx. ~4,5 MB (demo local, sin nube).
              </p>
            )}
            {preview ? (
              <img
                src={preview}
                alt="Vista previa"
                className="mt-2 max-h-48 w-full rounded object-contain bg-black/40"
              />
            ) : null}
          </div>

          <label className="ad-pos__field">
            <span>O pegar URL (opcional si ya subió archivo)</span>
            <input
              className="ad-input"
              placeholder="https://… imagen o .mp4"
              value={url.startsWith("data:") ? "" : url}
              onChange={(e) => {
                setUrl(e.target.value);
                setFileLabel("");
                setPreview(
                  /\.(png|jpe?g|webp|gif)(\?|$)/i.test(e.target.value)
                    ? e.target.value
                    : null,
                );
              }}
            />
            {url.startsWith("data:") ? (
              <span className="text-xs text-[var(--ad-muted)]">
                Usando archivo cargado en este dispositivo
              </span>
            ) : null}
          </label>

          <button
            type="button"
            className="ad-btn ad-btn--gold"
            disabled={busy}
            onClick={save}
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
            Inicie sesión como <code>admin</code> / <code>AdDemo#2026</code>.
          </p>
        </section>
      )}

      <section className="ad-panel">
        <h2 className="ad-panel-title">Catálogo</h2>
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Vista</th>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Duración</th>
                <th>Origen</th>
                <th>Activo</th>
              </tr>
            </thead>
            <tbody>
              {contents.map((c) => (
                <tr key={c.id}>
                  <td>
                    {c.url &&
                    (c.type === "IMAGE" ||
                      c.type === "PROMOTION" ||
                      c.type === "MENU" ||
                      c.url.startsWith("data:image")) ? (
                      <img
                        src={c.url}
                        alt=""
                        className="h-10 w-14 rounded object-cover"
                      />
                    ) : (
                      <span className="text-xs text-[var(--ad-muted)]">—</span>
                    )}
                  </td>
                  <td>{c.name}</td>
                  <td>{c.type}</td>
                  <td>{c.durationSec}s</td>
                  <td className="max-w-[180px] truncate text-xs">
                    {c.url.startsWith("data:")
                      ? "Archivo local"
                      : c.url || "—"}
                  </td>
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
