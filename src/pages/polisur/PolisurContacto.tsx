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
        <div className="ps-container grid gap-12 py-14 sm:py-20 lg:grid-cols-2">
          <div className="space-y-6">
            <h2 className="text-2xl text-[var(--ps-white)]">Sede e información</h2>
            <dl className="space-y-5 text-sm text-[var(--ps-steel-300)]">
              <div>
                <dt className="ps-eyebrow">Dirección</dt>
                <dd className="mt-2 whitespace-pre-line">{contact.address}</dd>
              </div>
              {contact.phone ? (
                <div>
                  <dt className="ps-eyebrow">Teléfono</dt>
                  <dd className="mt-2">
                    <a
                      href={`tel:${contact.phone.replace(/\s+/g, "")}`}
                      className="text-[var(--ps-paper)] hover:underline"
                      onClick={() => trackPolisurClick("phone", "primary")}
                    >
                      {contact.phone}
                    </a>
                    {contact.phoneAlt ? (
                      <>
                        {" · "}
                        <a
                          href={`tel:${contact.phoneAlt.replace(/\s+/g, "")}`}
                          className="text-[var(--ps-paper)] hover:underline"
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
                <div>
                  <dt className="ps-eyebrow">Correo</dt>
                  <dd className="mt-2">
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-[var(--ps-paper)] hover:underline"
                    >
                      {contact.email}
                    </a>
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="ps-eyebrow">Horario</dt>
                <dd className="mt-2">{contact.hours}</dd>
              </div>
            </dl>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl text-[var(--ps-white)]">Redes oficiales</h2>
            {hasSocial ? (
              <ul className="space-y-3 text-sm">
                {SOCIAL_LABELS.map(({ key, label }) => {
                  const href = social[key];
                  if (!href) return null;
                  return (
                    <li key={key}>
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-[var(--ps-mint)] underline-offset-4 hover:underline"
                        onClick={() => trackPolisurClick("social", key)}
                      >
                        {label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm leading-relaxed text-[var(--ps-steel-400)]">
                Las redes oficiales se publicarán desde el acceso institucional
                cuando estén disponibles.
              </p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
