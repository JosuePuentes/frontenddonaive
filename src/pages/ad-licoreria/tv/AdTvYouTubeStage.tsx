import { useEffect, useRef, useState } from "react";
import { youtubeEmbedUrl } from "@/services/ad-licoreria/tv/youtube";

type Props = {
  videoId: string;
  playing: boolean;
  muted?: boolean;
  volume?: number;
  /** Cambia al avanzar carrusel para forzar recarga del iframe en la TV. */
  stageKey?: string;
};

type YtPlayer = {
  playVideo: () => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  setVolume: (n: number) => void;
  destroy: () => void;
};

type YtWindow = Window & {
  YT?: {
    Player: new (
      el: HTMLElement,
      opts: {
        videoId: string;
        width: string;
        height: string;
        playerVars: Record<string, string | number>;
        events: {
          onReady?: (e: { target: YtPlayer }) => void;
          onStateChange?: (e: { data: number; target: YtPlayer }) => void;
        };
      },
    ) => YtPlayer;
    PlayerState?: { PLAYING: number };
  };
  onYouTubeIframeAPIReady?: () => void;
};

const apiWaiters: Array<() => void> = [];

function ensureYouTubeApi(): Promise<void> {
  const w = window as YtWindow;
  if (w.YT?.Player) return Promise.resolve();
  return new Promise((resolve) => {
    apiWaiters.push(resolve);
    const prev = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      prev?.();
      apiWaiters.splice(0).forEach((fn) => fn());
    };
    if (!document.getElementById("ad-yt-iframe-api")) {
      const s = document.createElement("script");
      s.id = "ad-yt-iframe-api";
      s.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(s);
    }
  });
}

function applySound(player: YtPlayer, wantMuted: boolean, volume: number) {
  if (wantMuted) {
    player.mute();
    return;
  }
  player.unMute();
  player.setVolume(Math.max(1, Math.min(100, volume)));
}

/**
 * YouTube en la TV: arranca en silencio (autoplay) y luego activa audio.
 * Nunca usar <video src="https://youtube.com/watch?...">.
 */
export default function AdTvYouTubeStage({
  videoId,
  playing,
  muted = false,
  volume = 100,
  stageKey = "0",
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YtPlayer | null>(null);
  const mutedRef = useRef(muted);
  const volumeRef = useRef(volume);
  const playingRef = useRef(playing);
  const [needsTap, setNeedsTap] = useState(true);
  const [usePlainIframe, setUsePlainIframe] = useState(false);
  const [iframeMuted, setIframeMuted] = useState(true);

  mutedRef.current = muted;
  volumeRef.current = volume;
  playingRef.current = playing;

  useEffect(() => {
    if (usePlainIframe) return;
    const wrap = wrapRef.current;
    if (!wrap) return;
    wrap.innerHTML = "";
    const host = document.createElement("div");
    host.style.width = "100%";
    host.style.height = "100%";
    wrap.appendChild(host);

    let cancelled = false;
    let player: YtPlayer | null = null;
    const timeout = window.setTimeout(() => {
      if (!cancelled && !playerRef.current) setUsePlainIframe(true);
    }, 5000);

    void ensureYouTubeApi()
      .then(() => {
        if (cancelled) return;
        const YT = (window as YtWindow).YT;
        if (!YT?.Player) {
          setUsePlainIframe(true);
          return;
        }
        player = new YT.Player(host, {
          videoId,
          width: "100%",
          height: "100%",
          playerVars: {
            autoplay: 1,
            mute: 1,
            controls: 1,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            fs: 1,
            iv_load_policy: 3,
          },
          events: {
            onReady: (e) => {
              if (playingRef.current) e.target.playVideo();
              applySound(e.target, mutedRef.current, volumeRef.current);
              window.setTimeout(() => {
                try {
                  setNeedsTap(Boolean(e.target.isMuted()) && !mutedRef.current);
                } catch {
                  setNeedsTap(!mutedRef.current);
                }
              }, 700);
            },
            onStateChange: (e) => {
              if (e.data === (YT.PlayerState?.PLAYING ?? 1)) {
                applySound(e.target, mutedRef.current, volumeRef.current);
                window.setTimeout(() => {
                  try {
                    setNeedsTap(
                      Boolean(e.target.isMuted()) && !mutedRef.current,
                    );
                  } catch {
                    setNeedsTap(!mutedRef.current);
                  }
                }, 400);
              }
            },
          },
        });
        playerRef.current = player;
      })
      .catch(() => {
        if (!cancelled) setUsePlainIframe(true);
      });

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      playerRef.current = null;
      try {
        player?.destroy();
      } catch {
        /* ignore */
      }
      wrap.innerHTML = "";
    };
  }, [videoId, stageKey, usePlainIframe]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    applySound(player, muted, volume);
    if (playing) {
      try {
        player.playVideo();
      } catch {
        /* ignore */
      }
    }
  }, [muted, volume, playing]);

  function enableSound() {
    const player = playerRef.current;
    if (player) {
      applySound(player, false, volume || 100);
      try {
        player.playVideo();
      } catch {
        /* ignore */
      }
      setNeedsTap(false);
      return;
    }
    setIframeMuted(false);
    setNeedsTap(false);
  }

  const iframeSrc = youtubeEmbedUrl(videoId, {
    autoplay: playing,
    muted: iframeMuted,
    nocookie: true,
  });

  return (
    <div className="relative h-full w-full bg-black">
      {usePlainIframe ? (
        <iframe
          key={`${videoId}-${stageKey}-${iframeMuted ? "m" : "s"}`}
          title="YouTube"
          src={iframeSrc}
          className="absolute inset-0 h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
        />
      ) : (
        <div ref={wrapRef} className="absolute inset-0 h-full w-full" />
      )}

      {playing && needsTap && !muted ? (
        <button
          type="button"
          className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/55 px-6 text-center"
          onClick={enableSound}
        >
          <span className="rounded-full border border-amber-200/80 bg-black/70 px-10 py-6 text-3xl text-amber-100 md:text-5xl">
            🔊 Activar sonido
          </span>
          <span className="mt-5 max-w-lg text-base text-amber-100/80 md:text-xl">
            Pulse OK / Enter en el control del televisor
          </span>
        </button>
      ) : null}
    </div>
  );
}
