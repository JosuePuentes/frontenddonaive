import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  adTvPlayerPath,
  getAdLicoreriaRoutes,
} from "@/constants/ad-licoreria-routes";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import { useAdTv } from "@/providers/ad-licoreria/AdTvProvider";
import { adTvRepository } from "@/services/ad-licoreria/tv/repository";

/**
 * Centro de mando: elegir contenido y mandarlo a cada TV vinculada.
 */
export default function AdTvControl() {
  const { hasPermission, getCurrentOperator } = useAdLicoreria();
  const { screens, contents, audit, dispatchCommand } = useAdTv();
  const routes = getAdLicoreriaRoutes();
  const session = getCurrentOperator();
  const userName = session?.name ?? "Admin TV";
  const canControl = hasPermission("tv.control");
  const canView = hasPermission("tv.view");

  const activeContents = useMemo(
    () => contents.filter((c) => c.active !== false),
    [contents],
  );
  const [globalContentId, setGlobalContentId] = useState("");
  const [perScreenContent, setPerScreenContent] = useState<
    Record<string, string>
  >({});
  const [msg, setMsg] = useState("");

  useEffect(() => {
    void adTvRepository.refreshFromSync();
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

  const linked = useMemo(
    () => screens.filter((s) => s.paired || s.status === "ONLINE"),
    [screens],
  );
  const pairing = useMemo(
    () => screens.filter((s) => s.status === "PAIRING" && s.pairingCode),
    [screens],
  );

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

  function contentFor(screenId: string) {
    return (
      perScreenContent[screenId] ||
      globalContentId ||
      activeContents[0]?.id ||
      ""
    );
  }

  function playOn(screenIds: string[], contentId: string) {
    if (!contentId) {
      setMsg("Seleccione un contenido (o cree uno en Contenido)");
      return;
    }
    if (!screenIds.length) {
      setMsg("No hay pantallas vinculadas. Vincule el TV primero.");
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
      setMsg(`▶ Enviado «${name}» a ${r.data.screenIds.length} TV`);
    } else {
      setMsg(r.error);
    }
  }

  function stopOn(screenIds: string[]) {
    const r = dispatchCommand({
      command: "STOP",
      userName,
      screenIds,
    });
    if (r.ok) void adTvRepository.flushSync();
    setMsg(r.ok ? "⏹ Detenido" : r.error);
  }

  function thumb(url: string, type: string) {
    if (
      !url ||
      type === "TEXT" ||
      type === "VIDEO" ||
      !(
        url.includes("/tv/assets/") ||
        url.startsWith("data:image") ||
        type === "IMAGE" ||
        type === "PROMOTION" ||
        type === "MENU"
      )
    ) {
      return null;
    }
    return (
      <img
        src={url}
        alt=""
        className="h-16 w-24 shrink-0 rounded object-cover bg-black/40"
      />
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="ad-eyebrow">Centro de mando</p>
          <h1 className="ad-display text-4xl text-[var(--ad-gold-soft)]">
            Control TV
          </h1>
          <p className="mt-1 text-sm text-[var(--ad-muted)]">
            Elija la imagen y mándela a la TV vinculada.
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
        <h2 className="ad-panel-title">
          Contenido a enviar ({activeContents.length})
        </h2>

        {!activeContents.length ? (
          <div className="space-y-2 text-sm text-[var(--ad-muted)]">
            <p>
              Está vacío porque aún no hay contenido guardado en el servidor.
            </p>
            <p>
              Vaya a{" "}
              <Link
                className="text-[var(--ad-gold-soft)] underline"
                to={routes.tvContenido}
              >
                Contenido
              </Link>
              , suba la imagen y pulse <strong className="text-[var(--ad-text)]">Guardar contenido</strong>.
              Luego vuelva aquí.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-2">
              {activeContents.map((c) => {
                const selected = globalContentId === c.id;
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
                        {c.type} · {c.durationSec}s
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
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="ad-btn ad-btn--gold"
                onClick={() =>
                  playOn(
                    linked.map((s) => s.id),
                    globalContentId,
                  )
                }
                disabled={!linked.length || !globalContentId}
              >
                ▶ Reproducir en todas las TV vinculadas
              </button>
              <button
                type="button"
                className="ad-btn"
                onClick={() => stopOn(linked.map((s) => s.id))}
                disabled={!linked.length}
              >
                ⏹ Detener todas
              </button>
            </div>
          </>
        )}
        {msg ? (
          <p className="text-sm text-[var(--ad-gold-soft)]">{msg}</p>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="ad-panel-title px-1">TVs vinculadas ({linked.length})</h2>
        {!linked.length ? (
          <div className="ad-panel space-y-2 text-sm text-[var(--ad-muted)]">
            <p>Ninguna TV enlazada todavía.</p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                En el televisor abra{" "}
                <Link
                  className="text-[var(--ad-gold-soft)] underline"
                  to={adTvPlayerPath("TV-001")}
                  target="_blank"
                >
                  el reproductor TV-001
                </Link>
                .
              </li>
              <li>Anote el código A&amp;D-####.</li>
              <li>
                En{" "}
                <Link
                  className="text-[var(--ad-gold-soft)] underline"
                  to={routes.tvPantallas}
                >
                  Pantallas
                </Link>{" "}
                → Vincular.
              </li>
            </ol>
            {pairing.length ? (
              <p className="text-[var(--ad-gold-soft)]">
                Esperando vínculo:{" "}
                {pairing.map((s) => `${s.code} (${s.pairingCode})`).join(" · ")}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {linked.map((s) => {
              const cid = contentFor(s.id);
              const playing = contents.find((c) => c.id === s.currentContentId);
              return (
                <article key={s.id} className="ad-panel space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="ad-display text-2xl text-[var(--ad-gold-soft)]">
                        {s.name}
                      </h3>
                      <p className="text-xs text-[var(--ad-muted)]">
                        {s.code} · {s.status} · {s.playbackState}
                      </p>
                    </div>
                    <Link
                      className="ad-btn"
                      to={adTvPlayerPath(s.code)}
                      target="_blank"
                    >
                      Ver TV
                    </Link>
                  </div>
                  <p className="text-sm text-[var(--ad-muted)]">
                    Ahora:{" "}
                    <span className="text-[var(--ad-gold-soft)]">
                      {playing?.name ?? "Sin contenido"}
                    </span>
                  </p>
                  {activeContents.length ? (
                    <label className="ad-pos__field">
                      <span>Contenido para esta TV</span>
                      <select
                        className="ad-select"
                        value={cid}
                        onChange={(e) =>
                          setPerScreenContent((prev) => ({
                            ...prev,
                            [s.id]: e.target.value,
                          }))
                        }
                      >
                        {activeContents.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} · {c.type}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="ad-btn ad-btn--gold"
                      disabled={!cid}
                      onClick={() => playOn([s.id], cid)}
                    >
                      ▶ Reproducir aquí
                    </button>
                    <button
                      type="button"
                      className="ad-btn"
                      onClick={() => stopOn([s.id])}
                    >
                      ⏹ Detener
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
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
