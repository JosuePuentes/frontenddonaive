import { youtubeEmbedUrl } from "@/services/ad-licoreria/tv/youtube";

type Props = {
  videoId: string;
  playing: boolean;
  volume: number;
  muted: boolean;
};

/**
 * YouTube en la TV: iframe de embed.
 * Nunca usar <video src="https://youtube.com/watch?..."> — el TV lo muestra como dañado.
 */
export default function AdTvYouTubeStage({
  videoId,
  playing,
  muted,
}: Props) {
  const origin =
    typeof window !== "undefined" ? window.location.origin : undefined;
  const src = youtubeEmbedUrl(videoId, {
    autoplay: playing,
    muted,
    origin,
  });

  return (
    <div className="relative h-full w-full bg-black">
      <iframe
        title="YouTube"
        src={src}
        className="absolute inset-0 h-full w-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
