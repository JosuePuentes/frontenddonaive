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
  isTvApiConfigured,
} from "@/services/ad-licoreria/tv/sync-client";
import {
  MAX_TV_IMAGE_BYTES,
  MAX_TV_VIDEO_BYTES,
  formatFileMb,
  friendlyTvTitle,
  inferTvMediaKind,
  isLikelyHevcOrMov,
} from "@/services/ad-licoreria/tv/media";
import {
  canonicalYouTubeUrl,
  fetchYouTubeTitle,
  isYouTubeUrl,
  looksLikeYouTube,
  parseYouTubeVideoId,
  youtubeThumbUrl,
} from "@/services/ad-licoreria/tv/youtube";
import {
  AD_TV_TYPE_OPTIONS,
  adTvTypeLabel,
} from "@/content/ad-licoreria/tv/type-labels";
import type { AdTvContentType } from "@/types/ad-tv";

export default function AdTvContenido() {
  const { hasPermission, getCurrentOperator } = useAdLicoreria();
  const { contents, screens, createContent, deleteContent } = useAdTv();
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
    const kind = inferTvMediaKind(file);
    if (!kind) {
      setMsg(
        "Ese archivo no se reconoce. Use una imagen (JPG/PNG/WebP) o un video (MP4, MOV, WebM).",
      );
      return;
    }
    const max = kind === "video" ? MAX_TV_VIDEO_BYTES : MAX_TV_IMAGE_BYTES;
    if (file.size > max) {
      setMsg(
        kind === "video"
          ? `Este video pesa ${formatFileMb(file.size)}. El máximo es ${formatFileMb(MAX_TV_VIDEO_BYTES)}. Recorte el video o baje a 720p.`
          : `Esta imagen pesa ${formatFileMb(file.size)}. El máximo es ${formatFileMb(MAX_TV_IMAGE_BYTES)}.`,
      );
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      pickedFileRef.current = file;
      setFileLabel(`${file.name} · ${formatFileMb(file.size)}`);
      if (videoPreview) URL.revokeObjectURL(videoPreview);
      setVideoPreview(null);
      setPreview(null);
      setUrl("");

      if (kind === "video") {
        setType("VIDEO");
        setDuration(30);
        if (file.size < 48 * 1024 * 1024) {
          setVideoPreview(URL.createObjectURL(file));
        }
        setName((prev) => prev.trim() || friendlyTvTitle(file, "video"));
        const hevcHint = isLikelyHevcOrMov(file)
          ? " Si la TV no lo reproduce, conviértalo a MP4 (H.264)."
          : "";
        setMsg(
          `Video listo (${formatFileMb(file.size)}). Pulse «Guardar contenido».${hevcHint}`,
        );
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
        setName((prev) => prev.trim() || friendlyTvTitle(file, "image"));
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
    const file = pickedFileRef.current;
    const kind = file ? inferTvMediaKind(file) : null;
    const pasted = url.trim();
    const youtubeId = !file ? parseYouTubeVideoId(pasted) : null;
    if (type === "VIDEO" && pasted && looksLikeYouTube(pasted) && !youtubeId && !file) {
      setMsg(
        "Esa URL de YouTube no es válida. Pegue el enlace del video (watch, youtu.be o Shorts).",
      );
      return;
    }
    const title =
      name.trim() ||
      (file && kind ? friendlyTvTitle(file, kind) : "") ||
      (youtubeId ? "Video YouTube" : "") ||
      (type === "TEXT" ? "Texto" : "");
    if (!title) {
      setMsg("Escriba un nombre corto (ej. Promo viernes) o suba un archivo");
      return;
    }
    if (type === "YOUTUBE" && !youtubeId) {
      setMsg(
        "Elija «YouTube» y pegue el enlace del video (youtube.com/watch o youtu.be).",
      );
      return;
    }
    if (type !== "TEXT" && type !== "YOUTUBE" && !file && !pasted) {
      setMsg("Suba una imagen o video, o pegue una URL de YouTube");
      return;
    }
    if (
      pasted &&
      /youtu\.?be/i.test(pasted) &&
      !youtubeId &&
      !file
    ) {
      setMsg(
        "Esa URL de YouTube no es válida. Pegue el enlace del video (watch, youtu.be o Shorts).",
      );
      return;
    }
    setBusy(true);
    setMsg(
      kind === "video"
        ? "Subiendo video…"
        : youtubeId
          ? "Guardando YouTube…"
          : file
            ? "Subiendo imagen…"
            : "Guardando…",
    );
    try {
      let finalUrl = pasted;
      let resolvedName = title;
      let resolvedType: AdTvContentType =
        kind === "video" ? "VIDEO" : kind === "image" ? "IMAGE" : type;

      if (youtubeId) {
        finalUrl = canonicalYouTubeUrl(youtubeId);
        resolvedType = "YOUTUBE";
        if (!name.trim()) {
          const ytTitle = await fetchYouTubeTitle(youtubeId);
          if (ytTitle) resolvedName = ytTitle;
        }
      } else if (file && kind === "image") {
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
            "No se pudo guardar la imagen. Si persiste, falta configurar la API del servidor.",
          );
          return;
        }
        finalUrl = uploaded;
      } else if (file && kind === "video") {
        const uploaded = await uploadTvFile(file, {
          onProgress: (pct) => setMsg(`Subiendo video… ${pct}%`),
        });
        if (!uploaded.ok) {
          setMsg(uploaded.error);
          return;
        }
        finalUrl = uploaded.url;
      } else if (finalUrl.startsWith("data:")) {
        const uploaded = await uploadTvAsset(finalUrl);
        if (!uploaded) {
          setMsg(
            "No se pudo guardar. Falta la API del servidor (no es la señal del móvil).",
          );
          return;
        }
        finalUrl = uploaded;
      }

      const r = createContent({
        name: resolvedName,
        type: resolvedType,
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
      const localOnly = !isTvApiConfigured();
      setMsg(
        localOnly
          ? `✓ Guardado en este teléfono: ${r.data.name}. Para que el TV lo vea hace falta la API (VITE_API_BASE_URL).`
          : `✓ Guardado: ${r.data.name}. Vaya a Control TV y pulse ▶.`,
      );
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
            Suba imagen o video de archivo, o elija <strong>YouTube</strong> y
            pegue el enlace. Luego reprodúzcalo desde Control TV.
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
            <strong className="text-[var(--ad-text)]">Guarde</strong> una
            imagen, un MP4 o elija <strong>YouTube</strong> y pegue el enlace.
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
              onChange={(e) => {
                const next = e.target.value as AdTvContentType;
                setType(next);
                if (next === "YOUTUBE") {
                  pickedFileRef.current = null;
                  setFileLabel("");
                  if (videoPreview) URL.revokeObjectURL(videoPreview);
                  setVideoPreview(null);
                  setDuration(30);
                  setMsg(
                    "Pegue el enlace de YouTube y pulse «Guardar contenido».",
                  );
                }
              }}
            >
              {AD_TV_TYPE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
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

          {type !== "YOUTUBE" && type !== "TEXT" ? (
          <div className="space-y-2 rounded border border-[var(--ad-line)] p-3">
            <p className="text-xs uppercase tracking-wide text-[var(--ad-gold)]">
              Subir archivo
            </p>
            <input
              ref={fileRef}
              className="ad-input"
              type="file"
              accept="image/*,video/*,.mp4,.webm,.mov,.m4v,.avi"
              disabled={busy}
              onChange={(e) => void onPickFile(e.target.files?.[0] ?? null)}
            />
            {fileLabel ? (
              <p className="text-sm text-[var(--ad-gold-soft)]">{fileLabel}</p>
            ) : (
              <p className="text-xs text-[var(--ad-muted)]">
                Imagen hasta 12 MB · Video hasta 512 MB (se sube por partes;
                use WiFi). MP4 H.264 recomendado.
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
          ) : null}

          <label className="ad-pos__field">
            <span>
              {type === "YOUTUBE"
                ? "Enlace de YouTube"
                : "O pegar URL (YouTube, imagen o MP4)"}
            </span>
            <input
              className="ad-input"
              placeholder={
                type === "YOUTUBE"
                  ? "https://www.youtube.com/watch?v=… o youtu.be/…"
                  : "https://youtube.com/watch?v=… o imagen"
              }
              value={url.startsWith("data:") ? "" : url}
              onChange={(e) => {
                const value = e.target.value;
                pickedFileRef.current = null;
                setUrl(value);
                setFileLabel("");
                if (videoPreview) URL.revokeObjectURL(videoPreview);
                setVideoPreview(null);
                const yt = parseYouTubeVideoId(value);
                if (yt) {
                  setType("YOUTUBE");
                  setDuration((d) => (d < 30 ? 30 : d));
                  setPreview(youtubeThumbUrl(yt));
                  setName((prev) => prev.trim() || "Video YouTube");
                  setMsg(
                    "YouTube listo. Pulse «Guardar contenido» y en Control TV pulse ▶.",
                  );
                  void fetchYouTubeTitle(yt).then((title) => {
                    if (title) {
                      setName((prev) =>
                        !prev.trim() || prev === "Video YouTube" ? title : prev,
                      );
                    }
                  });
                  return;
                }
                setPreview(
                  /\.(png|jpe?g|webp|gif)(\?|$)/i.test(value) ? value : null,
                );
                if (/\.(mp4|webm)(\?|$)/i.test(value)) {
                  setType("VIDEO");
                }
              }}
            />
          </label>
          {type === "YOUTUBE" && preview ? (
            <img
              src={preview}
              alt="Vista previa YouTube"
              className="max-h-48 w-full rounded object-contain bg-black/40"
            />
          ) : null}

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
                  {canManage ? <th></th> : null}
                </tr>
              </thead>
              <tbody>
                {[...contents]
                  .sort((a, b) => {
                    const rank = (u: string) =>
                      u.includes("/tv/assets/") || isYouTubeUrl(u) ? 1 : 0;
                    const aUser = rank(a.url);
                    const bUser = rank(b.url);
                    if (aUser !== bUser) return bUser - aUser;
                    return (b.updatedAt || "").localeCompare(a.updatedAt || "");
                  })
                  .map((c) => {
                    const yt = parseYouTubeVideoId(c.url);
                    return (
                    <tr key={c.id}>
                      <td>
                        {yt ? (
                          <img
                            src={youtubeThumbUrl(yt)}
                            alt=""
                            className="h-10 w-14 rounded object-cover"
                          />
                        ) : c.type === "VIDEO" || c.type === "YOUTUBE" ? (
                          <span className="text-xs text-[var(--ad-gold-soft)]">
                            {adTvTypeLabel(c.type)}
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
                      <td>{adTvTypeLabel(c.type)}</td>
                      <td>{c.durationSec}s</td>
                      <td className="max-w-[180px] truncate text-xs">
                        {yt
                          ? "YouTube"
                          : c.url.includes("/tv/assets/")
                          ? "Servidor TV"
                          : c.url.startsWith("data:")
                            ? "Archivo local"
                            : c.url || "—"}
                      </td>
                      <td>{c.active ? "Sí" : "No"}</td>
                      {canManage ? (
                        <td>
                          <button
                            type="button"
                            className="ad-btn"
                            onClick={() => {
                              if (
                                !window.confirm(
                                  `¿Borrar «${c.name}»? No se puede deshacer.`,
                                )
                              ) {
                                return;
                              }
                              const r = deleteContent({
                                contentId: c.id,
                                userName,
                              });
                              setMsg(
                                r.ok ? `Borrado: ${c.name}` : r.error,
                              );
                              if (r.ok) {
                                void adTvRepository.flushSync();
                              }
                            }}
                          >
                            Borrar
                          </button>
                        </td>
                      ) : null}
                    </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
