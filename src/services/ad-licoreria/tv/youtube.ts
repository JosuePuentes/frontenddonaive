/** URLs de YouTube para Contenido TV (watch, youtu.be, Shorts, embed). */

const YT_ID = /^[A-Za-z0-9_-]{11}$/;

function validYouTubeId(raw: string | undefined | null): string | null {
  const id = String(raw || "")
    .trim()
    .replace(/[^A-Za-z0-9_-].*$/, "");
  return YT_ID.test(id) ? id : null;
}

function isYouTubeHost(hostname: string): boolean {
  const host = hostname.replace(/^www\./, "").toLowerCase();
  return (
    host === "youtu.be" ||
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "music.youtube.com" ||
    host === "youtube-nocookie.com"
  );
}

export function parseYouTubeVideoId(raw: string): string | null {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return null;
  if (YT_ID.test(trimmed)) return trimmed;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (!isYouTubeHost(url.hostname)) return null;
  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  if (host === "youtu.be") {
    return validYouTubeId(url.pathname.split("/").filter(Boolean)[0]);
  }
  const fromQuery = validYouTubeId(url.searchParams.get("v"));
  if (fromQuery) return fromQuery;
  const parts = url.pathname.split("/").filter(Boolean);
  const markers = new Set(["embed", "shorts", "live", "v", "e"]);
  const idx = parts.findIndex((p) => markers.has(p.toLowerCase()));
  if (idx >= 0) return validYouTubeId(parts[idx + 1]);
  return null;
}

export function isYouTubeUrl(raw: string): boolean {
  return Boolean(parseYouTubeVideoId(raw));
}

export function canonicalYouTubeUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function youtubeThumbUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export async function fetchYouTubeTitle(videoId: string): Promise<string | null> {
  try {
    const watch = canonicalYouTubeUrl(videoId);
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(watch)}&format=json`,
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { title?: string };
    const title = String(json.title || "").trim();
    return title ? title.slice(0, 80) : null;
  } catch {
    return null;
  }
}

export type YouTubePlayerHandle = {
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (sec: number) => void;
  setVolume: (n: number) => void;
  setMuted: (muted: boolean) => void;
};

type YtPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  seekTo: (sec: number, allowSeekAhead: boolean) => void;
  setVolume: (n: number) => void;
  mute: () => void;
  unMute: () => void;
  destroy: () => void;
};

type YtNamespace = {
  Player: new (
    el: HTMLElement | string,
    opts: Record<string, unknown>,
  ) => YtPlayer;
  PlayerState: { ENDED: number; PLAYING: number };
};

declare global {
  interface Window {
    YT?: YtNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<YtNamespace> | null = null;

export function loadYouTubeIframeApi(): Promise<YtNamespace> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("YouTube no disponible"));
  }
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (youtubeApiPromise) return youtubeApiPromise;
  youtubeApiPromise = new Promise((resolve, reject) => {
    const done = () => {
      if (window.YT?.Player) resolve(window.YT);
      else reject(new Error("YouTube no inicializó"));
    };
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      try {
        prev?.();
      } catch {
        /* ignore */
      }
      done();
    };
    if (
      !document.querySelector(
        'script[src="https://www.youtube.com/iframe_api"]',
      )
    ) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      tag.async = true;
      tag.onerror = () =>
        reject(new Error("No se pudo cargar el reproductor de YouTube"));
      document.head.appendChild(tag);
    }
    const poll = window.setInterval(() => {
      if (window.YT?.Player) {
        window.clearInterval(poll);
        done();
      }
    }, 80);
    window.setTimeout(() => {
      window.clearInterval(poll);
      if (!window.YT?.Player) {
        reject(new Error("YouTube tardó demasiado en cargar"));
      }
    }, 15000);
  });
  return youtubeApiPromise;
}

export function bindYouTubePlayerHandle(player: YtPlayer): YouTubePlayerHandle {
  return {
    play: () => player.playVideo(),
    pause: () => player.pauseVideo(),
    stop: () => player.stopVideo(),
    seek: (sec) => player.seekTo(Math.max(0, sec), true),
    setVolume: (n) => player.setVolume(Math.max(0, Math.min(100, n))),
    setMuted: (muted) => {
      if (muted) player.mute();
      else player.unMute();
    },
  };
}

export function createYouTubePlayer(
  el: HTMLElement,
  videoId: string,
  opts: {
    volume: number;
    muted: boolean;
    autoplay: boolean;
    origin: string;
    onReady?: (player: YtPlayer) => void;
    onError?: () => void;
  },
): Promise<YtPlayer> {
  return loadYouTubeIframeApi().then((YT) => {
    return new Promise<YtPlayer>((resolve) => {
      const player = new YT.Player(el, {
        host: "https://www.youtube-nocookie.com",
        videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: opts.autoplay ? 1 : 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          loop: 1,
          playlist: videoId,
          origin: opts.origin,
          mute: opts.muted || opts.autoplay ? 1 : 0,
        },
        events: {
          onReady: () => {
            player.setVolume(opts.volume);
            if (opts.muted) player.mute();
            else if (!opts.autoplay) player.unMute();
            if (opts.autoplay) player.playVideo();
            opts.onReady?.(player);
            resolve(player);
          },
          onStateChange: (ev: { data: number }) => {
            if (ev.data === YT.PlayerState.ENDED) {
              player.seekTo(0, true);
              player.playVideo();
            }
            if (ev.data === YT.PlayerState.PLAYING && !opts.muted) {
              player.unMute();
              player.setVolume(opts.volume);
            }
          },
          onError: () => {
            opts.onError?.();
          },
        },
      });
    });
  });
}
