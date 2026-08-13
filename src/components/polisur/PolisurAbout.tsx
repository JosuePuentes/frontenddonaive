import { PolisurMedia } from "@/components/polisur/PolisurMedia";
import { POLISUR_MEDIA, polisurCopy } from "@/content/polisur";

function PolisurAbout() {
  return (
    <section
      id="institucion"
      className="scroll-mt-20 border-b border-[var(--ps-line)] bg-[var(--ps-navy-950)]"
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

        <div className="flex items-center bg-[var(--ps-navy-900)] px-5 py-14 sm:px-10 sm:py-16 lg:px-14">
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
          </div>
        </div>
      </div>
    </section>
  );
}

export { PolisurAbout };
