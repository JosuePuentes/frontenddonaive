import { PolisurMedia } from "@/components/polisur/PolisurMedia";
import { POLISUR_MEDIA, polisurCopy } from "@/content/polisur";

function PolisurCitizenSection() {
  return (
    <section
      id="ciudadania"
      className="scroll-mt-16 border-b border-[var(--ps-line)] bg-[var(--ps-navy-900)]"
    >
      <div className="ps-container grid gap-8 py-14 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <p className="ps-eyebrow">{polisurCopy.citizen.eyebrow}</p>
          <h2 className="mt-3 text-3xl text-[var(--ps-white)] sm:text-4xl">
            {polisurCopy.citizen.title}
          </h2>
          <p className="mt-5 max-w-xl text-[0.95rem] leading-relaxed text-[var(--ps-steel-300)] sm:text-base">
            {polisurCopy.citizen.body}
          </p>

          <ul className="mt-8 grid grid-cols-2 gap-3 text-sm text-[var(--ps-paper)] sm:max-w-md">
            {["Servicio", "Prevención", "Seguridad", "Cercanía"].map((item) => (
              <li
                key={item}
                className="border-l border-[var(--ps-gold)]/70 pl-3 py-1"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>

        <PolisurMedia
          src={POLISUR_MEDIA.home.ciudadania}
          alt="Atención ciudadana"
          className="min-h-[15rem] sm:min-h-[18rem]"
          objectPosition="center"
          overlay="soft"
        />
      </div>
    </section>
  );
}

export { PolisurCitizenSection };
