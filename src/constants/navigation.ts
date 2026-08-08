import { ROUTES } from "@/constants/routes";
import type { NavLinkItem } from "@/types/routes";

export const primaryNavItems: NavLinkItem[] = [
  { label: "Inicio", to: ROUTES.home },
  { label: "Soluciones", to: ROUTES.soluciones },
  { label: "Academy", to: ROUTES.academy },
  { label: "Media", to: ROUTES.media },
  { label: "Blog", to: ROUTES.blog },
  { label: "Contacto", to: ROUTES.contacto },
];

export const footerNav = {
  producto: [
    { label: "Soluciones", to: ROUTES.soluciones },
    { label: "Academy", to: ROUTES.academy },
  ],
  empresa: [
    { label: "Empresa", to: ROUTES.empresa },
    { label: "Contacto", to: ROUTES.contacto },
  ],
  recursos: [
    { label: "Blog", to: ROUTES.blog },
    { label: "Media", to: ROUTES.media },
  ],
  legal: [
    { label: "Privacidad", to: ROUTES.privacidad },
    { label: "Términos", to: ROUTES.terminos },
  ],
} as const satisfies Record<string, readonly NavLinkItem[]>;

export const ctaNavItem: NavLinkItem = {
  label: "Comenzar",
  to: ROUTES.contacto,
};
