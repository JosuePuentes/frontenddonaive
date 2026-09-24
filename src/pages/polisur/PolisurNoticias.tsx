import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ChevronLeft, ChevronRight, Filter, Search, X } from "lucide-react";
import { PageMeta } from "@/components/page/PageMeta";
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

const LIST_PAGE_SIZE = 6;

type DateFilterMode = "all" | "today" | "range";

function formatNewsDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function isSameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function NewsHeroCard({ item }: { item: PolisurNewsItem }) {
  const cover = newsCoverUrl(item);
  const href = adPolisurNoticiaPath(item.id);
  return (
    <Link to={href} className="ps-news-hero group min-h-[20rem] sm:min-h-[22rem]">
      <PolisurMedia
        src={cover || "/polisur/home/hero.jpg"}
        alt={item.title}
        className="ps-news-hero__media"
        overlay="strong"
        objectPosition="center"
      />
      <div className="ps-news-hero__body">
        <p className="ps-eyebrow text-[var(--ps-mint)]">
          {formatNewsDate(item.publishedAt)}
        </p>
        <h2 className="mt-2 max-w-xl text-2xl leading-tight text-[var(--ps-white)] transition-colors group-hover:text-[var(--ps-mint)] sm:text-3xl">
          {item.title}
        </h2>
        {item.summary ? (
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-[var(--ps-paper)]/90 line-clamp-2">
            {item.summary}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

export default function PolisurNoticias() {
  const { site } = usePolisurSite();
  const all = publishedPolisurNews(site);
  const [query, setQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [dateMode, setDateMode] = useState<DateFilterMode>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [listPage, setListPage] = useState(1);

  const hasRangeFilter = dateMode === "range" && Boolean(fromDate || toDate);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const today = new Date();
    return all.filter((item) => {
      if (
        q &&
        !item.title.toLowerCase().includes(q) &&
        !item.summary.toLowerCase().includes(q)
      ) {
        return false;
      }
      const published = new Date(item.publishedAt);
      if (dateMode === "today") {
        if (Number.isNaN(published.getTime())) return false;
        if (!isSameLocalDay(published, today)) return false;
      }
      if (dateMode === "range") {
        const t = published.getTime();
        if (fromDate) {
          const from = new Date(`${fromDate}T00:00:00`).getTime();
          if (!Number.isNaN(from) && t < from) return false;
        }
        if (toDate) {
          const to = new Date(`${toDate}T23:59:59`).getTime();
          if (!Number.isNaN(to) && t > to) return false;
        }
      }
      return true;
    });
  }, [all, query, fromDate, toDate, dateMode]);

  const totalListPages = Math.max(1, Math.ceil(filtered.length / LIST_PAGE_SIZE));
  const safeListPage = Math.min(listPage, totalListPages);
  const pageStart = (safeListPage - 1) * LIST_PAGE_SIZE;
  const paged = filtered.slice(pageStart, pageStart + LIST_PAGE_SIZE);

  useEffect(() => {
    setListPage(1);
  }, [query, fromDate, toDate, dateMode]);

  function clearDates() {
    setFromDate("");
    setToDate("");
    setDateMode("all");
  }

  function selectToday() {
    setDateMode("today");
    setFromDate("");
    setToDate("");
    setFilterOpen(false);
  }

  function selectAllDates() {
    setDateMode("all");
    setFromDate("");
    setToDate("");
    setFilterOpen(false);
  }

  function openRangeFilter() {
    setDateMode("range");
    setFilterOpen(true);
  }

  return (
    <>
      <PageMeta
        title="Noticias — POLISUR"
        description="Comunicados y noticias institucionales de POLISUR."
      />
      <section className="border-b border-[var(--ps-line)] bg-[var(--ps-navy-950)]">
        <div className="ps-container py-14 sm:py-20">
          <p className="ps-eyebrow">Comunicados</p>
          <h1 className="mt-3 text-4xl text-[var(--ps-white)] sm:text-5xl">
            Noticias
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--ps-steel-300)]">
            Información oficial de la institución. Busque por título o filtre
            por hoy, por fecha o navegue por páginas.
          </p>

          <div className="relative mt-8 max-w-2xl">
            <div className="flex gap-2">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Buscar noticias</span>
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ps-steel-400)]"
                  aria-hidden
                />
                <input
                  className="ps-input w-full !pl-10"
                  placeholder="Buscar por título…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <button
                type="button"
                onClick={() => setFilterOpen((v) => !v)}
                className={[
                  "inline-flex shrink-0 items-center gap-2 border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em]",
                  filterOpen || dateMode !== "all"
                    ? "border-[var(--ps-mint)]/70 text-[var(--ps-mint)]"
                    : "border-[var(--ps-line-strong)] text-[var(--ps-paper)]",
                ].join(" ")}
                aria-expanded={filterOpen}
                aria-controls="noticias-filtro-fecha"
              >
                <Filter size={14} aria-hidden />
                Filtrar
                {dateMode !== "all" ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--ps-mint)]" />
                ) : null}
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={selectToday}
                className={[
                  "border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em]",
                  dateMode === "today"
                    ? "border-[var(--ps-mint)] bg-[var(--ps-mint-muted)] text-[var(--ps-mint)]"
                    : "border-[var(--ps-line-strong)] text-[var(--ps-paper)] hover:border-[var(--ps-mint)]/50",
                ].join(" ")}
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={selectAllDates}
                className={[
                  "border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em]",
                  dateMode === "all"
                    ? "border-[var(--ps-mint)] bg-[var(--ps-mint-muted)] text-[var(--ps-mint)]"
                    : "border-[var(--ps-line-strong)] text-[var(--ps-paper)] hover:border-[var(--ps-mint)]/50",
                ].join(" ")}
              >
                Todas
              </button>
              <button
                type="button"
                onClick={openRangeFilter}
                className={[
                  "border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em]",
                  dateMode === "range"
                    ? "border-[var(--ps-mint)] bg-[var(--ps-mint-muted)] text-[var(--ps-mint)]"
                    : "border-[var(--ps-line-strong)] text-[var(--ps-paper)] hover:border-[var(--ps-mint)]/50",
                ].join(" ")}
              >
                Por fecha
              </button>
            </div>

            {filterOpen ? (
              <div
                id="noticias-filtro-fecha"
                className="absolute left-0 right-0 z-20 mt-2 border border-[var(--ps-line)] bg-[var(--ps-navy-900)] p-4 shadow-lg"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-[var(--ps-steel-400)]">
                    Rango de fechas
                  </p>
                  <button
                    type="button"
                    onClick={() => setFilterOpen(false)}
                    className="text-[var(--ps-steel-400)] hover:text-[var(--ps-paper)]"
                    aria-label="Cerrar filtro"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-[0.65rem] uppercase tracking-[0.14em] text-[var(--ps-steel-400)]">
                      Desde
                    </span>
                    <input
                      type="date"
                      className="ps-input mt-1.5 w-full"
                      value={fromDate}
                      onChange={(e) => {
                        setDateMode("range");
                        setFromDate(e.target.value);
                      }}
                    />
                  </label>
                  <label className="block">
                    <span className="text-[0.65rem] uppercase tracking-[0.14em] text-[var(--ps-steel-400)]">
                      Hasta
                    </span>
                    <input
                      type="date"
                      className="ps-input mt-1.5 w-full"
                      value={toDate}
                      onChange={(e) => {
                        setDateMode("range");
                        setToDate(e.target.value);
                      }}
                    />
                  </label>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={clearDates}
                    className="text-xs uppercase tracking-[0.12em] text-[var(--ps-steel-400)] underline-offset-4 hover:text-[var(--ps-paper)] hover:underline"
                  >
                    Limpiar fechas
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterOpen(false)}
                    className="border-b border-[var(--ps-mint)]/70 pb-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ps-paper)]"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {hasRangeFilter ? (
            <p className="mt-4 text-xs text-[var(--ps-steel-400)]">
              Mostrando noticias entre{" "}
              {fromDate || "…"} y {toDate || "…"}
            </p>
          ) : null}
        </div>
      </section>

      <section className="bg-[var(--ps-navy-900)]">
        <div className="ps-container py-10 sm:py-14">
          {filtered.length === 0 ? (
            <p className="text-sm text-[var(--ps-steel-400)]">
              No hay noticias con esos filtros.{" "}
              <Link to={POLISUR_ROUTES.home} className="underline">
                Volver al inicio
              </Link>
            </p>
          ) : (
            <>
              <div className="grid gap-4 lg:grid-cols-2">
                {paged.map((item) => (
                  <NewsHeroCard key={item.id} item={item} />
                ))}
              </div>

              {totalListPages > 1 ? (
                <nav
                  className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--ps-line)] pt-8"
                  aria-label="Paginación de noticias"
                >
                  <p className="text-xs uppercase tracking-[0.14em] text-[var(--ps-steel-400)]">
                    Página {safeListPage} de {totalListPages}
                    <span className="mx-2 text-[var(--ps-line-strong)]">·</span>
                    {filtered.length} noticia{filtered.length === 1 ? "" : "s"}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={safeListPage <= 1}
                      onClick={() => setListPage((p) => Math.max(1, p - 1))}
                      className="ps-news-carousel-btn disabled:opacity-40 disabled:pointer-events-none"
                      aria-label="Página anterior"
                    >
                      <ChevronLeft size={20} aria-hidden />
                    </button>
                    <button
                      type="button"
                      disabled={safeListPage >= totalListPages}
                      onClick={() =>
                        setListPage((p) => Math.min(totalListPages, p + 1))
                      }
                      className="ps-news-carousel-btn disabled:opacity-40 disabled:pointer-events-none"
                      aria-label="Página siguiente"
                    >
                      <ChevronRight size={20} aria-hidden />
                    </button>
                  </div>
                </nav>
              ) : null}
            </>
          )}
        </div>
      </section>
    </>
  );
}
