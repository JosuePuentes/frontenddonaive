import { PolisurMedia } from "@/components/polisur/PolisurMedia";
import { POLISUR_MEDIA, polisurCopy } from "@/content/polisur";

function PolisurCitizenSection() {
  return (
    <section
      id="ciudadania"
      className="scroll-mt-28 border-b border-[var(--ps-line)] bg-[var(--ps-navy-950)]"
      aria-labelledby="polisur-citizen-title"
    >
      <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
        <div className="order-2 flex items-center px-5 py-14 sm:px-10 sm:py-16 lg:order-1 lg:px-14">
          <div className="max-w-lg">
            <p className="ps-eyebrow">{polisurCopy.citizen.eyebrow}</p>
            <h2
              id="polisur-citizen-title"
              className="mt-4 text-3xl uppercase leading-tight tracking-wide text-[var(--ps-white)] sm:text-4xl"
            >
              {polisurCopy.citizen.title}
            </h2>
            <hr className="ps-gold-rule mt-6" />
            <p className="mt-6 text-[0.95rem] leading-relaxed text-[var(--ps-steel-300)] sm:text-base">
              {polisurCopy.citizen.body}
            </p>

            <ul className="mt-9 grid grid-cols-2 gap-x-6 gap-y-4 sm:max-w-sm">
              {polisurCopy.citizen.pillars.map((item) => (
                <li
                  key={item}
                  className="border-l-2 border-[var(--ps-gold)]/65 pl-3 text-sm font-medium tracking-wide text-[var(--ps-paper)]"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <PolisurMedia
          src={POLISUR_MEDIA.home.ciudadania}
          alt="POLISUR al servicio de la ciudadanía"
          className="order-1 min-h-[17rem] sm:min-h-[22rem] lg:order-2 lg:min-h-[30rem]"
          objectPosition="center 40%"
          overlay="soft"
        />
      </div>
    </section>
  );
}

export { PolisurCitizenSection };
