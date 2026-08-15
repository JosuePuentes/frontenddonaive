import { useMemo, useState } from "react";
import { Link } from "react-router";
import { AD_LICORERIA_ROUTES } from "@/constants/ad-licoreria-routes";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import { useAdTv } from "@/providers/ad-licoreria/AdTvProvider";
import type { AdTvCommandType } from "@/types/ad-tv";

type TargetMode = "one" | "many" | "group" | "all";

export default function AdTvControl() {
  const { hasPermission, getCurrentOperator } = useAdLicoreria();
  const { screens, contents, groups, audit, dispatchCommand } = useAdTv();
  const session = getCurrentOperator();
  const userName = session?.name ?? "Admin TV";
  const canControl = hasPermission("tv.control");
  const canView = hasPermission("tv.view");

  const [mode, setMode] = useState<TargetMode>("all");
  const [screenId, setScreenId] = useState(screens[0]?.id ?? "");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "");
  const [contentId, setContentId] = useState(
    contents.find((c) => c.id === "tvc-promo-viernes")?.id ??
      contents[0]?.id ??
      "",
  );
  const [msg, setMsg] = useState("");

  const online = useMemo(
    () => screens.filter((s) => s.status === "ONLINE"),
    [screens],
  );
  const offline = useMemo(
    () => screens.filter((s) => s.status === "OFFLINE"),
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

  function targetPayload() {
    if (mode === "all") return { all: true as const };
    if (mode === "group") return { groupId };
    if (mode === "many") return { screenIds: selectedIds };
    return { screenIds: screenId ? [screenId] : [] };
  }

  function run(command: AdTvCommandType, extra?: { volume?: number; muted?: boolean; position?: number }) {
    const r = dispatchCommand({
      command,
      userName,
      contentId:
        command === "PLAY" || command === "LOAD_CONTENT"
          ? contentId
          : undefined,
      position: extra?.position ?? (command === "PLAY" ? 0 : undefined),
      volume: extra?.volume,
      muted: extra?.muted,
      ...targetPayload(),
    });
    setMsg(
      r.ok
        ? `${command} → ${r.data.screenIds.length} pantalla(s)`
        : r.error,
    );
  }

  function toggleMany(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  const contentLabel =
    contents.find((c) => c.id === contentId)?.name ?? "—";

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="ad-eyebrow">Centro de mando</p>
          <h1 className="ad-display text-4xl text-[var(--ad-gold-soft)]">
            Control TV
          </h1>
          <p className="mt-1 text-sm text-[var(--ad-muted)]">
            MOCK — preparado para WebSocket backend.
          </p>
        </div>
        <Link className="ad-btn" to={AD_LICORERIA_ROUTES.tv}>
          ← Hub
        </Link>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="ad-panel">
          <p className="text-xs text-[var(--ad-muted)]">PANTALLAS ONLINE</p>
          <p className="ad-display text-3xl text-emerald-400">{online.length}</p>
          <p className="mt-1 text-xs text-[var(--ad-muted)]">
            {online.map((s) => s.name).join(", ") || "—"}
          </p>
        </div>
        <div className="ad-panel">
          <p className="text-xs text-[var(--ad-muted)]">PANTALLAS OFFLINE</p>
          <p className="ad-display text-3xl text-rose-400">{offline.length}</p>
        </div>
        <div className="ad-panel">
          <p className="text-xs text-[var(--ad-muted)]">CONTENIDO ACTUAL</p>
          <p className="mt-2 text-sm text-[var(--ad-gold-soft)]">{contentLabel}</p>
        </div>
        <div className="ad-panel">
          <p className="text-xs text-[var(--ad-muted)]">GRUPOS</p>
          <p className="ad-display text-3xl">{groups.length}</p>
        </div>
      </section>

      <section className="ad-panel space-y-4">
        <h2 className="ad-panel-title">Destino</h2>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", "TODAS LAS PANTALLAS"],
              ["group", "Grupo"],
              ["many", "Varias"],
              ["one", "Una"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              className={`ad-btn ${mode === k ? "ad-btn--gold" : ""}`}
              onClick={() => setMode(k)}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === "one" ? (
          <select
            className="ad-select"
            value={screenId}
            onChange={(e) => setScreenId(e.target.value)}
          >
            {screens.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.status})
              </option>
            ))}
          </select>
        ) : null}

        {mode === "many" ? (
          <div className="flex flex-wrap gap-2">
            {screens.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`ad-btn ${selectedIds.includes(s.id) ? "ad-btn--gold" : ""}`}
                onClick={() => toggleMany(s.id)}
              >
                {s.name}
              </button>
            ))}
          </div>
        ) : null}

        {mode === "group" ? (
          <select
            className="ad-select"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} ({g.screenIds.length})
              </option>
            ))}
          </select>
        ) : null}

        <div>
          <label className="mb-1 block text-xs text-[var(--ad-muted)]">
            Contenido
          </label>
          <select
            className="ad-select"
            value={contentId}
            onChange={(e) => setContentId(e.target.value)}
          >
            {contents.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.type}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="ad-btn ad-btn--gold"
            onClick={() => run("PLAY")}
          >
            ▶ REPRODUCIR
          </button>
          <button type="button" className="ad-btn" onClick={() => run("PAUSE")}>
            ⏸ PAUSAR
          </button>
          <button type="button" className="ad-btn" onClick={() => run("STOP")}>
            ⏹ DETENER
          </button>
          <button
            type="button"
            className="ad-btn"
            onClick={() => run("RESTART")}
          >
            🔄 REINICIAR
          </button>
          <button
            type="button"
            className="ad-btn"
            onClick={() => run("LOAD_CONTENT")}
          >
            ⏭ SIGUIENTE / CARGAR
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="ad-btn"
            onClick={() => {
              const sample = screens[0];
              run("SET_VOLUME", {
                volume: Math.min(100, (sample?.volume ?? 70) + 10),
              });
            }}
          >
            Volumen +
          </button>
          <button
            type="button"
            className="ad-btn"
            onClick={() => {
              const sample = screens[0];
              run("SET_VOLUME", {
                volume: Math.max(0, (sample?.volume ?? 70) - 10),
              });
            }}
          >
            Volumen −
          </button>
          <button
            type="button"
            className="ad-btn"
            onClick={() => run("MUTE", { muted: true })}
          >
            Mute
          </button>
        </div>

        {msg ? (
          <p className="text-sm text-[var(--ad-gold-soft)]">{msg}</p>
        ) : null}
      </section>

      <section className="ad-panel space-y-2">
        <h2 className="ad-panel-title">Auditoría reciente</h2>
        {audit.slice(0, 10).map((e) => (
          <p key={e.id} className="text-sm">
            <span className="text-[var(--ad-gold-soft)]">{e.action}</span> ·{" "}
            {e.detail} · {e.userName}
          </p>
        ))}
      </section>
    </div>
  );
}
