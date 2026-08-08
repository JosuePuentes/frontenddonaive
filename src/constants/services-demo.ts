/**
 * Catálogo DEMO — solo para visualizar la UI.
 * No representa precios ni paquetes comerciales reales de Donaive.
 */
import type { Service, ServicePackage } from "@/types/services";

export const demoServices: Service[] = [
  {
    id: "demo-svc-1",
    name: "Diagnóstico empresarial DEMO",
    slug: "diagnostico-empresarial-demo",
    description:
      "Comprensión estructurada del problema, causa e impacto. Ejemplo DEMO.",
    category: "diagnostico_estrategia",
    active: true,
    pricingModel: "custom",
    basePrice: null,
    currency: "USD",
    estimatedDuration: "A definir",
    deliverables: ["Informe de diagnóstico", "Mapa AS-IS", "Recomendaciones"],
    tags: ["diagnóstico", "estrategia", "DEMO"],
    isDemo: true,
  },
  {
    id: "demo-svc-2",
    name: "Diseño de procesos DEMO",
    slug: "diseno-procesos-demo",
    description: "Diseño TO-BE de procesos críticos. Ejemplo DEMO.",
    category: "procesos_organizacion",
    active: true,
    pricingModel: "custom",
    basePrice: null,
    currency: "USD",
    estimatedDuration: "A definir",
    deliverables: ["Flujos TO-BE", "Roles y responsabilidades"],
    tags: ["procesos", "DEMO"],
    isDemo: true,
  },
  {
    id: "demo-svc-3",
    name: "Automatización operativa DEMO",
    slug: "automatizacion-operativa-demo",
    description: "Oportunidades de automatización sin implementación real.",
    category: "automatizacion",
    active: true,
    pricingModel: "custom",
    basePrice: null,
    estimatedDuration: "A definir",
    deliverables: ["Lista de automatizaciones", "Priorización"],
    tags: ["automatización", "DEMO"],
    isDemo: true,
  },
  {
    id: "demo-svc-4",
    name: "Dashboard de control DEMO",
    slug: "dashboard-control-demo",
    description: "Visibilidad operativa para decisiones. Ejemplo DEMO.",
    category: "business_intelligence",
    active: false,
    pricingModel: "monthly",
    basePrice: null,
    estimatedDuration: "A definir",
    deliverables: ["Tablero", "Indicadores clave"],
    tags: ["BI", "dashboard", "DEMO"],
    isDemo: true,
  },
];

export const demoServicePackages: ServicePackage[] = [
  {
    id: "demo-pkg-1",
    name: "Paquete conceptual DEMO",
    description:
      "Estructura de paquete (no comercial definitivo): combina capacidades del catálogo.",
    services: ["demo-svc-1", "demo-svc-2", "demo-svc-3"],
    pricingModel: "custom",
    basePrice: null,
    active: true,
    isDemo: true,
  },
];
