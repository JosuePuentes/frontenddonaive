import { Link } from "react-router";
import { PolisurMedia } from "@/components/polisur/PolisurMedia";
import {
  adPolisurNoticiaPath,
  POLISUR_ROUTES,
} from "@/constants/polisur-routes";
import {
  newsCoverUrl,
  publishedPolisurNews,
  type PolisurNewsItem,
} from "@/content/polisur-site";
import { usePolisurSite } from "@/providers/polisur/PolisurSiteProvider";

function formatNewsDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function NewsCard({ item }: { item: PolisurNewsItem }) {
  const cover = newsCoverUrl(item);
  return (
    <Link
      to={adPolisurNoticiaPath(item.id)}
      className="ps-news-hero group min-h-[17rem]"
    >
      <PolisurMedia
        src={cover || "/polisur/home/hero.jpg"}
        alt={item.title}
        className="ps-news-hero__media"
        overlay="strong"
      />
      <div className="ps-news-hero__body">
        <p className="ps-eyebrow text-[var(--ps-mint)]">
          {formatNewsDate(item.publishedAt)}
        </p>
        <h3 className="mt-2 text-xl leading-tight text-[var(--ps-white)] group-hover:text-[var(--ps-mint)]">
          {item.title}
        </h3>
      </div>
    </Link>
  );
}

export function PolisurNewsSection() {
  const { site } = usePolisurSite();
  const items = publishedPolisurNews(site);
  if (items.length === 0) return null;

  return (
    <section
      id="noticias"
      className="border-t border-[var(--ps-line)] bg-[var(--ps-navy-900)]"
      aria-labelledby="polisur-noticias-title"
    >
      <div className="ps-container py-16 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="ps-eyebrow">Comunicados</p>
            <h2
              id="polisur-noticias-title"
              className="mt-3 max-w-xl text-3xl text-[var(--ps-white)] sm:text-4xl"
            >
              Noticias institucionales
            </h2>
          </div>
          <Link
            to={POLISUR_ROUTES.noticias}
            className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ps-mint)] underline-offset-4 hover:underline"
          >
            Ver todas
          </Link>
        </div>
        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          {items.slice(0, 4).map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
