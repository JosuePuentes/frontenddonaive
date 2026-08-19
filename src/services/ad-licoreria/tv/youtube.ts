/** URLs de YouTube para Contenido TV (watch, youtu.be, Shorts, embed). */

const YT_ID = /^[A-Za-z0-9_-]{11}$/;
const YT_ID_IN_TEXT =
  /(?:v=|\/embed\/|\/shorts\/|\/live\/|\/e\/|youtu\.be\/)([A-Za-z0-9_-]{11})/i;

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

/** Limpia lo que pegan desde WhatsApp, sin https, o con texto alrededor. */
export function normalizeYouTubeInput(raw: string): string {
  let s = String(raw || "")
    .trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/^[\s'"<([¡!]+/, "")
    .replace(/[>'")\]]+$/, "");
  const fromText =
    s.match(/https?:\/\/[^\s<>"']+/i) ||
    s.match(/(?:www\.)?(?:youtu\.be\/|youtube\.com\/)[^\s<>"']+/i);
  if (fromText) s = fromText[0];
  s = s.replace(/[.,;]+$/, "");
  if (s && !/^https?:\/\//i.test(s) && /youtu/i.test(s)) {
    s = `https://${s.replace(/^\/+/, "")}`;
  }
  return s;
}

export function looksLikeYouTube(raw: string): boolean {
  return /youtu\.be|youtube\.com|youtube-nocookie\.com/i.test(String(raw || ""));
}

export function parseYouTubeVideoId(raw: string): string | null {
  const trimmed = normalizeYouTubeInput(raw);
  if (!trimmed) return null;
  if (YT_ID.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    if (isYouTubeHost(url.hostname)) {
      const host = url.hostname.replace(/^www\./, "").toLowerCase();
      if (host === "youtu.be") {
        const id = validYouTubeId(url.pathname.split("/").filter(Boolean)[0]);
        if (id) return id;
      }
      const fromQuery = validYouTubeId(url.searchParams.get("v"));
      if (fromQuery) return fromQuery;
      const parts = url.pathname.split("/").filter(Boolean);
      const markers = new Set(["embed", "shorts", "live", "v", "e"]);
      const idx = parts.findIndex((p) => markers.has(p.toLowerCase()));
      if (idx >= 0) {
        const id = validYouTubeId(parts[idx + 1]);
        if (id) return id;
      }
    }
  } catch {
    /* seguir con regex */
  }
  const match = trimmed.match(YT_ID_IN_TEXT);
  return validYouTubeId(match?.[1] ?? null);
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

/** Embed que las TVs pueden reproducir (no usar <video src=watch>). */
export function youtubeEmbedUrl(
  videoId: string,
  opts?: { autoplay?: boolean; muted?: boolean; origin?: string },
): string {
  const params = new URLSearchParams({
    autoplay: opts?.autoplay === false ? "0" : "1",
    mute: opts?.muted ? "1" : "0",
    controls: "1",
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    loop: "1",
    playlist: videoId,
    fs: "1",
    iv_load_policy: "3",
    enablejsapi: "1",
  });
  if (opts?.origin) params.set("origin", opts.origin);
  return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?${params.toString()}`;
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
