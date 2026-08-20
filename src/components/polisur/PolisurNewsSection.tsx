import { PolisurMedia } from "@/components/polisur/PolisurMedia";
import {
  publishedPolisurNews,
  type PolisurNewsItem,
} from "@/content/polisur-site";
import { usePolisurSite } from "@/providers/polisur/PolisurSiteProvider";

function NewsCard({ item }: { item: PolisurNewsItem }) {
  const dateLabel = (() => {
    const d = new Date(item.publishedAt);
    return Number.isNaN(d.getTime())
      ? item.publishedAt
      : d.toLocaleDateString("es-VE", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        });
  })();

  return (
    <article className="border-t border-[var(--ps-line)] pt-6 first:border-t-0 first:pt-0">
      {item.imageUrl ? (
        <div className="mb-4 aspect-[16/9] overflow-hidden">
          <PolisurMedia
            src={item.imageUrl}
            alt=""
            className="h-full w-full object-cover"
            overlay="none"
          />
        </div>
      ) : null}
      <p className="ps-eyebrow">{dateLabel}</p>
      <h3 className="mt-2 text-xl text-[var(--ps-white)]">{item.title}</h3>
      {item.summary ? (
        <p className="mt-3 text-sm leading-relaxed text-[var(--ps-steel-300)]">
          {item.summary}
        </p>
      ) : null}
      {item.body ? (
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[var(--ps-steel-300)]">
          {item.body}
        </p>
      ) : null}
    </article>
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
        <p className="ps-eyebrow">Comunicados</p>
        <h2
          id="polisur-noticias-title"
          className="mt-3 max-w-xl text-3xl text-[var(--ps-white)] sm:text-4xl"
        >
          Noticias institucionales
        </h2>
        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          {items.slice(0, 6).map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
