import { useEffect, useMemo, useState } from "react";
import type { PolisurClickStats } from "@/lib/polisur-track";
import { usePolisurSite } from "@/providers/polisur/PolisurSiteProvider";

const SOCIAL_LABELS: { key: string; label: string }[] = [
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "twitter", label: "X / Twitter" },
  { key: "youtube", label: "YouTube" },
  { key: "tiktok", label: "TikTok" },
  { key: "whatsapp", label: "WhatsApp" },
];

const EMPTY: PolisurClickStats = {
  updatedAt: "",
  news: {},
  social: {
    facebook: 0,
    instagram: 0,
    twitter: 0,
    youtube: 0,
    tiktok: 0,
    whatsapp: 0,
  },
  phone: { primary: 0, alt: 0 },
};

type Props = {
  clave: string;
};

function PolisurClicksAdmin({ clave }: Props) {
  const { site } = usePolisurSite();
  const [stats, setStats] = useState<PolisurClickStats>(EMPTY);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/polisur-clicks?action=stats&clave=${encodeURIComponent(clave)}`,
        );
        const text = await res.text();
        let data: { ok?: boolean; stats?: PolisurClickStats; error?: string } =
          {};
        try {
          data = JSON.parse(text) as typeof data;
        } catch {
          throw new Error("No se pudo leer el contador de clics.");
        }
        if (!res.ok || !data.ok || !data.stats) {
          throw new Error(data.error || "No se pudieron cargar los clics.");
        }
        if (!cancelled) setStats(data.stats);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Error al cargar contadores.",
          );
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [clave]);

  const newsRows = useMemo(() => {
    const titles = new Map(site.news.map((n) => [n.id, n.title]));
    return Object.entries(stats.news)
      .map(([id, clicks]) => ({
        id,
        title: titles.get(id) || id,
        clicks,
      }))
      .sort((a, b) => b.clicks - a.clicks);
  }, [site.news, stats.news]);

  const socialTotal = SOCIAL_LABELS.reduce(
    (sum, { key }) => sum + (stats.social[key] || 0),
    0,
  );
  const phoneTotal = (stats.phone.primary || 0) + (stats.phone.alt || 0);
  const newsTotal = newsRows.reduce((sum, row) => sum + row.clicks, 0);

  if (busy) {
    return (
      <p className="text-sm text-[var(--ps-steel-400)]">Cargando contadores…</p>
    );
  }

  if (error) {
    return <p className="text-sm text-red-300/90">{error}</p>;
  }

  return (
    <div className="space-y-10">
      <p className="text-sm text-[var(--ps-steel-400)]">
        Contabilidad de clics en noticias, redes sociales y números de
        teléfono del portal.
        {stats.updatedAt ? (
          <>
            {" "}
            Última actualización:{" "}
            {new Date(stats.updatedAt).toLocaleString("es-VE")}
          </>
        ) : null}
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="border border-[var(--ps-line)] p-4">
          <p className="ps-eyebrow">Noticias</p>
          <p className="mt-2 text-3xl text-[var(--ps-white)]">{newsTotal}</p>
        </div>
        <div className="border border-[var(--ps-line)] p-4">
          <p className="ps-eyebrow">Redes</p>
          <p className="mt-2 text-3xl text-[var(--ps-white)]">{socialTotal}</p>
        </div>
        <div className="border border-[var(--ps-line)] p-4">
          <p className="ps-eyebrow">Teléfonos</p>
          <p className="mt-2 text-3xl text-[var(--ps-white)]">{phoneTotal}</p>
        </div>
      </div>

      <section>
        <h3 className="text-lg text-[var(--ps-white)]">Por noticia</h3>
        {newsRows.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--ps-steel-400)]">
            Aún no hay clics registrados en noticias.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--ps-line)] border border-[var(--ps-line)]">
            {newsRows.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
              >
                <span className="min-w-0 truncate text-[var(--ps-paper)]">
                  {row.title}
                </span>
                <span className="shrink-0 tabular-nums text-[var(--ps-mint)]">
                  {row.clicks}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-8 sm:grid-cols-2">
        <div>
          <h3 className="text-lg text-[var(--ps-white)]">Redes sociales</h3>
          <ul className="mt-4 divide-y divide-[var(--ps-line)] border border-[var(--ps-line)]">
            {SOCIAL_LABELS.map(({ key, label }) => (
              <li
                key={key}
                className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
              >
                <span className="text-[var(--ps-paper)]">{label}</span>
                <span className="tabular-nums text-[var(--ps-mint)]">
                  {stats.social[key] || 0}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-lg text-[var(--ps-white)]">Teléfonos</h3>
          <ul className="mt-4 divide-y divide-[var(--ps-line)] border border-[var(--ps-line)]">
            <li className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
              <span className="text-[var(--ps-paper)]">
                Principal
                {site.contact.phone ? ` (${site.contact.phone})` : ""}
              </span>
              <span className="tabular-nums text-[var(--ps-mint)]">
                {stats.phone.primary || 0}
              </span>
            </li>
            <li className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
              <span className="text-[var(--ps-paper)]">
                Alterno
                {site.contact.phoneAlt ? ` (${site.contact.phoneAlt})` : ""}
              </span>
              <span className="tabular-nums text-[var(--ps-mint)]">
                {stats.phone.alt || 0}
              </span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}

export { PolisurClicksAdmin };
