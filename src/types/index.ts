export type { NavLinkItem, RouteKey, RoutePath } from "@/types/routes";
export type { PageSeo, SeoMap } from "@/types/seo";
export type {
  ContactContent,
  ContactFormField,
  ContentBlock,
  ContentCategory,
  ContentPillar,
  ContentStep,
  LegalContent,
  PageContent,
} from "@/types/content";
export type { AuthSession, AuthState, AuthUser } from "@/types/auth";
export type {
  AccessSubject,
  Permission,
  Role,
} from "@/types/permissions";
export { canAccess } from "@/types/permissions";
export type { ApiError, ApiResponse, PaginatedResponse } from "@/types/api";
export type { CmsContentItem, CmsContentStatus } from "@/types/cms";
export type { MediaAsset } from "@/types/media";
export type { AnalyticsMetric } from "@/types/analytics";
export type {
  BreadcrumbItem,
  DashboardModule,
  DashboardModuleId,
} from "@/types/dashboard";
export type {
  Contact,
  Interaction,
  Lead,
  LeadSource,
  LeadStatus,
  Opportunity,
  Organization,
  Project,
  Proposal,
} from "@/types/crm";
export {
  CRM_PIPELINE_COLUMNS,
  LEAD_SOURCES,
  LEAD_STATUSES,
  PROJECT_STATUSES,
  PROPOSAL_STATUSES,
} from "@/types/crm";
export type {
  AutomationOpportunity,
  AutomationType,
  ComplexityLevel,
  CurrentProcess,
  CurrentProcessStep,
  Diagnosis,
  DiagnosisFormStageKey,
  DiagnosisPriority,
  DiagnosisScoreDimensions,
  DiagnosisStatus,
  DiagnosisViewTabKey,
  EffortLevel,
  EvidenceLevel,
  Impact,
  ImpactCategory,
  Observation,
  ObservationArea,
  Problem,
  ProposedProcess,
  ProposedProcessStep,
  Recommendation,
  RecommendationHorizon,
  RootCause,
  RootCauseCategory,
  Solution,
  SolutionType,
} from "@/types/diagnosis";
export {
  AUTOMATION_TYPES,
  DIAGNOSIS_FORM_STAGES,
  DIAGNOSIS_METHODOLOGY_STAGES,
  DIAGNOSIS_PRIORITIES,
  DIAGNOSIS_STATUSES,
  DIAGNOSIS_VIEW_TABS,
  EVIDENCE_LEVELS,
  IMPACT_CATEGORIES,
  OBSERVATION_AREAS,
  RECOMMENDATION_HORIZONS,
  ROOT_CAUSE_CATEGORIES,
  SOLUTION_TYPES,
} from "@/types/diagnosis";
