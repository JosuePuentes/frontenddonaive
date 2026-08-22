import type { AdTvCommand, AdTvContent } from "@/types/ad-tv";

/** Segundos desde el PLAY compartido (todas las TVs usan el mismo issuedAt). */
export function playheadElapsedSec(
  command: AdTvCommand | null | undefined,
  screenId: string | undefined,
  nowMs = Date.now(),
): number {
  if (!command || command.command !== "PLAY" || !screenId) return 0;
  if (!command.screenIds.includes(screenId)) return 0;
  const issued = Date.parse(command.issuedAt);
  const base = command.position ?? 0;
  if (!Number.isFinite(issued)) return Math.max(0, base);
  return Math.max(0, base + (nowMs - issued) / 1000);
}

export function playlistCursor(
  playlist: AdTvContent[],
  elapsedSec: number,
): { slide: number; offsetSec: number } {
  if (playlist.length <= 1) {
    return { slide: 0, offsetSec: Math.max(0, elapsedSec) };
  }
  const durs = playlist.map((c) => Math.max(4, c.durationSec || 12));
  const cycle = durs.reduce((a, b) => a + b, 0) || 1;
  let t = elapsedSec % cycle;
  if (t < 0) t = 0;
  for (let i = 0; i < durs.length; i++) {
    if (t < durs[i]) return { slide: i, offsetSec: t };
    t -= durs[i];
  }
  return { slide: 0, offsetSec: 0 };
}

export const TV_SOUND_UNLOCK_KEY = "ad-tv-sound-unlocked";

export function isTvSoundUnlocked(): boolean {
  try {
    return sessionStorage.getItem(TV_SOUND_UNLOCK_KEY) === "1";
  } catch {
    return false;
  }
}

export function markTvSoundUnlocked() {
  try {
    sessionStorage.setItem(TV_SOUND_UNLOCK_KEY, "1");
  } catch {
    /* ignore */
  }
}
