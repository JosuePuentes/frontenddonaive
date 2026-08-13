import { PolisurMedia } from "@/components/polisur/PolisurMedia";
import { POLISUR_MEDIA, polisurCopy } from "@/content/polisur";

function PolisurAbout() {
  return (
    <section
      id="institucion"
      className="scroll-mt-16 border-b border-[var(--ps-line)] bg-[var(--ps-navy-950)]"
    >
      <div className="ps-container grid gap-8 py-14 sm:gap-10 sm:py-20 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <PolisurMedia
          src={POLISUR_MEDIA.home.about}
          alt="Imagen institucional"
          className="min-h-[16rem] sm:min-h-[20rem] lg:min-h-[24rem]"
          objectPosition="center"
          overlay="soft"
        />

        <div className="lg:pl-4">
          <p className="ps-eyebrow">{polisurCopy.about.eyebrow}</p>
          <h2 className="mt-3 text-3xl text-[var(--ps-white)] sm:text-4xl">
            {polisurCopy.about.title}
          </h2>
          <hr className="ps-rule mt-6 max-w-[4rem]" />
          <p className="mt-6 max-w-xl text-[0.95rem] leading-relaxed text-[var(--ps-steel-300)] sm:text-base">
            {polisurCopy.about.body}
          </p>
        </div>
      </div>
    </section>
  );
}

export { PolisurAbout };
