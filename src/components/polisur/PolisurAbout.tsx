import { PolisurMedia } from "@/components/polisur/PolisurMedia";
import { usePolisurSite } from "@/providers/polisur/PolisurSiteProvider";

function PolisurAbout() {
  const { site } = usePolisurSite();
  const { about, leadership, mission, vision, values, functions } = site.home;

  return (
    <section
      id="institucion"
      className="scroll-mt-28 border-b border-[var(--ps-line)] bg-[var(--ps-navy-800)]"
      aria-labelledby="polisur-about-title"
    >
      <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
        <PolisurMedia
          src={about.imageUrl}
          alt="Personal institucional de POLISUR"
          className="min-h-[18rem] sm:min-h-[24rem] lg:min-h-[32rem]"
          objectPosition="center 35%"
          overlay="soft"
        />

        <div className="ps-surface-mint flex items-center px-5 py-14 sm:px-10 sm:py-16 lg:px-14">
          <div className="max-w-lg">
            <p className="ps-eyebrow">{about.eyebrow}</p>
            <h2
              id="polisur-about-title"
              className="mt-4 text-3xl leading-tight text-[var(--ps-white)] sm:text-4xl"
            >
              {about.title}
            </h2>
            <hr className="ps-gold-rule mt-6" />
            <p className="mt-6 whitespace-pre-line text-[0.95rem] leading-relaxed text-[var(--ps-steel-300)] sm:text-base">
              {about.body}
            </p>
            <p className="mt-4 whitespace-pre-line text-[0.95rem] leading-relaxed text-[var(--ps-steel-300)] sm:text-base">
              {about.history}
            </p>

            <aside className="mt-8 border-l-2 border-[var(--ps-yellow)] pl-4">
              <p className="ps-eyebrow text-[var(--ps-mint)]">
                {leadership.eyebrow}
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--ps-white)] sm:text-xl">
                {leadership.rank} {leadership.name}
              </p>
              <p className="mt-1 text-sm text-[var(--ps-mint)]">
                {leadership.role}
              </p>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[var(--ps-steel-300)]">
                {leadership.note}
              </p>
            </aside>

            <p className="mt-6 text-xs uppercase tracking-[0.14em] text-[var(--ps-mint)]">
              {about.jurisdiction}
            </p>
          </div>
        </div>
      </div>

      <div className="ps-container grid gap-px border-t border-[var(--ps-line)] bg-[var(--ps-line)] py-0 sm:grid-cols-2 lg:grid-cols-3">
        <article className="bg-[var(--ps-navy-900)] px-5 py-10 sm:px-8 sm:py-12">
          <p className="ps-eyebrow">{mission.title}</p>
          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-[var(--ps-steel-300)] sm:text-base">
            {mission.body}
          </p>
        </article>
        <article className="bg-[var(--ps-navy-800)] px-5 py-10 sm:px-8 sm:py-12">
          <p className="ps-eyebrow">{vision.title}</p>
          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-[var(--ps-steel-300)] sm:text-base">
            {vision.body}
          </p>
        </article>
        <article className="bg-[var(--ps-navy-900)] px-5 py-10 sm:px-8 sm:py-12 sm:col-span-2 lg:col-span-1">
          <p className="ps-eyebrow">{values.title}</p>
          <ul className="mt-4 space-y-2.5 text-sm text-[var(--ps-steel-300)]">
            {values.items.map((item) => (
              <li key={item} className="border-l-2 border-[var(--ps-mint)] pl-3">
                {item}
              </li>
            ))}
          </ul>
        </article>
      </div>

      <div className="border-t border-[var(--ps-line)] bg-[var(--ps-navy-800)]">
        <div className="ps-container max-w-3xl py-10 sm:py-12">
          <p className="ps-eyebrow">{functions.title}</p>
          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-[var(--ps-steel-300)] sm:text-base">
            {functions.body}
          </p>
        </div>
      </div>
    </section>
  );
}

export { PolisurAbout };
