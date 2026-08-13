import { Link } from "react-router";
import { PolisurMedia } from "@/components/polisur/PolisurMedia";
import { polisurCopy, polisurDivisionItems } from "@/content/polisur";

function PolisurDivisions() {
  return (
    <section
      className="border-b border-[var(--ps-line)] bg-[var(--ps-navy-950)]"
      aria-labelledby="polisur-divisions-title"
    >
      <div className="ps-container py-12 sm:py-16">
        <div className="max-w-2xl">
          <p className="ps-eyebrow">{polisurCopy.divisions.eyebrow}</p>
          <h2
            id="polisur-divisions-title"
            className="mt-3 text-3xl text-[var(--ps-white)] sm:text-4xl"
          >
            {polisurCopy.divisions.title}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-[var(--ps-steel-400)] sm:text-base">
            {polisurCopy.divisions.body}
          </p>
        </div>
      </div>

      <div className="ps-division-mosaic">
        {polisurDivisionItems.map((item) => (
          <article key={item.key} className="ps-division-block">
            <PolisurMedia
              src={item.image}
              alt={item.name}
              className="ps-division-block__media"
              objectPosition={item.imagePosition}
              overlay="strong"
            />
            <div className="ps-division-block__body">
              {item.featured ? (
                <p className="ps-eyebrow text-[var(--ps-gold)]">Destacada</p>
              ) : null}
              <h3 className="mt-2 text-2xl text-[var(--ps-white)] sm:text-3xl">
                {item.name}
              </h3>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--ps-paper)]/88">
                {item.summary}
              </p>
              <Link
                to={item.to}
                className="mt-5 inline-flex text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ps-white)] underline-offset-4 hover:underline"
              >
                Acceder
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export { PolisurDivisions };
