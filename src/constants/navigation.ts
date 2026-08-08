export type NavItem = {
  label: string;
  to: string;
};

export const primaryNavItems: NavItem[] = [
  { label: "Inicio", to: "/" },
  { label: "Empresa", to: "/empresa" },
  { label: "Soluciones", to: "/soluciones" },
  { label: "Academy", to: "/academy" },
  { label: "Media", to: "/media" },
  { label: "Blog", to: "/blog" },
  { label: "Contacto", to: "/contacto" },
];

export const footerNav = {
  producto: [
    { label: "Soluciones", to: "/soluciones" },
    { label: "Academy", to: "/academy" },
  ],
  empresa: [
    { label: "Empresa", to: "/empresa" },
    { label: "Contacto", to: "/contacto" },
  ],
  recursos: [
    { label: "Blog", to: "/blog" },
    { label: "Media", to: "/media" },
  ],
  legal: [
    { label: "Privacidad", to: "/privacidad" },
    { label: "Términos", to: "/terminos" },
  ],
} as const;

export const ctaNavItem: NavItem = {
  label: "Comenzar",
  to: "/contacto",
};
