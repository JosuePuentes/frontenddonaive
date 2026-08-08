import type { PageSeo, SeoMap } from "@/types/seo";
import { ROUTES } from "@/constants/routes";

export const seoByRoute = {
  [ROUTES.home]: {
    title:
      "Donaive — Sistemas, automatización e inteligencia para organizaciones",
    description:
      "Donaive analiza problemas, diseña procesos y desarrolla sistemas, automatización e inteligencia artificial para ayudar a las organizaciones a funcionar mejor.",
  },
  [ROUTES.empresa]: {
    title: "Donaive — Diseñamos sistemas para resolver problemas",
    description:
      "Conoce la filosofía y metodología de Donaive: observar, detectar, analizar, diseñar, implementar y mejorar organizaciones.",
  },
  [ROUTES.soluciones]: {
    title:
      "Donaive — Diagnóstico, procesos, automatización, sistemas e IA",
    description:
      "Soluciones de Donaive para diagnóstico, estructuración empresarial, automatización, sistemas, inteligencia de negocios y formación.",
  },
  [ROUTES.academy]: {
    title:
      "Donaive Academy — Formación para resolver problemas con tecnología e IA",
    description:
      "Visión de Donaive Academy: formar personas capaces de analizar problemas, diseñar soluciones y utilizar tecnología e IA con criterio.",
  },
  [ROUTES.media]: {
    title: "Donaive Media — Análisis, estrategia y tecnología aplicada",
    description:
      "Espacio de Donaive Media para futuros contenidos sobre análisis, procesos, IA, negocios y liderazgo.",
  },
  [ROUTES.blog]: {
    title:
      "Donaive Blog — Estrategia, procesos, tecnología e inteligencia artificial",
    description:
      "Estructura editorial del blog de Donaive sobre estrategia, procesos, automatización e inteligencia artificial aplicada.",
  },
  [ROUTES.contacto]: {
    title: "Donaive — Cuéntanos qué problema estás intentando resolver",
    description:
      "Contacta a Donaive para contar el problema que necesitas resolver. No hace falta saber qué software necesitas.",
  },
  [ROUTES.privacidad]: {
    title: "Donaive — Política de Privacidad",
    description:
      "Información sobre el tratamiento de datos personales en Donaive.",
  },
  [ROUTES.terminos]: {
    title: "Donaive — Términos y Condiciones",
    description:
      "Condiciones de uso del sitio y de los servicios presentados por Donaive.",
  },
} as const satisfies SeoMap;

export function getSeo(path: keyof typeof seoByRoute): PageSeo {
  return seoByRoute[path];
}
