import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Filter, Search, X } from "lucide-react";
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

function formatNewsDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function NewsHeroCard({ item }: { item: PolisurNewsItem }) {
  const cover = newsCoverUrl(item);
  return (
    <Link
      to={adPolisurNoticiaPath(item.id)}
      className="group relative block min-h-[16rem] overflow-hidden sm:min-h-[18rem]"
    >
      <PolisurMedia
        src={cover || "/polisur/home/hero.jpg"}
        alt=""
        className="absolute inset-0 h-full w-full"
        overlay="readable"
        objectPosition="center"
      />
      <div className="relative z-[1] flex h-full min-h-[16rem] flex-col justify-end p-5 sm:min-h-[18rem] sm:p-7">
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
  const [filterOpen, setFilterOpen] = useState(false);

  const hasDateFilter = Boolean(fromDate || toDate);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((item) => {
      if (
        q &&
        !item.title.toLowerCase().includes(q) &&
        !item.summary.toLowerCase().includes(q)
      ) {
        return false;
      }
      const t = new Date(item.publishedAt).getTime();
      if (fromDate) {
        const from = new Date(`${fromDate}T00:00:00`).getTime();
        if (!Number.isNaN(from) && t < from) return false;
      }
      if (toDate) {
        const to = new Date(`${toDate}T23:59:59`).getTime();
        if (!Number.isNaN(to) && t > to) return false;
      }
      return true;
    });
  }, [all, query, fromDate, toDate]);

  function clearDates() {
    setFromDate("");
    setToDate("");
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
            por fecha.
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
                  filterOpen || hasDateFilter
                    ? "border-[var(--ps-mint)]/70 text-[var(--ps-mint)]"
                    : "border-[var(--ps-line-strong)] text-[var(--ps-paper)]",
                ].join(" ")}
                aria-expanded={filterOpen}
                aria-controls="noticias-filtro-fecha"
              >
                <Filter size={14} aria-hidden />
                Filtrar
                {hasDateFilter ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--ps-mint)]" />
                ) : null}
              </button>
            </div>

            {filterOpen ? (
              <div
                id="noticias-filtro-fecha"
                className="absolute left-0 right-0 z-20 mt-2 border border-[var(--ps-line)] bg-[var(--ps-navy-900)] p-4 shadow-lg"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-[var(--ps-steel-400)]">
                    Filtrar por fecha
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
                      onChange={(e) => setFromDate(e.target.value)}
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
                      onChange={(e) => setToDate(e.target.value)}
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
            <div className="grid gap-4 lg:grid-cols-2">
              {filtered.map((item) => (
                <NewsHeroCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
