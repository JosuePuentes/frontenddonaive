import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import { adTvRepository } from "@/services/ad-licoreria/tv/repository";
import { useAdTv } from "@/providers/ad-licoreria/AdTvProvider";
import type { AdTvCommand } from "@/types/ad-tv";

/**
 * Reproductor fullscreen para el televisor.
 * Solo espera: muestra el código → cuando el móvil vincula y manda play, reproduce.
 * En la TV no hay que configurar nada más.
 */
export default function AdTvPlayer() {
  const { id = "" } = useParams();
  const {
    getScreen,
    contents,
    beginPairing,
    heartbeat,
    realtime,
  } = useAdTv();

  const decoded = decodeURIComponent(id).trim() || "TV-001";
  const screen = getScreen(decoded);
  const content = useMemo(
    () => contents.find((c) => c.id === screen?.currentContentId),
    [contents, screen?.currentContentId],
  );
  const videoRef = useRef<HTMLVideoElement>(null);
  const [pairedFlash, setPairedFlash] = useState(false);
  const [bootMsg, setBootMsg] = useState("Preparando pantalla…");
  /** Código fijado en UI para que no desaparezca por carreras de sync. */
  const [lockedCode, setLockedCode] = useState<string | null>(null);
  const wasPaired = useRef(false);
  const bootedFor = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    bootedFor.current = decoded;
    setLockedCode(null);
    setBootMsg("Conectando…");

    void (async () => {
      await adTvRepository.refreshFromSync();
      if (cancelled || bootedFor.current !== decoded) return;

      let s = adTvRepository.getScreen(decoded);
      if (!s) {
        setBootMsg(
          "Pantalla no encontrada. Abra /tv/reproductor/TV-001 (o TV-002 / TV-003).",
        );
        return;
      }

      if (s.paired) {
        setBootMsg("");
        setLockedCode(null);
        wasPaired.current = true;
        return;
      }

      const r = beginPairing({ screenId: s.id });
      if (!r.ok) {
        setBootMsg(r.error);
        return;
      }
      const code = r.data.pairingCode;
      if (code) setLockedCode(code);
      setBootMsg("");
      await adTvRepository.flushSync();
      if (cancelled) return;
      /** Relee sin pisar el código bloqueado en UI. */
      s = adTvRepository.getScreen(decoded);
      if (s?.pairingCode) setLockedCode(s.pairingCode);
    })();

    return () => {
      cancelled = true;
    };
  }, [decoded, beginPairing]);

  useEffect(() => {
    if (!screen || screen.paired) return;
    if (screen.pairingCode) {
      setLockedCode((prev) => prev || screen.pairingCode || null);
      return;
    }
    if (screen.status !== "PAIRING") {
      const r = beginPairing({ screenId: screen.id });
      if (r.ok && r.data.pairingCode) {
        setLockedCode(r.data.pairingCode);
        void adTvRepository.flushSync();
      }
    }
  }, [
    screen?.id,
    screen?.paired,
    screen?.pairingCode,
    screen?.status,
    beginPairing,
  ]);

  useEffect(() => {
    if (!screen) return;
    const t = window.setInterval(() => {
      heartbeat(screen.id);
    }, 8000);
    heartbeat(screen.id);
    return () => window.clearInterval(t);
  }, [screen?.id, heartbeat]);

  useEffect(() => {
    if (screen?.paired && !wasPaired.current) {
      setPairedFlash(true);
      setLockedCode(null);
      const t = window.setTimeout(() => setPairedFlash(false), 2200);
      wasPaired.current = true;
      return () => window.clearTimeout(t);
    }
    if (!screen?.paired) wasPaired.current = false;
  }, [screen?.paired]);

  useEffect(() => {
    if (!screen) return;
    return realtime.subscribe((envelope) => {
      const cmd: AdTvCommand = envelope.command;
      if (!cmd.screenIds.includes(screen.id)) return;
      const el = videoRef.current;
      if (!el) return;
      if (cmd.command === "PLAY") void el.play().catch(() => undefined);
      if (cmd.command === "PAUSE") el.pause();
      if (cmd.command === "STOP") {
        el.pause();
        el.currentTime = 0;
      }
      if (
        cmd.command === "SEEK" ||
        cmd.command === "SYNC" ||
        cmd.command === "RESTART"
      ) {
        el.currentTime = cmd.position ?? 0;
      }
      if (cmd.command === "SET_VOLUME" && cmd.volume != null) {
        el.volume = Math.max(0, Math.min(1, cmd.volume / 100));
        el.muted = false;
      }
      if (cmd.command === "MUTE") {
        el.muted = cmd.muted ?? true;
      }
    });
  }, [screen?.id, realtime]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !screen) return;
    el.volume = Math.max(0, Math.min(1, screen.volume / 100));
    el.muted = screen.isMuted;
    if (screen.playbackState === "PLAYING") {
      void el.play().catch(() => undefined);
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
  ]);

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

  if (!screen.paired) {
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
          Anote este código en el teléfono. Luego elija el contenido allí: en
          esta TV no hay que hacer nada más.
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
            Teléfono → TV → Pantallas → escriba el código → Vincular → Control TV
            → Reproducir.
          </p>
        )}
      </div>
    );
  }

  const idle =
    !content ||
    screen.playbackState === "IDLE" ||
    screen.playbackState === "STOPPED";

  return (
    <div className="fixed inset-0 overflow-hidden bg-black text-white">
      {pairedFlash ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80">
          <p className="text-3xl text-emerald-300">✓ Vinculada · espere el contenido</p>
        </div>
      ) : null}

      {idle ? (
        <div className="flex h-full flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,#121018_0%,#000_75%)] px-6 text-center">
          <p className="font-[Cormorant_Garamond,serif] text-5xl md:text-6xl">
            Pantalla lista
          </p>
          <p className="mt-4 max-w-md text-base tracking-wide text-amber-100/70">
            Esperando lo que elija en el teléfono (Control TV).
          </p>
          <p className="mt-10 text-xs opacity-35">
            {screen.name} · {screen.code}
          </p>
        </div>
      ) : content?.type === "VIDEO" ? (
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          src={content.url}
          autoPlay
          playsInline
          loop
        />
      ) : content?.type === "TEXT" ? (
        <div className="flex h-full flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,#1a120c_0%,#050505_70%)] px-8 text-center">
          <p className="font-[Cormorant_Garamond,serif] text-4xl md:text-6xl text-amber-100">
            {content.notes || content.name}
          </p>
        </div>
      ) : (
        <div
          className="h-full w-full bg-cover bg-center"
          style={{
            backgroundImage: content?.url
              ? `url(${content.url})`
              : undefined,
          }}
        >
          <div className="absolute bottom-6 left-6 right-6">
            <p className="text-lg font-semibold drop-shadow">{content?.name}</p>
          </div>
        </div>
      )}
    </div>
  );
}
