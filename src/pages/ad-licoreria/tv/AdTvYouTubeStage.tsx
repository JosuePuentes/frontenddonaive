import { youtubeEmbedUrl } from "@/services/ad-licoreria/tv/youtube";

type Props = {
  videoId: string;
  playing: boolean;
};

/**
 * YouTube en la TV: iframe de embed (mute+autoplay, controles para el control remoto).
 * Nunca usar <video src="https://youtube.com/watch?...">.
 */
export default function AdTvYouTubeStage({ videoId, playing }: Props) {
  const src = youtubeEmbedUrl(videoId, {
    autoplay: playing,
    muted: true,
  });

  return (
    <div className="relative h-full w-full bg-black">
      <iframe
        key={videoId}
        title="YouTube"
        src={src}
        className="absolute inset-0 h-full w-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        allowFullScreen
        referrerPolicy="origin"
      />
    </div>
  );
}
