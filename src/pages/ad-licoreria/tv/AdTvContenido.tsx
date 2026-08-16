import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import {
  adTvPlayerPath,
  getAdLicoreriaRoutes,
} from "@/constants/ad-licoreria-routes";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import { useAdTv } from "@/providers/ad-licoreria/AdTvProvider";
import { adTvRepository } from "@/services/ad-licoreria/tv/repository";
import {
  compressImageToDataUrl,
  uploadTvAsset,
  uploadTvFile,
} from "@/services/ad-licoreria/tv/sync-client";
import type { AdTvContentType } from "@/types/ad-tv";

const TYPES: AdTvContentType[] = [
  "IMAGE",
  "VIDEO",
  "TEXT",
  "MENU",
  "PROMOTION",
];

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 35 * 1024 * 1024;

function friendlyTitle(file: File, kind: "image" | "video") {
  const base = file.name.replace(/\.[^.]+$/, "").trim();
  const looksLikeId =
    !base ||
    /^[0-9A-F-]{10,}$/i.test(base) ||
    /^IMG_\d+/i.test(base) ||
    base.length > 48;
  if (looksLikeId) {
    const stamp = new Date().toLocaleString("es", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
    return kind === "video" ? `Video ${stamp}` : `Imagen ${stamp}`;
  }
  return base.slice(0, 60);
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
  const pickedFileRef = useRef<File | null>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState<AdTvContentType>("IMAGE");
  const [url, setUrl] = useState("");
  const [duration, setDuration] = useState(12);
  const [msg, setMsg] = useState("");
  const [fileLabel, setFileLabel] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void adTvRepository.refreshFromSync();
  }, []);

  useEffect(() => {
    return () => {
      if (videoPreview) URL.revokeObjectURL(videoPreview);
    };
  }, [videoPreview]);

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
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isVideo && !isImage) {
      setMsg("Solo imagen (JPG/PNG/WebP) o video (MP4).");
      return;
    }
    const max = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (file.size > max) {
      setMsg(
        isVideo
          ? "Video muy grande (máx. ~35 MB). Prefiera MP4 comprimido."
          : "Imagen muy grande (máx. ~8 MB).",
      );
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      pickedFileRef.current = file;
      setFileLabel(file.name);
      if (videoPreview) URL.revokeObjectURL(videoPreview);
      setVideoPreview(null);
      setPreview(null);
      setUrl("");

      if (isVideo) {
        setType("VIDEO");
        setDuration(30);
        setVideoPreview(URL.createObjectURL(file));
        setName((prev) => prev.trim() || friendlyTitle(file, "video"));
        setMsg(`Video listo: ${file.name}. Pulse «Guardar contenido».`);
      } else {
        setType("IMAGE");
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(String(reader.result ?? ""));
          reader.onerror = () => reject(new Error("No se pudo leer"));
          reader.readAsDataURL(file);
        });
        setUrl(dataUrl);
        setPreview(dataUrl);
        setName((prev) => prev.trim() || friendlyTitle(file, "image"));
        setMsg("Imagen lista. Pulse «Guardar contenido».");
      }
    } catch {
      setMsg("No se pudo cargar el archivo");
      pickedFileRef.current = null;
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!name.trim()) {
      setMsg("Escriba un nombre corto (ej. Promo viernes)");
      return;
    }
    const file = pickedFileRef.current;
    if (type !== "TEXT" && !file && !url.trim()) {
      setMsg("Suba una imagen/video o pegue una URL");
      return;
    }
    setBusy(true);
    setMsg(type === "VIDEO" ? "Subiendo video…" : "Subiendo imagen…");
    try {
      let finalUrl = url.trim();

      if (file && file.type.startsWith("image/")) {
        /** Imágenes: comprimir + data URL (más fiable en móvil/túnel). */
        setMsg("Preparando imagen…");
        let dataUrl = finalUrl.startsWith("data:") ? finalUrl : "";
        try {
          dataUrl = await compressImageToDataUrl(file);
        } catch {
          if (!dataUrl) {
            const reader = new FileReader();
            dataUrl = await new Promise<string>((resolve, reject) => {
              reader.onload = () => resolve(String(reader.result ?? ""));
              reader.onerror = () => reject(new Error("read"));
              reader.readAsDataURL(file);
            });
          }
        }
        const uploaded = await uploadTvAsset(dataUrl);
        if (!uploaded) {
          setMsg(
            "No se pudo subir la imagen. Revise la conexión e intente de nuevo.",
          );
          return;
        }
        finalUrl = uploaded;
      } else if (file && file.type.startsWith("video/")) {
        setMsg("Subiendo video…");
        const uploaded = await uploadTvFile(file);
        if (!uploaded.ok) {
          setMsg(
            `${uploaded.error}. Pruebe un MP4 más liviano (máx. ~35 MB).`,
          );
          return;
        }
        finalUrl = uploaded.url;
      } else if (finalUrl.startsWith("data:")) {
        const uploaded = await uploadTvAsset(finalUrl);
        if (!uploaded) {
          setMsg("No se pudo subir al servidor. Revise la conexión.");
          return;
        }
        finalUrl = uploaded;
      }

      const r = createContent({
        name: name.trim(),
        type,
        url: finalUrl,
        durationSec: duration,
        userName,
      });
      if (!r.ok) {
        setMsg(r.error);
        return;
      }
      await adTvRepository.flushSync();
      await adTvRepository.refreshFromSync();
      setMsg(`✓ Guardado: ${r.data.name}. Vaya a Control TV y pulse ▶.`);
      setName("");
      setUrl("");
      setFileLabel("");
      setPreview(null);
      if (videoPreview) URL.revokeObjectURL(videoPreview);
      setVideoPreview(null);
      pickedFileRef.current = null;
      if (fileRef.current) fileRef.current.value = "";
    } finally {
      setBusy(false);
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
            Suba imagen o video, guarde, y reprodúzcalo desde Control TV.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="ad-btn ad-btn--gold" to={routes.tvControl}>
            Control TV
          </Link>
          <Link className="ad-btn" to={routes.tv}>
            ← Hub
          </Link>
        </div>
      </header>

      <section className="ad-panel space-y-3">
        <h2 className="ad-panel-title">Cómo verlo en el TV</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-[var(--ad-muted)]">
          <li>
            <strong className="text-[var(--ad-text)]">Guarde</strong> imagen o
            video aquí.
          </li>
          <li>TV vinculada en Pantallas.</li>
          <li>
            <Link
              className="text-[var(--ad-gold-soft)] underline"
              to={routes.tvControl}
            >
              Control TV
            </Link>{" "}
            → elija → ▶ Reproducir.
          </li>
        </ol>
        <p className="text-xs text-[var(--ad-muted)]">
          Reproductor:{" "}
          <Link
            className="text-[var(--ad-gold-soft)] underline"
            to={playerExample}
            target="_blank"
          >
            {playerExample}
          </Link>
        </p>
      </section>

      {canManage ? (
        <section className="ad-panel space-y-3">
          <h2 className="ad-panel-title">Agregar imagen o video</h2>
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
              Subir archivo
            </p>
            <input
              ref={fileRef}
              className="ad-input"
              type="file"
              accept="image/*,video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
              disabled={busy}
              onChange={(e) => void onPickFile(e.target.files?.[0] ?? null)}
            />
            {fileLabel ? (
              <p className="text-sm text-[var(--ad-gold-soft)]">{fileLabel}</p>
            ) : (
              <p className="text-xs text-[var(--ad-muted)]">
                Imagen hasta ~8 MB · Video MP4 hasta ~35 MB (recomendado MP4).
              </p>
            )}
            {preview ? (
              <img
                src={preview}
                alt="Vista previa"
                className="mt-2 max-h-48 w-full rounded object-contain bg-black/40"
              />
            ) : null}
            {videoPreview ? (
              <video
                src={videoPreview}
                className="mt-2 max-h-48 w-full rounded bg-black/40"
                controls
                playsInline
              />
            ) : null}
          </div>

          <label className="ad-pos__field">
            <span>O pegar URL (imagen o .mp4)</span>
            <input
              className="ad-input"
              placeholder="https://… imagen o video"
              value={url.startsWith("data:") ? "" : url}
              onChange={(e) => {
                pickedFileRef.current = null;
                setUrl(e.target.value);
                setFileLabel("");
                setPreview(
                  /\.(png|jpe?g|webp|gif)(\?|$)/i.test(e.target.value)
                    ? e.target.value
                    : null,
                );
                if (videoPreview) URL.revokeObjectURL(videoPreview);
                setVideoPreview(null);
                if (/\.(mp4|webm)(\?|$)/i.test(e.target.value)) {
                  setType("VIDEO");
                }
              }}
            />
          </label>

          <button
            type="button"
            className="ad-btn ad-btn--gold"
            disabled={busy}
            onClick={() => void save()}
          >
            {busy ? "Guardando…" : "Guardar contenido"}
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
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="ad-panel-title">Catálogo ({contents.length})</h2>
          <button
            type="button"
            className="ad-btn"
            onClick={() => void adTvRepository.refreshFromSync()}
          >
            Actualizar
          </button>
        </div>
        {!contents.length ? (
          <p className="text-sm text-[var(--ad-muted)]">
            Aún no hay contenido guardado.
          </p>
        ) : (
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
                {[...contents]
                  .sort((a, b) => {
                    const aUser = a.url.includes("/tv/assets/") ? 1 : 0;
                    const bUser = b.url.includes("/tv/assets/") ? 1 : 0;
                    if (aUser !== bUser) return bUser - aUser;
                    return (b.updatedAt || "").localeCompare(a.updatedAt || "");
                  })
                  .map((c) => (
                    <tr key={c.id}>
                      <td>
                        {c.type === "VIDEO" ? (
                          <span className="text-xs text-[var(--ad-gold-soft)]">
                            VIDEO
                          </span>
                        ) : c.url &&
                          (c.type === "IMAGE" ||
                            c.type === "PROMOTION" ||
                            c.type === "MENU" ||
                            c.url.includes("/tv/assets/") ||
                            c.url.startsWith("data:image")) ? (
                          <img
                            src={c.url}
                            alt=""
                            className="h-10 w-14 rounded object-cover"
                          />
                        ) : (
                          <span className="text-xs text-[var(--ad-muted)]">
                            —
                          </span>
                        )}
                      </td>
                      <td>{c.name}</td>
                      <td>{c.type}</td>
                      <td>{c.durationSec}s</td>
                      <td className="max-w-[180px] truncate text-xs">
                        {c.url.includes("/tv/assets/")
                          ? "Servidor TV"
                          : c.url.startsWith("data:")
                            ? "Archivo local"
                            : c.url || "—"}
                      </td>
                      <td>{c.active ? "Sí" : "No"}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
