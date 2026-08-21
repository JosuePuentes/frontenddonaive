import { Link } from "react-router";
import { usePolisurTheme } from "@/components/polisur/usePolisurTheme";
import { POLISUR_ROUTES, polisurNavItems } from "@/constants/polisur-routes";
import { polisurCopy } from "@/content/polisur";
import {
  hasPolisurSocial,
  type PolisurSocialLinks,
} from "@/content/polisur-site";
import { usePolisurSite } from "@/providers/polisur/PolisurSiteProvider";

const SOCIAL_LABELS: { key: keyof PolisurSocialLinks; label: string }[] = [
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "twitter", label: "X" },
  { key: "youtube", label: "YouTube" },
  { key: "tiktok", label: "TikTok" },
  { key: "whatsapp", label: "WhatsApp" },
];

function PolisurFooter() {
  const { isCanina } = usePolisurTheme();
  const { site } = usePolisurSite();
  const { contact, social } = site;
  const hasSocial = hasPolisurSocial(social);

  return (
    <footer className="bg-[var(--ps-navy-900)]">
      <div className="ps-container grid gap-10 border-t border-[var(--ps-line)] py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="ps-display text-xl text-[var(--ps-white)]">
            {isCanina ? "Unidad Canina" : polisurCopy.brand.fullName}
          </div>
          <p className="mt-1 text-[0.65rem] uppercase tracking-[0.14em] text-[var(--ps-mint)]">
            {isCanina ? polisurCopy.brand.name : polisurCopy.brand.jurisdiction}
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-[var(--ps-steel-300)]">
            {polisurCopy.brand.identification}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-[var(--ps-steel-300)]">
            <span className="text-[var(--ps-mint)]">
              {polisurCopy.leadership.role}:
            </span>{" "}
            {polisurCopy.leadership.rank} {polisurCopy.leadership.name}
          </p>
        </div>

        <div>
          <h3 className="ps-eyebrow">Enlaces</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-[var(--ps-steel-300)]">
            {polisurNavItems.map((item) => (
              <li key={item.key}>
                <Link to={item.to} className="hover:text-[var(--ps-white)]">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="ps-eyebrow">Contacto</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-[var(--ps-steel-300)]">
            <li>
              <Link
                to={POLISUR_ROUTES.contacto}
                className="hover:text-[var(--ps-white)]"
              >
                Ir a contacto
              </Link>
            </li>
            {contact.phone ? <li>{contact.phone}</li> : null}
            {contact.email ? <li>{contact.email}</li> : null}
            <li>{contact.address || polisurCopy.footer.contactNote}</li>
          </ul>
        </div>

        <div>
          <h3 className="ps-eyebrow">{polisurCopy.footer.attention}</h3>
          <p className="mt-4 text-sm leading-relaxed text-[var(--ps-steel-300)]">
            {contact.note || polisurCopy.footer.attentionNote}
          </p>
          {hasSocial ? (
            <ul className="mt-4 flex flex-wrap gap-x-3 gap-y-2 text-sm text-[var(--ps-steel-300)]">
              {SOCIAL_LABELS.map(({ key, label }) => {
                const href = social[key];
                if (!href) return null;
                return (
                  <li key={key}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="hover:text-[var(--ps-mint)]"
                    >
                      {label}
                    </a>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 text-sm leading-relaxed text-[var(--ps-steel-300)]">
              {polisurCopy.footer.socialNote}
            </p>
          )}
        </div>
      </div>

      <div className="border-t border-[var(--ps-line)]">
        <div className="ps-container flex flex-col gap-2 py-5 text-xs text-[var(--ps-steel-400)] sm:flex-row sm:items-center sm:justify-between">
          <span>© {polisurCopy.brand.name}</span>
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>Portal institucional</span>
            <Link
              to={POLISUR_ROUTES.medios}
              className="text-[var(--ps-steel-400)] underline-offset-4 hover:text-[var(--ps-mint)] hover:underline"
            >
              Acceso institucional
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}

export { PolisurFooter };
