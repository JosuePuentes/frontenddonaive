import { Link, useParams } from "react-router";
import { PageMeta } from "@/components/page/PageMeta";
import { PolisurMedia } from "@/components/polisur/PolisurMedia";
import { POLISUR_ROUTES } from "@/constants/polisur-routes";
import {
  newsCoverUrl,
  publishedPolisurNews,
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

  return (
    <>
      <PageMeta title={`${item.title} — POLISUR`} description={item.summary} />
      <section className="relative min-h-[42vh] overflow-hidden border-b border-[var(--ps-line)]">
        <PolisurMedia
          src={cover || "/polisur/home/hero.jpg"}
          alt=""
          className="absolute inset-0 h-full w-full"
          overlay="readable"
          priority
        />
        <div className="relative z-[1] ps-container flex min-h-[42vh] flex-col justify-end py-12 sm:py-16">
          <Link
            to={POLISUR_ROUTES.noticias}
            className="ps-eyebrow text-[var(--ps-mint)] hover:underline"
          >
            Noticias
          </Link>
          <p className="mt-4 text-xs uppercase tracking-[0.14em] text-[var(--ps-steel-300)]">
            {formatNewsDate(item.publishedAt)}
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl text-[var(--ps-white)] sm:text-5xl">
            {item.title}
          </h1>
          {item.summary ? (
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--ps-paper)]/92 sm:text-base">
              {item.summary}
            </p>
          ) : null}
        </div>
      </section>

      <section className="bg-[var(--ps-navy-900)]">
        <div className="ps-container max-w-3xl py-12 sm:py-16">
          <div className="whitespace-pre-line text-sm leading-relaxed text-[var(--ps-steel-300)] sm:text-base">
            {item.body || item.summary}
          </div>

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
