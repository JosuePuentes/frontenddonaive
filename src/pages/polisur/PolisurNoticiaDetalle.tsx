import { Link, useParams } from "react-router";
import { useEffect } from "react";
import { PageMeta } from "@/components/page/PageMeta";
import { PolisurMedia } from "@/components/polisur/PolisurMedia";
import { POLISUR_ROUTES } from "@/constants/polisur-routes";
import {
  newsCoverUrl,
  publishedPolisurNews,
} from "@/content/polisur-site";
import { trackPolisurClick } from "@/lib/polisur-track";
import { usePolisurSite } from "@/providers/polisur/PolisurSiteProvider";

function formatNewsDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("es-VE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatNewsTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("es-VE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PolisurNoticiaDetalle() {
  const { noticiaId = "" } = useParams();
  const { site } = usePolisurSite();
  const item = publishedPolisurNews(site).find((n) => n.id === noticiaId);
  const gallery = item
    ? item.imageUrls.length > 0
      ? item.imageUrls
      : item.imageUrl
        ? [item.imageUrl]
        : []
    : [];

  useEffect(() => {
    if (item?.id) trackPolisurClick("news", item.id);
  }, [item?.id]);

  if (!item) {
    return (
      <section className="bg-[var(--ps-navy-900)]">
        <div className="ps-container py-20">
          <p className="text-sm text-[var(--ps-steel-400)]">
            Noticia no encontrada.
          </p>
          <Link
            to={POLISUR_ROUTES.noticias}
            className="mt-4 inline-flex text-sm text-[var(--ps-mint)] underline"
          >
            Volver a noticias
          </Link>
        </div>
      </section>
    );
  }

  const cover = newsCoverUrl(item);
  const timeLabel = formatNewsTime(item.publishedAt);

  return (
    <>
      <PageMeta title={`${item.title} — POLISUR`} description={item.summary} />
      <section className="ps-news-hero ps-news-hero--detail border-b border-[var(--ps-line)]">
        <PolisurMedia
          src={cover || "/polisur/home/hero.jpg"}
          alt=""
          className="ps-news-hero__media"
          overlay="strong"
          priority
        />
        <div className="ps-news-hero__body">
          <div className="ps-container w-full">
            <Link
              to={POLISUR_ROUTES.noticias}
              className="ps-eyebrow text-[var(--ps-mint)] hover:underline"
            >
              Noticias
            </Link>
            <h1 className="mt-4 max-w-3xl text-3xl text-[var(--ps-white)] sm:text-5xl">
              {item.title}
            </h1>
          </div>
        </div>
      </section>

      <section
        className="border-b border-[var(--ps-line)] bg-[var(--ps-navy-950)]"
        aria-label="Fecha de publicación"
      >
        <div className="ps-container py-5">
          <div className="ps-news-meta">
            <span className="ps-news-meta__label">Publicado</span>
            <p className="ps-news-meta__date">{formatNewsDate(item.publishedAt)}</p>
            {timeLabel ? (
              <p className="ps-news-meta__time">{timeLabel}</p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="bg-[var(--ps-navy-900)]">
        <div className="ps-container max-w-3xl py-12 sm:py-16">
          <article className="ps-news-article">
            {item.summary ? (
              <p className="ps-news-article__lead">{item.summary}</p>
            ) : null}
            {item.body ? (
              <div className="ps-news-article__body">{item.body}</div>
            ) : !item.summary ? (
              <div className="ps-news-article__body text-[var(--ps-steel-400)]">
                Sin contenido adicional.
              </div>
            ) : null}
          </article>

          {gallery.length > 1 ? (
            <div className="mt-12 grid gap-4 sm:grid-cols-2">
              {gallery.map((src) => (
                <PolisurMedia
                  key={src}
                  src={src}
                  alt=""
                  className="aspect-[4/3] w-full"
                  overlay="none"
                />
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
