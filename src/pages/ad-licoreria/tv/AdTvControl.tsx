import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  adTvPlayerPath,
  getAdLicoreriaRoutes,
} from "@/constants/ad-licoreria-routes";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import { useAdTv } from "@/providers/ad-licoreria/AdTvProvider";
import { adTvRepository } from "@/services/ad-licoreria/tv/repository";
import { adTvTypeLabel } from "@/content/ad-licoreria/tv/type-labels";
import {
  isYouTubeUrl,
  parseYouTubeVideoId,
  youtubeThumbUrl,
} from "@/services/ad-licoreria/tv/youtube";

const PREVIEW_BASE =
  typeof window !== "undefined" ? window.location.origin : "";

/**
 * Centro de mando: elegir contenido y mandarlo a las TVs vinculadas.
 */
export default function AdTvControl() {
  const { hasPermission, getCurrentOperator } = useAdLicoreria();
  const { screens, contents, audit, dispatchCommand } = useAdTv();
  const routes = getAdLicoreriaRoutes();
  const session = getCurrentOperator();
  const userName = session?.name ?? "Admin TV";
  const canControl = hasPermission("tv.control");
  const canView = hasPermission("tv.view");

  const activeContents = useMemo(() => {
    const list = contents.filter((c) => c.active !== false);
    return [...list].sort((a, b) => {
      const rank = (u: string) =>
        u.includes("/tv/assets/") || isYouTubeUrl(u) ? 1 : 0;
      const aUser = rank(a.url);
      const bUser = rank(b.url);
      if (aUser !== bUser) return bUser - aUser;
      return (b.updatedAt || "").localeCompare(a.updatedAt || "");
    });
  }, [contents]);

  const [globalContentId, setGlobalContentId] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [msg, setMsg] = useState("");

  const linked = useMemo(
    () => screens.filter((s) => s.paired || s.status === "ONLINE"),
    [screens],
  );
  const pairing = useMemo(
    () => screens.filter((s) => s.status === "PAIRING" && s.pairingCode),
    [screens],
  );

  useEffect(() => {
    void adTvRepository.refreshFromSync();
    const t = window.setInterval(() => {
      void adTvRepository.refreshFromSync();
    }, 2500);
    const onVis = () => {
      if (document.visibilityState === "visible") {
        void adTvRepository.refreshFromSync();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  useEffect(() => {
    if (!activeContents.length) {
      setGlobalContentId("");
      return;
    }
    setGlobalContentId((prev) =>
      prev && activeContents.some((c) => c.id === prev)
        ? prev
        : activeContents[0].id,
    );
  }, [activeContents]);

  useEffect(() => {
    setSelectedIds((prev) => {
      const linkedIds = linked.map((s) => s.id);
      if (!linkedIds.length) return [];
      const kept = prev.filter((id) => linkedIds.includes(id));
      /** Por defecto: todas las vinculadas. */
      return kept.length ? kept : linkedIds;
    });
  }, [linked]);

  if (!canView || !canControl) {
    return (
      <div className="ad-panel">
        <h1 className="ad-panel-title">Acceso no autorizado</h1>
        <p className="text-sm text-[var(--ad-muted)]">
          Se requiere tv.view y tv.control.
        </p>
      </div>
    );
  }

  function toggleScreen(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function playOn(screenIds: string[], contentId: string) {
    if (!contentId) {
      setMsg("Seleccione un contenido (o cree uno en Contenido)");
      return;
    }
    if (!screenIds.length) {
      setMsg("Marque al menos una TV vinculada.");
      return;
    }
    const r = dispatchCommand({
      command: "PLAY",
      userName,
      contentId,
      position: 0,
      screenIds,
    });
    if (r.ok) {
      void adTvRepository.flushSync();
      const name =
        activeContents.find((c) => c.id === contentId)?.name ?? contentId;
      setMsg(`▶ «${name}» → ${r.data.screenIds.length} TV`);
    } else {
      setMsg(r.error);
    }
  }

  function stopOn(screenIds: string[]) {
    if (!screenIds.length) {
      setMsg("Marque al menos una TV.");
      return;
    }
    const r = dispatchCommand({
      command: "STOP",
      userName,
      screenIds,
    });
    if (r.ok) void adTvRepository.flushSync();
    setMsg(r.ok ? "⏹ Detenido" : r.error);
  }

  function thumb(url: string, type: string) {
    const yt = parseYouTubeVideoId(url);
    if (yt) {
      return (
        <img
          src={youtubeThumbUrl(yt)}
          alt=""
          className="h-16 w-24 shrink-0 rounded object-cover bg-black/40"
        />
      );
    }
    if (
      !url ||
      type === "TEXT" ||
      type === "VIDEO" ||
      type === "YOUTUBE" ||
      !(
        url.includes("/tv/assets/") ||
        url.startsWith("data:image") ||
        type === "IMAGE" ||
        type === "PROMOTION" ||
        type === "MENU"
      )
    ) {
      return (
        <span className="flex h-16 w-24 shrink-0 items-center justify-center rounded bg-black/40 text-xs text-[var(--ad-muted)]">
          {type}
        </span>
      );
    }
    return (
      <img
        src={url}
        alt=""
        className="h-16 w-24 shrink-0 rounded object-cover bg-black/40"
      />
    );
  }

  const playerUrls = ["TV-001", "TV-002", "TV-003"].map((code) => ({
    code,
    path: adTvPlayerPath(code),
    absolute: `${PREVIEW_BASE}${adTvPlayerPath(code)}`,
  }));

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="ad-eyebrow">Centro de mando</p>
          <h1 className="ad-display text-4xl text-[var(--ad-gold-soft)]">
            Control TV
          </h1>
          <p className="mt-1 text-sm text-[var(--ad-muted)]">
            Elija contenido (imagen, video o YouTube), marque las TVs y pulse
            Reproducir.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="ad-btn" to={routes.tvPantallas}>
            Vincular
          </Link>
          <Link className="ad-btn ad-btn--gold" to={routes.tvContenido}>
            + Contenido
          </Link>
          <Link className="ad-btn" to={routes.tv}>
            ← Hub
          </Link>
        </div>
      </header>

      <section className="ad-panel space-y-3">
        <h2 className="ad-panel-title">Abrir otra TV (URL del reproductor)</h2>
        <p className="text-sm text-[var(--ad-muted)]">
          En cada televisor abra una URL distinta, anote el código y vincúlela
          en Pantallas.
        </p>
        <ul className="space-y-2 text-sm">
          {playerUrls.map((u) => (
            <li key={u.code} className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[var(--ad-gold-soft)]">
                {u.code}
              </span>
              <Link
                className="ad-btn"
                to={u.path}
                target="_blank"
                rel="noreferrer"
              >
                Abrir
              </Link>
              <code className="break-all text-xs text-[var(--ad-muted)]">
                {u.absolute || u.path}
              </code>
            </li>
          ))}
        </ul>
      </section>

      <section className="ad-panel space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="ad-panel-title">
            Contenido a enviar ({activeContents.length})
          </h2>
          <button
            type="button"
            className="ad-btn"
            onClick={() => void adTvRepository.refreshFromSync()}
          >
            Actualizar lista
          </button>
        </div>

        {!activeContents.length ? (
          <div className="space-y-2 text-sm text-[var(--ad-muted)]">
            <p>No hay contenido. Guarde una imagen en Contenido.</p>
            <Link
              className="ad-btn ad-btn--gold"
              to={routes.tvContenido}
            >
              Ir a Contenido
            </Link>
          </div>
        ) : (
          <div className="grid gap-2">
            {activeContents.map((c) => {
              const selected = globalContentId === c.id;
              const isUpload = c.url.includes("/tv/assets/");
              const isYt = isYouTubeUrl(c.url);
              return (
                <button
                  key={c.id}
                  type="button"
                  className={[
                    "flex w-full items-center gap-3 rounded border p-3 text-left transition",
                    selected
                      ? "border-[var(--ad-gold)] bg-[var(--ad-gold)]/10"
                      : "border-[var(--ad-line)]",
                  ].join(" ")}
                  onClick={() => setGlobalContentId(c.id)}
                >
                  {thumb(c.url, c.type)}
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-[var(--ad-gold-soft)]">
                      {c.name}
                    </span>
                    <span className="block text-xs text-[var(--ad-muted)]">
                      {adTvTypeLabel(c.type)} · {c.durationSec}s
                      {isYt ? " · YouTube" : isUpload ? " · Su imagen" : ""}
                    </span>
                  </span>
                  {selected ? (
                    <span className="text-xs text-[var(--ad-gold-soft)]">
                      Elegido
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="ad-panel space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="ad-panel-title">
            TVs para reproducir ({selectedIds.length}/{linked.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="ad-btn"
              disabled={!linked.length}
              onClick={() => setSelectedIds(linked.map((s) => s.id))}
            >
              Todas
            </button>
            <button
              type="button"
              className="ad-btn"
              disabled={!linked.length}
              onClick={() => setSelectedIds([])}
            >
              Ninguna
            </button>
          </div>
        </div>

        {!linked.length ? (
          <div className="space-y-2 text-sm text-[var(--ad-muted)]">
            <p>Ninguna TV vinculada todavía.</p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                Abra en un TV:{" "}
                <Link
                  className="text-[var(--ad-gold-soft)] underline"
                  to={adTvPlayerPath("TV-001")}
                  target="_blank"
                >
                  TV-001
                </Link>
                {" · "}
                <Link
                  className="text-[var(--ad-gold-soft)] underline"
                  to={adTvPlayerPath("TV-002")}
                  target="_blank"
                >
                  TV-002
                </Link>
              </li>
              <li>
                Vincule cada código en{" "}
                <Link
                  className="text-[var(--ad-gold-soft)] underline"
                  to={routes.tvPantallas}
                >
                  Pantallas
                </Link>
                .
              </li>
            </ol>
            {pairing.length ? (
              <p className="text-[var(--ad-gold-soft)]">
                Esperando:{" "}
                {pairing.map((s) => `${s.code} (${s.pairingCode})`).join(" · ")}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="grid gap-2">
            {linked.map((s) => {
              const checked = selectedIds.includes(s.id);
              const playing = contents.find((c) => c.id === s.currentContentId);
              return (
                <label
                  key={s.id}
                  className={[
                    "flex cursor-pointer items-start gap-3 rounded border p-3",
                    checked
                      ? "border-[var(--ad-gold)] bg-[var(--ad-gold)]/10"
                      : "border-[var(--ad-line)]",
                  ].join(" ")}
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={checked}
                    onChange={() => toggleScreen(s.id)}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-[var(--ad-gold-soft)]">
                      {s.name} · {s.code}
                    </span>
                    <span className="block text-xs text-[var(--ad-muted)]">
                      {s.status} · {s.playbackState} · Ahora:{" "}
                      {playing?.name ?? "Sin contenido"}
                    </span>
                  </span>
                  <Link
                    className="ad-btn"
                    to={adTvPlayerPath(s.code)}
                    target="_blank"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Ver
                  </Link>
                </label>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="ad-btn ad-btn--gold"
            disabled={!selectedIds.length || !globalContentId}
            onClick={() => playOn(selectedIds, globalContentId)}
          >
            ▶ Reproducir en las TV marcadas
          </button>
          <button
            type="button"
            className="ad-btn"
            disabled={!selectedIds.length}
            onClick={() => stopOn(selectedIds)}
          >
            ⏹ Detener marcadas
          </button>
        </div>
        {msg ? (
          <p className="text-sm text-[var(--ad-gold-soft)]">{msg}</p>
        ) : null}
      </section>

      <section className="ad-panel space-y-2">
        <h2 className="ad-panel-title">Auditoría</h2>
        {audit.slice(0, 8).map((e) => (
          <p key={e.id} className="text-sm">
            <span className="text-[var(--ad-gold-soft)]">{e.action}</span> ·{" "}
            {e.detail}
          </p>
        ))}
      </section>
    </div>
  );
}
