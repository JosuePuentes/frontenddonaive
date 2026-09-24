import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

const HOME_NEWS_PAGE_SIZE = 4;

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
  const [page, setPage] = useState(0);

  if (items.length === 0) return null;

  const totalPages = Math.ceil(items.length / HOME_NEWS_PAGE_SIZE);
  const safePage = Math.min(page, Math.max(0, totalPages - 1));
  const start = safePage * HOME_NEWS_PAGE_SIZE;
  const visible = items.slice(start, start + HOME_NEWS_PAGE_SIZE);
  const showCarousel = totalPages > 1;

  function goPrev() {
    setPage((p) => (p <= 0 ? totalPages - 1 : p - 1));
  }

  function goNext() {
    setPage((p) => (p >= totalPages - 1 ? 0 : p + 1));
  }

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

        <div className="relative mt-10">
          {showCarousel ? (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--ps-steel-400)]">
                Página {safePage + 1} de {totalPages}
                <span className="mx-2 text-[var(--ps-line-strong)]">·</span>
                Hasta {HOME_NEWS_PAGE_SIZE} noticias visibles
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={goPrev}
                  className="ps-news-carousel-btn"
                  aria-label="Noticias anteriores"
                >
                  <ChevronLeft size={20} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="ps-news-carousel-btn"
                  aria-label="Noticias siguientes"
                >
                  <ChevronRight size={20} aria-hidden />
                </button>
              </div>
            </div>
          ) : null}

          <div
            className="grid gap-4 sm:grid-cols-2"
            aria-live="polite"
            aria-atomic="true"
          >
            {visible.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>

          {showCarousel ? (
            <div
              className="mt-6 flex justify-center gap-2"
              role="tablist"
              aria-label="Páginas de noticias en inicio"
            >
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === safePage}
                  aria-label={`Ir a página ${i + 1}`}
                  onClick={() => setPage(i)}
                  className={[
                    "h-2.5 w-2.5 rounded-full transition-colors",
                    i === safePage
                      ? "bg-[var(--ps-mint)]"
                      : "bg-[var(--ps-line-strong)] hover:bg-[var(--ps-steel-400)]",
                  ].join(" ")}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
