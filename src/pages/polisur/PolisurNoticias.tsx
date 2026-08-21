import { useMemo, useState } from "react";
import { Link } from "react-router";
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((item) => {
      if (q && !item.title.toLowerCase().includes(q) && !item.summary.toLowerCase().includes(q)) {
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
            Información oficial de la institución. Filtre por nombre o fecha.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <input
              className="ps-input"
              placeholder="Buscar por título…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <label className="block">
              <span className="sr-only">Desde</span>
              <input
                type="date"
                className="ps-input"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="sr-only">Hasta</span>
              <input
                type="date"
                className="ps-input"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </label>
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
