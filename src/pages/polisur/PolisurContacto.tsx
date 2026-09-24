import { PageMeta } from "@/components/page/PageMeta";
import {
  hasPolisurSocial,
  type PolisurSocialLinks,
} from "@/content/polisur-site";
import { trackPolisurClick } from "@/lib/polisur-track";
import { usePolisurSite } from "@/providers/polisur/PolisurSiteProvider";

const SOCIAL_LABELS: { key: keyof PolisurSocialLinks; label: string }[] = [
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "twitter", label: "X / Twitter" },
  { key: "youtube", label: "YouTube" },
  { key: "tiktok", label: "TikTok" },
  { key: "whatsapp", label: "WhatsApp" },
];

export default function PolisurContacto() {
  const { site } = usePolisurSite();
  const { contact, social } = site;
  const hasSocial = hasPolisurSocial(social);

  return (
    <>
      <PageMeta
        title="Contacto — POLISUR"
        description="Canales de atención ciudadana e información de contacto institucional de POLISUR."
      />
      <section className="border-b border-[var(--ps-line)] bg-[var(--ps-navy-950)]">
        <div className="ps-container py-14 sm:py-20">
          <p className="ps-eyebrow">Atención ciudadana</p>
          <h1 className="mt-3 text-4xl text-[var(--ps-white)] sm:text-5xl">
            Contacto
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--ps-steel-300)] sm:text-base">
            {contact.note}
          </p>
        </div>
      </section>

      <section className="bg-[var(--ps-navy-900)]">
        <div className="ps-container py-14 sm:py-20">
          <div className="ps-contact-panel">
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
              <div>
                <h2 className="text-2xl text-[var(--ps-navy-950)] sm:text-3xl">
                  Sede e información
                </h2>
                <dl className="mt-8 space-y-7">
                  <div className="ps-contact-panel__item">
                    <dt className="ps-contact-panel__label">Dirección</dt>
                    <dd className="ps-contact-panel__value whitespace-pre-line">
                      {contact.address}
                    </dd>
                  </div>
                  {contact.phone ? (
                    <div className="ps-contact-panel__item">
                      <dt className="ps-contact-panel__label">Teléfono</dt>
                      <dd className="ps-contact-panel__value">
                        <a
                          href={`tel:${contact.phone.replace(/\s+/g, "")}`}
                          className="text-[var(--ps-navy-900)] underline-offset-4 hover:underline"
                          onClick={() => trackPolisurClick("phone", "primary")}
                        >
                          {contact.phone}
                        </a>
                        {contact.phoneAlt ? (
                          <>
                            <span className="mx-2 text-[var(--ps-steel-400)]">
                              ·
                            </span>
                            <a
                              href={`tel:${contact.phoneAlt.replace(/\s+/g, "")}`}
                              className="text-[var(--ps-navy-900)] underline-offset-4 hover:underline"
                              onClick={() => trackPolisurClick("phone", "alt")}
                            >
                              {contact.phoneAlt}
                            </a>
                          </>
                        ) : null}
                      </dd>
                    </div>
                  ) : null}
                  {contact.email ? (
                    <div className="ps-contact-panel__item">
                      <dt className="ps-contact-panel__label">Correo</dt>
                      <dd className="ps-contact-panel__value">
                        <a
                          href={`mailto:${contact.email}`}
                          className="text-[var(--ps-navy-900)] underline-offset-4 hover:underline"
                        >
                          {contact.email}
                        </a>
                      </dd>
                    </div>
                  ) : null}
                  <div className="ps-contact-panel__item">
                    <dt className="ps-contact-panel__label">Horario</dt>
                    <dd className="ps-contact-panel__value">{contact.hours}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h2 className="text-2xl text-[var(--ps-navy-950)] sm:text-3xl">
                  Redes oficiales
                </h2>
                {hasSocial ? (
                  <ul className="mt-8 space-y-4">
                    {SOCIAL_LABELS.map(({ key, label }) => {
                      const href = social[key];
                      if (!href) return null;
                      return (
                        <li key={key} className="ps-contact-panel__item">
                          <span className="ps-contact-panel__label">{label}</span>
                          <a
                            href={href}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="mt-2 block text-base font-semibold text-[var(--ps-green)] underline-offset-4 hover:underline sm:text-lg"
                            onClick={() => trackPolisurClick("social", key)}
                          >
                            {href.replace(/^https?:\/\//, "")}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="mt-8 text-base leading-relaxed text-[var(--ps-navy-850)]">
                    Las redes oficiales se publicarán desde el acceso institucional
                    cuando estén disponibles.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
