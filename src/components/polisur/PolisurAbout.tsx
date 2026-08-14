import { PolisurMedia } from "@/components/polisur/PolisurMedia";
import { POLISUR_MEDIA, polisurCopy } from "@/content/polisur";

function PolisurAbout() {
  return (
    <section
      id="institucion"
      className="scroll-mt-28 border-b border-[var(--ps-line)] bg-[var(--ps-navy-800)]"
      aria-labelledby="polisur-about-title"
    >
      <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
        <PolisurMedia
          src={POLISUR_MEDIA.home.about}
          alt="Personal institucional de POLISUR"
          className="min-h-[18rem] sm:min-h-[24rem] lg:min-h-[32rem]"
          objectPosition="center 35%"
          overlay="soft"
        />

        <div className="ps-surface-mint flex items-center px-5 py-14 sm:px-10 sm:py-16 lg:px-14">
          <div className="max-w-lg">
            <p className="ps-eyebrow">{polisurCopy.about.eyebrow}</p>
            <h2
              id="polisur-about-title"
              className="mt-4 text-3xl leading-tight text-[var(--ps-white)] sm:text-4xl"
            >
              {polisurCopy.about.title}
            </h2>
            <hr className="ps-gold-rule mt-6" />
            <p className="mt-6 text-[0.95rem] leading-relaxed text-[var(--ps-steel-300)] sm:text-base">
              {polisurCopy.about.body}
            </p>
            <p className="mt-4 text-[0.95rem] leading-relaxed text-[var(--ps-steel-300)] sm:text-base">
              {polisurCopy.about.history}
            </p>
            <p className="mt-6 text-xs uppercase tracking-[0.14em] text-[var(--ps-mint)]">
              {polisurCopy.brand.jurisdiction}
            </p>
          </div>
        </div>
      </div>

      <div className="ps-container grid gap-px border-t border-[var(--ps-line)] bg-[var(--ps-line)] py-0 sm:grid-cols-2 lg:grid-cols-3">
        <article className="bg-[var(--ps-navy-900)] px-5 py-10 sm:px-8 sm:py-12">
          <p className="ps-eyebrow">{polisurCopy.mission.title}</p>
          <p className="mt-4 text-sm leading-relaxed text-[var(--ps-steel-300)] sm:text-base">
            {polisurCopy.mission.body}
          </p>
        </article>
        <article className="bg-[var(--ps-navy-800)] px-5 py-10 sm:px-8 sm:py-12">
          <p className="ps-eyebrow">{polisurCopy.vision.title}</p>
          <p className="mt-4 text-sm leading-relaxed text-[var(--ps-steel-300)] sm:text-base">
            {polisurCopy.vision.body}
          </p>
        </article>
        <article className="bg-[var(--ps-navy-900)] px-5 py-10 sm:px-8 sm:py-12 sm:col-span-2 lg:col-span-1">
          <p className="ps-eyebrow">{polisurCopy.values.title}</p>
          <ul className="mt-4 space-y-2.5 text-sm text-[var(--ps-steel-300)]">
            {polisurCopy.values.items.map((item) => (
              <li key={item} className="border-l-2 border-[var(--ps-mint)] pl-3">
                {item}
              </li>
            ))}
          </ul>
        </article>
      </div>

      <div className="border-t border-[var(--ps-line)] bg-[var(--ps-navy-800)]">
        <div className="ps-container max-w-3xl py-10 sm:py-12">
          <p className="ps-eyebrow">{polisurCopy.functions.title}</p>
          <p className="mt-4 text-sm leading-relaxed text-[var(--ps-steel-300)] sm:text-base">
            {polisurCopy.functions.body}
          </p>
        </div>
      </div>
    </section>
  );
}

export { PolisurAbout };
