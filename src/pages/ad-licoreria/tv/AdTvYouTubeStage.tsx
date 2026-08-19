import { useMemo } from "react";
import { youtubeEmbedUrl } from "@/services/ad-licoreria/tv/youtube";

type Props = {
  videoId: string;
  playing: boolean;
  /** Cambia al avanzar carrusel para forzar recarga del iframe en la TV. */
  stageKey?: string;
};

/**
 * YouTube en la TV: iframe de embed (mute+autoplay, controles para el control remoto).
 * Nunca usar <video src="https://youtube.com/watch?...">.
 */
export default function AdTvYouTubeStage({
  videoId,
  playing,
  stageKey = "0",
}: Props) {
  const src = useMemo(
    () =>
      youtubeEmbedUrl(videoId, {
        autoplay: playing,
        muted: true,
        nocookie: true,
      }),
    [videoId, playing],
  );

  return (
    <div className="relative h-full w-full bg-black">
      <iframe
        key={`${videoId}-${stageKey}-${playing ? "play" : "idle"}`}
        title="YouTube"
        src={src}
        className="absolute inset-0 h-full w-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        allowFullScreen
      />
      {playing ? (
        <p className="pointer-events-none absolute bottom-4 left-0 right-0 text-center text-xs text-white/40">
          YouTube · si no inicia solo, pulse ▶ en el control del televisor
        </p>
      ) : null}
    </div>
  );
}
