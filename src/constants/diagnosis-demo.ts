/**
 * Datos DEMO únicamente para visualizar componentes del motor de diagnóstico.
 * No representan clientes, empresas ni cifras reales.
 */
import type {
  AutomationOpportunity,
  CurrentProcessStep,
  Diagnosis,
  Impact,
  Observation,
  Problem,
  ProposedProcessStep,
  Recommendation,
  RootCause,
  Solution,
} from "@/types/diagnosis";

export const DEMO_DIAGNOSIS_ID = "demo-diagnosis-1";

export const demoDiagnosis: Diagnosis = {
  id: DEMO_DIAGNOSIS_ID,
  leadId: "demo-lead",
  organizationId: "demo-org",
  title: "Diagnóstico DEMO — control operativo",
  summary:
    "Ejemplo de demostración: se observa un proceso manual con fricción entre áreas. Sin datos reales.",
  status: "in_progress",
  priority: "high",
  score: {
    severity: null,
    impact: null,
    urgency: null,
    complexity: null,
    automationPotential: null,
  },
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
  isDemo: true,
};

export const demoObservations: Observation[] = [
  {
    id: "demo-obs-1",
    diagnosisId: DEMO_DIAGNOSIS_ID,
    area: "operaciones",
    process: "Registro de pedidos",
    description: "El equipo registra información en hojas dispersas.",
    evidence: "Revisión visual del flujo diario (DEMO)",
    frequency: "Diaria",
    responsible: "Coordinación operativa",
    impact: "Retrasos y errores de seguimiento",
    evidenceLevel: "observado",
  },
];

export const demoProblems: Problem[] = [
  {
    id: "demo-prob-1",
    diagnosisId: DEMO_DIAGNOSIS_ID,
    description: "No existe una fuente única de verdad para el estado del pedido.",
    origin: "Proceso manual acumulado",
    frequency: "Continua",
    affectedArea: "Operaciones y atención",
    affectedPeople: "Equipo operativo y dirección",
    severity: "high",
    evidence: "Inconsistencias entre registros (DEMO)",
    evidenceLevel: "observado",
  },
];

export const demoRootCauses: RootCause[] = [
  {
    id: "demo-cause-1",
    diagnosisId: DEMO_DIAGNOSIS_ID,
    cause: "Ausencia de un proceso estandarizado y sistema de seguimiento.",
    category: "proceso",
    evidence: "Pasos distintos según la persona (DEMO)",
    confidence: "inferido",
  },
  {
    id: "demo-cause-2",
    diagnosisId: DEMO_DIAGNOSIS_ID,
    cause: "Información fragmentada entre canales.",
    category: "informacion",
    evidence: "Pendiente de validar con el equipo (DEMO)",
    confidence: "por_validar",
  },
];

export const demoImpacts: Impact[] = [
  {
    id: "demo-impact-1",
    diagnosisId: DEMO_DIAGNOSIS_ID,
    category: "operational",
    description: "Tiempo extra en seguimiento y retrabajo.",
    severity: "high",
    estimatedValue: null,
    frequency: "Semanal",
  },
  {
    id: "demo-impact-2",
    diagnosisId: DEMO_DIAGNOSIS_ID,
    category: "customer",
    description: "Respuestas lentas o inconsistentes al cliente.",
    severity: "medium",
    estimatedValue: null,
    frequency: "Recurrente",
  },
];

export const demoCurrentProcess: CurrentProcessStep[] = [
  {
    id: "demo-as-is-1",
    diagnosisId: DEMO_DIAGNOSIS_ID,
    step: 1,
    responsible: "Comercial",
    input: "Solicitud del cliente",
    action: "Recibe pedido por mensaje o llamada",
    output: "Nota informal",
    system: "WhatsApp / papel",
    problem: "Sin registro central",
  },
  {
    id: "demo-as-is-2",
    diagnosisId: DEMO_DIAGNOSIS_ID,
    step: 2,
    responsible: "Operaciones",
    input: "Nota informal",
    action: "Intenta ejecutar sin checklist",
    output: "Avance parcial",
    system: "Hojas de cálculo",
    problem: "Estado poco visible",
  },
  {
    id: "demo-as-is-3",
    diagnosisId: DEMO_DIAGNOSIS_ID,
    step: 3,
    responsible: "Dirección",
    input: "Consultas ad hoc",
    action: "Pide reportes manuales",
    output: "Resumen incompleto",
    system: "Correo",
    problem: "Decisiones con retraso",
  },
];

export const demoProposedProcess: ProposedProcessStep[] = [
  {
    id: "demo-to-be-1",
    diagnosisId: DEMO_DIAGNOSIS_ID,
    step: 1,
    responsible: "Comercial",
    input: "Solicitud del cliente",
    action: "Registra oportunidad o pedido en sistema",
    output: "Registro estructurado",
    automation: "Formulario con validaciones",
    system: "CRM / flujo Donaive",
  },
  {
    id: "demo-to-be-2",
    diagnosisId: DEMO_DIAGNOSIS_ID,
    step: 2,
    responsible: "Operaciones",
    input: "Registro estructurado",
    action: "Ejecuta checklist y actualiza estado",
    output: "Estado visible",
    automation: "Notificaciones de cambio de estado",
    system: "Panel operativo",
  },
  {
    id: "demo-to-be-3",
    diagnosisId: DEMO_DIAGNOSIS_ID,
    step: 3,
    responsible: "Dirección",
    input: "Indicadores en vivo",
    action: "Revisa tablero y prioriza",
    output: "Decisiones oportunas",
    automation: "Reportes automáticos",
    system: "Dashboard",
  },
];

export const demoAutomations: AutomationOpportunity[] = [
  {
    id: "demo-auto-1",
    diagnosisId: DEMO_DIAGNOSIS_ID,
    process: "Seguimiento de pedidos",
    problem: "Actualizaciones manuales",
    opportunity: "Notificar cambios de estado al responsable",
    automationType: "notification",
    expectedBenefit: "Menos seguimiento manual",
    complexity: "low",
    priority: "medium",
  },
  {
    id: "demo-auto-2",
    diagnosisId: DEMO_DIAGNOSIS_ID,
    process: "Registro inicial",
    problem: "Datos incompletos",
    opportunity: "Validar campos mínimos al ingresar",
    automationType: "validation",
    expectedBenefit: "Mejor calidad de datos",
    complexity: "medium",
    priority: "high",
  },
];

export const demoSolutions: Solution[] = [
  {
    id: "demo-sol-1",
    diagnosisId: DEMO_DIAGNOSIS_ID,
    description:
      "Diseñar proceso AS-IS/TO-BE, implementar seguimiento centralizado y tablero de control.",
    type: "hybrid",
    components: ["Proceso", "CRM", "Dashboard", "Capacitación"],
    dependencies: ["Definición de roles", "Datos maestros básicos"],
    priority: "high",
    estimatedComplexity: "medium",
  },
];

export const demoRecommendations: Recommendation[] = [
  {
    id: "demo-rec-1",
    diagnosisId: DEMO_DIAGNOSIS_ID,
    title: "Estandarizar captura del pedido",
    description: "Definir campos mínimos y un único punto de entrada.",
    priority: "high",
    impact: "Reduce errores de registro",
    effort: "low",
    sequence: 1,
    horizon: "quick_win",
  },
  {
    id: "demo-rec-2",
    diagnosisId: DEMO_DIAGNOSIS_ID,
    title: "Visibilidad del estado",
    description: "Panel simple con estados y responsables.",
    priority: "high",
    impact: "Mejora control operativo",
    effort: "medium",
    sequence: 2,
    horizon: "medium_term",
  },
  {
    id: "demo-rec-3",
    diagnosisId: DEMO_DIAGNOSIS_ID,
    title: "Automatizaciones de notificación",
    description: "Alertas cuando un pedido se detiene o cambia de etapa.",
    priority: "medium",
    impact: "Menos seguimiento manual",
    effort: "medium",
    sequence: 3,
    horizon: "long_term",
  },
];
