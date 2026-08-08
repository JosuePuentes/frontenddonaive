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
    title: "Donaive — Una metodología para resolver problemas",
    description:
      "Conoce cómo Donaive observa, detecta y diseña soluciones para que las organizaciones funcionen mejor.",
  },
  [ROUTES.soluciones]: {
    title: "Donaive — Soluciones empresariales, tecnología y automatización",
    description:
      "Explora las capacidades de Donaive en procesos, automatización, inteligencia artificial, sistemas y formación.",
  },
  [ROUTES.academy]: {
    title:
      "Donaive Academy — Formación para resolver problemas con tecnología e IA",
    description:
      "Formación orientada a analizar problemas, diseñar soluciones y utilizar tecnología e inteligencia artificial con criterio.",
  },
  [ROUTES.media]: {
    title: "Donaive Media — Ideas, análisis y tecnología aplicada",
    description:
      "Espacio para ideas, análisis y contenidos sobre tecnología aplicada a organizaciones.",
  },
  [ROUTES.blog]: {
    title:
      "Donaive Blog — Estrategia, procesos, tecnología e inteligencia artificial",
    description:
      "Artículos y reflexiones sobre estrategia, procesos, automatización e inteligencia artificial aplicada.",
  },
  [ROUTES.contacto]: {
    title: "Donaive — Cuéntanos qué problema tienes",
    description:
      "Cuéntanos qué problema tienes. Analizamos el contexto y determinamos cómo puede resolverse.",
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
