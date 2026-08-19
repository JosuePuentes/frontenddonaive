import { useEffect, useRef, useState } from "react";
import {
  bindYouTubePlayerHandle,
  createYouTubePlayer,
  type YouTubePlayerHandle,
} from "@/services/ad-licoreria/tv/youtube";

type Props = {
  videoId: string;
  playing: boolean;
  volume: number;
  muted: boolean;
  onBind?: (handle: YouTubePlayerHandle | null) => void;
};

/**
 * Reproductor YouTube a pantalla completa para las TVs vinculadas.
 */
export default function AdTvYouTubeStage({
  videoId,
  playing,
  volume,
  muted,
  onBind,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<{ destroy: () => void } | null>(null);
  const handleRef = useRef<YouTubePlayerHandle | null>(null);
  const playingRef = useRef(playing);
  const volumeRef = useRef(volume);
  const mutedRef = useRef(muted);
  const [error, setError] = useState("");
  playingRef.current = playing;
  volumeRef.current = volume;
  mutedRef.current = muted;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    const mount = document.createElement("div");
    mount.style.width = "100%";
    mount.style.height = "100%";
    host.replaceChildren(mount);
    setError("");

    void createYouTubePlayer(mount, videoId, {
      volume: volumeRef.current,
      muted: mutedRef.current,
      autoplay: playingRef.current,
      origin: window.location.origin,
      onReady: (player) => {
        if (cancelled) {
          player.destroy();
          return;
        }
        playerRef.current = player;
        const handle = bindYouTubePlayerHandle(player);
        handleRef.current = handle;
        onBind?.(handle);
        handle.setVolume(volumeRef.current);
        handle.setMuted(mutedRef.current);
        if (playingRef.current) handle.play();
        else handle.pause();
      },
      onError: () => {
        if (!cancelled) {
          setError(
            "YouTube no permite reproducir este video en la TV (el dueño desactivó la incrustación).",
          );
        }
      },
    }).catch((err: unknown) => {
      if (cancelled) return;
      const msg =
        err instanceof Error ? err.message : "No se pudo cargar YouTube";
      setError(msg);
    });

    return () => {
      cancelled = true;
      onBind?.(null);
      handleRef.current = null;
      try {
        playerRef.current?.destroy();
      } catch {
        /* ignore */
      }
      playerRef.current = null;
    };
    // Recrear solo al cambiar de video; play/volumen se aplican abajo.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount per videoId
  }, [videoId]);

  useEffect(() => {
    const handle = handleRef.current;
    if (!handle) return;
    handle.setVolume(volume);
    handle.setMuted(muted);
    if (playing) handle.play();
    else handle.pause();
  }, [playing, volume, muted]);

  return (
    <div className="relative h-full w-full bg-black">
      <div
        ref={hostRef}
        className="absolute inset-0 overflow-hidden [&>iframe]:h-full [&>iframe]:w-full [&>iframe]:border-0"
      />
      {error ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 px-8 text-center">
          <p className="max-w-lg text-lg text-amber-100/80">{error}</p>
        </div>
      ) : null}
    </div>
  );
}
