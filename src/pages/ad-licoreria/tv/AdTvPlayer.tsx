import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import { adTvRepository } from "@/services/ad-licoreria/tv/repository";
import { isDirectVideoFileUrl } from "@/services/ad-licoreria/tv/media";
import {
  looksLikeYouTube,
  parseYouTubeVideoId,
} from "@/services/ad-licoreria/tv/youtube";
import { useAdTv } from "@/providers/ad-licoreria/AdTvProvider";
import type { AdTvCommand, AdTvContent } from "@/types/ad-tv";
import AdTvYouTubeStage from "@/pages/ad-licoreria/tv/AdTvYouTubeStage";
import {
  playheadElapsedSec,
  playlistCursor,
} from "@/services/ad-licoreria/tv/playhead";

/**
 * Reproductor fullscreen para el televisor.
 * 1) Muestra un código fijo hasta vincular.
 * 2) Vinculada: espera contenido del móvil (sin regenerar código ni recargar).
 */
export default function AdTvPlayer() {
  const { id = "" } = useParams();
  const {
    getScreen,
    contents,
    lastCommand,
    lastPlayCommand,
    beginPairing,
    heartbeat,
    realtime,
  } = useAdTv();

  const decoded = decodeURIComponent(id).trim() || "TV-001";
  const screen = getScreen(decoded);
  const playlist = useMemo(() => {
    const ids = screen?.playlistIds?.filter(Boolean) ?? [];
    const fromList = ids
      .map((cid) => contents.find((c) => c.id === cid && c.active !== false))
      .filter((c): c is AdTvContent => Boolean(c));
    if (fromList.length) return fromList;
    const one = contents.find((c) => c.id === screen?.currentContentId);
    return one ? [one] : [];
  }, [contents, screen?.playlistIds, screen?.currentContentId]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [pairedFlash, setPairedFlash] = useState(false);
  const [bootMsg, setBootMsg] = useState("Preparando pantalla…");
  /** Código fijo de esta sesión (no cambia hasta vincular). */
  const [lockedCode, setLockedCode] = useState<string | null>(null);
  /** Una vez vinculada en esta pestaña, no volver a pantalla de código. */
  const stickyPaired = useRef(false);
  const bootedRef = useRef(false);
  const flashShown = useRef(false);

  useEffect(() => {
    stickyPaired.current = false;
    flashShown.current = false;
    bootedRef.current = false;
    setLockedCode(null);
    setBootMsg("Conectando…");
  }, [decoded]);

  useEffect(() => {
    if (bootedRef.current) return;
    let cancelled = false;

    void (async () => {
      await adTvRepository.refreshFromSync();
      if (cancelled) return;

      const s = adTvRepository.getScreen(decoded);
      if (!s) {
        setBootMsg(
          "Pantalla no encontrada. Abra /tv/reproductor/TV-001 (o TV-002 / TV-003).",
        );
        return;
      }

      bootedRef.current = true;

      if (s.paired) {
        stickyPaired.current = true;
        setLockedCode(null);
        setBootMsg("");
        return;
      }

      const r = beginPairing({ screenId: s.id });
      if (!r.ok) {
        setBootMsg(r.error);
        bootedRef.current = false;
        return;
      }
      if (r.data.pairingCode) setLockedCode(r.data.pairingCode);
      setBootMsg("");
      await adTvRepository.flushSync();
    })();

    return () => {
      cancelled = true;
    };
  }, [decoded, beginPairing]);

  useEffect(() => {
    if (!screen) return;
    if (screen.paired) {
      stickyPaired.current = true;
      setLockedCode(null);
      return;
    }
    /** Ya vinculada en esta sesión: ignorar flappers de sync. */
    if (stickyPaired.current) return;
    if (screen.pairingCode) {
      setLockedCode((prev) => prev ?? screen.pairingCode ?? null);
    }
  }, [screen?.paired, screen?.pairingCode, screen]);

  useEffect(() => {
    if (!screen) return;
    /** Heartbeat silencioso: no debe regenerar código ni empujar pairing. */
    const t = window.setInterval(() => {
      heartbeat(screen.id);
    }, 12000);
    return () => window.clearInterval(t);
  }, [screen?.id, heartbeat]);

  useEffect(() => {
    if (!screen?.paired || flashShown.current) return;
    flashShown.current = true;
    stickyPaired.current = true;
    setPairedFlash(true);
    const t = window.setTimeout(() => setPairedFlash(false), 2000);
    return () => window.clearTimeout(t);
  }, [screen?.paired]);

  useEffect(() => {
    if (!screen) return;
    return realtime.subscribe((envelope) => {
      const cmd: AdTvCommand = envelope.command;
      if (!cmd.screenIds.includes(screen.id)) return;
      const el = videoRef.current;
      if (cmd.command === "PLAY") {
        void el?.play().catch(() => undefined);
      }
      if (cmd.command === "PAUSE") {
        el?.pause();
      }
      if (cmd.command === "STOP") {
        el?.pause();
        if (el) el.currentTime = 0;
      }
      if (
        cmd.command === "SEEK" ||
        cmd.command === "SYNC" ||
        cmd.command === "RESTART"
      ) {
        if (el) el.currentTime = cmd.position ?? 0;
      }
      if (cmd.command === "SET_VOLUME" && cmd.volume != null) {
        if (el) {
          el.volume = Math.max(0, Math.min(1, cmd.volume / 100));
          el.muted = false;
        }
      }
      if (cmd.command === "MUTE") {
        if (el) el.muted = cmd.muted ?? true;
      }
    });
  }, [screen?.id, realtime]);

  const playing =
    playlist.length > 0 && screen?.playbackState === "PLAYING";

  const [clockMs, setClockMs] = useState(() => Date.now());
  useEffect(() => {
    if (!playing) return;
    const t = window.setInterval(() => setClockMs(Date.now()), 500);
    return () => window.clearInterval(t);
  }, [playing, lastPlayCommand?.id, lastCommand?.id, lastCommand?.issuedAt]);

  const elapsedSec = playheadElapsedSec(
    lastPlayCommand ?? (lastCommand?.command === "PLAY" ? lastCommand : null),
    screen?.id,
    clockMs,
  );
  const cursor = playlistCursor(playlist, elapsedSec);
  const slide = cursor.slide;
  const seekSec = cursor.offsetSec;
  const playlistKey = playlist.map((c) => `${c.id}:${c.durationSec}`).join("|");

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !screen) return;
    el.volume = Math.max(0, Math.min(1, screen.volume / 100));
    el.muted = screen.isMuted;
    if (screen.playbackState === "PLAYING") {
      void el.play().catch(() => {
        el.muted = true;
        void el.play().catch(() => undefined);
      });
    } else if (
      screen.playbackState === "PAUSED" ||
      screen.playbackState === "STOPPED"
    ) {
      el.pause();
      if (screen.playbackState === "STOPPED") el.currentTime = 0;
    }
  }, [
    screen?.playbackState,
    screen?.volume,
    screen?.isMuted,
    screen?.currentContentId,
    slide,
  ]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !playing) return;
    const dur = Number(el.duration);
    const want = Number.isFinite(dur) && dur > 1 ? seekSec % dur : seekSec;
    if (Math.abs((el.currentTime || 0) - want) > 1.25) {
      el.currentTime = want;
    }
  }, [playing, seekSec, playlistKey]);

  const isPaired = Boolean(screen?.paired || stickyPaired.current);
  const shownCode = lockedCode || screen?.pairingCode || null;

  if (!screen) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0a0a0c] text-white px-6 text-center">
        <p className="text-2xl tracking-wide">Pantalla A&D</p>
        <p className="mt-3 text-sm opacity-60">{bootMsg || "Cargando…"}</p>
        <p className="mt-6 text-xs opacity-40">URL: {decoded}</p>
      </div>
    );
  }

  if (!isPaired) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,#1a1510_0%,#0a0a0c_70%)] text-white px-4">
        <p className="mb-2 text-sm uppercase tracking-[0.35em] text-amber-200/70">
          Esperando vínculo
        </p>
        <h1 className="font-[Cormorant_Garamond,serif] text-5xl md:text-7xl">
          A&D Licorería
        </h1>
        <p className="mt-6 text-sm opacity-70">
          {screen.name} · {screen.code}
        </p>
        <p className="mt-4 max-w-lg text-center text-base text-amber-100/80 md:text-lg">
          Anote este código en el teléfono. En esta TV no hay que hacer nada más.
        </p>
        <p
          className="mt-10 font-mono text-6xl tracking-[0.2em] text-amber-200 md:text-8xl"
          data-testid="tv-pairing-code"
        >
          {shownCode ?? "····"}
        </p>
        {!shownCode ? (
          <p className="mt-4 text-sm text-amber-100/70">
            {bootMsg || "Generando código…"}
          </p>
        ) : (
          <p className="mt-8 max-w-md text-center text-sm opacity-50">
            El código no cambia. Teléfono → Pantallas → Vincular → Control TV.
          </p>
        )}
      </div>
    );
  }

  const item = playlist.length
    ? playlist[slide % playlist.length]
    : undefined;
  const youtubeId = item ? parseYouTubeVideoId(item.url) : null;
  const youtubeBroken = Boolean(
    item &&
      (item.type === "YOUTUBE" || looksLikeYouTube(item.url)) &&
      !youtubeId,
  );

  return (
    <div className="fixed inset-0 overflow-hidden bg-black text-white">
      {pairedFlash ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80">
          <p className="text-3xl text-emerald-300">
            ✓ Vinculada · esperando contenido
          </p>
        </div>
      ) : null}

      {!playing ? (
        <div className="flex h-full flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,#121018_0%,#000_75%)] px-6 text-center">
          <p className="font-[Cormorant_Garamond,serif] text-5xl md:text-6xl">
            Pantalla lista
          </p>
          <p className="mt-4 max-w-md text-base tracking-wide text-amber-100/70">
            Esperando contenido del teléfono
          </p>
          <p className="mt-8 text-xs uppercase tracking-[0.2em] text-amber-100/40">
            Reproductor yt-6 · TVs en sincronía
          </p>
        </div>
      ) : youtubeId ? (
        <AdTvYouTubeStage
          videoId={youtubeId}
          playing={playing}
          muted={screen.isMuted}
          volume={screen.volume || 100}
          seekSec={seekSec}
          stageKey={`${item?.id ?? youtubeId}-${slide}`}
        />
      ) : youtubeBroken ? (
        <div className="flex h-full flex-col items-center justify-center px-8 text-center">
          <p className="text-2xl text-amber-100">
            No se pudo leer el enlace de YouTube
          </p>
          <p className="mt-4 max-w-lg text-sm text-amber-100/70">
            En Contenido elija «YouTube» y pegue youtube.com/watch o youtu.be.
          </p>
        </div>
      ) : item?.type === "VIDEO" && isDirectVideoFileUrl(item.url) ? (
        <video
          ref={videoRef}
          className="h-full w-full object-contain bg-black"
          src={item.url}
          autoPlay
          playsInline
          loop={playlist.length < 2}
          muted={screen.isMuted}
          controls={false}
        />
      ) : item?.type === "VIDEO" ? (
        <div className="flex h-full flex-col items-center justify-center px-8 text-center">
          <p className="text-2xl text-amber-100">Este video no se puede abrir</p>
          <p className="mt-4 max-w-lg text-sm text-amber-100/70">
            Use un archivo MP4 o elija el tipo YouTube.
          </p>
        </div>
      ) : item?.type === "TEXT" ? (
        <div className="flex h-full flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,#1a120c_0%,#050505_70%)] px-8 text-center">
          <p className="font-[Cormorant_Garamond,serif] text-4xl md:text-6xl text-amber-100">
            {item.notes || item.name}
          </p>
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-black">
          <img
            src={item?.url}
            alt=""
            className="max-h-full max-w-full object-contain"
            draggable={false}
          />
        </div>
      )}
    </div>
  );
}
