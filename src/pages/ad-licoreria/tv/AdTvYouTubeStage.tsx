import { useEffect, useRef, useState } from "react";
import { youtubeEmbedUrl } from "@/services/ad-licoreria/tv/youtube";
import {
  isTvSoundUnlocked,
  markTvSoundUnlocked,
} from "@/services/ad-licoreria/tv/playhead";

type Props = {
  videoId: string;
  playing: boolean;
  muted?: boolean;
  volume?: number;
  /** Posición compartida entre TVs (segundos). */
  seekSec?: number;
  stageKey?: string;
};

type YtPlayer = {
  playVideo: () => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  setVolume: (n: number) => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
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
    PlayerState?: { PLAYING: number; ENDED: number };
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

function targetTime(player: YtPlayer, seekSec: number): number {
  const dur = Number(player.getDuration?.() || 0);
  const raw = Math.max(0, seekSec);
  if (dur > 1) return raw % dur;
  return raw;
}

function syncSeek(player: YtPlayer, seekSec: number) {
  const want = targetTime(player, seekSec);
  let cur = 0;
  try {
    cur = Number(player.getCurrentTime?.() || 0);
  } catch {
    cur = 0;
  }
  if (Math.abs(cur - want) > 1.25) {
    player.seekTo(want, true);
  }
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
 * YouTube en la TV: todas las pantallas siguen el mismo reloj.
 * El aviso de sonido NO reinicia el video.
 */
export default function AdTvYouTubeStage({
  videoId,
  playing,
  muted = false,
  volume = 100,
  seekSec = 0,
  stageKey = "0",
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YtPlayer | null>(null);
  const mutedRef = useRef(muted);
  const volumeRef = useRef(volume);
  const playingRef = useRef(playing);
  const seekRef = useRef(seekSec);
  const [needsTap, setNeedsTap] = useState(() => !isTvSoundUnlocked());
  const [usePlainIframe, setUsePlainIframe] = useState(false);

  mutedRef.current = muted;
  volumeRef.current = volume;
  playingRef.current = playing;
  seekRef.current = seekSec;

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
        const start = Math.max(0, Math.floor(seekRef.current));
        player = new YT.Player(host, {
          videoId,
          width: "100%",
          height: "100%",
          playerVars: {
            autoplay: 1,
            mute: 1,
            controls: 0,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            fs: 1,
            iv_load_policy: 3,
            start,
          },
          events: {
            onReady: (e) => {
              e.target.seekTo(targetTime(e.target, seekRef.current), true);
              if (playingRef.current) e.target.playVideo();
              applySound(e.target, mutedRef.current, volumeRef.current);
            },
            onStateChange: (e) => {
              const ended = YT.PlayerState?.ENDED ?? 0;
              const playingState = YT.PlayerState?.PLAYING ?? 1;
              if (e.data === ended && playingRef.current) {
                e.target.seekTo(targetTime(e.target, seekRef.current), true);
                e.target.playVideo();
              }
              if (e.data === playingState) {
                applySound(e.target, mutedRef.current, volumeRef.current);
                syncSeek(e.target, seekRef.current);
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

  useEffect(() => {
    const t = window.setInterval(() => {
      const player = playerRef.current;
      if (!player || !playingRef.current) return;
      try {
        syncSeek(player, seekRef.current);
      } catch {
        /* ignore */
      }
    }, 1500);
    return () => window.clearInterval(t);
  }, [videoId, stageKey]);

  function enableSound() {
    markTvSoundUnlocked();
    setNeedsTap(false);
    const player = playerRef.current;
    if (player) {
      applySound(player, false, volume || 100);
      try {
        syncSeek(player, seekRef.current);
        player.playVideo();
      } catch {
        /* ignore */
      }
    }
  }

  const iframeSrc = youtubeEmbedUrl(videoId, {
    autoplay: playing,
    muted: true,
    nocookie: true,
    startSec: seekSec,
  });

  return (
    <div className="relative h-full w-full bg-black">
      {usePlainIframe ? (
        <iframe
          key={`${videoId}-${stageKey}`}
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
          className="absolute bottom-8 right-8 z-10 max-w-[70%] rounded-full border border-amber-200/80 bg-black/75 px-6 py-3 text-lg text-amber-100 md:text-xl"
          onClick={enableSound}
        >
          🔊 Sonido (OK)
        </button>
      ) : null}
    </div>
  );
}
