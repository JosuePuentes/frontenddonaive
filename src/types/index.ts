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
export type {
  AgentContext,
  AnalyticsSnapshot,
  AuditLog,
  Capability,
  PlatformRole,
  PlatformOrganization,
  PlatformProject,
  ProjectCategory,
  ProjectCustomization,
  ProjectDomain,
  ProjectUser,
  Template,
  TemplateVersion,
} from "@/types/platform";
export {
  CORE_CAPABILITIES,
  MODULE_KEYS,
  PLATFORM_ROLES,
  PROJECT_CAPABILITIES,
  PROJECT_CATEGORIES,
} from "@/types/platform";
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
  OpportunityPriority,
  OpportunityStatus,
  OpportunityUrgency,
  Organization,
  OrganizationType,
  Project,
  ProjectStatus,
} from "@/types/crm";
export {
  CRM_PIPELINE_COLUMNS,
  LEAD_SOURCES,
  LEAD_SOURCE_LABELS,
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  OPPORTUNITY_STATUSES,
  OPPORTUNITY_STATUS_LABELS,
  ORGANIZATION_TYPES,
  PROJECT_STATUSES,
} from "@/types/crm";
export type {
  Proposal,
  ProposalItem,
  ProposalStatus,
} from "@/types/proposal";
export {
  PROPOSAL_FLOW_STAGES,
  PROPOSAL_STATUS_LABELS,
  PROPOSAL_STATUSES,
} from "@/types/proposal";
export type {
  PricingModel,
  Service,
  ServiceCategory,
  ServiceCategoryKey,
  ServiceCurrency,
  ServicePackage,
} from "@/types/services";
export {
  DEFAULT_SERVICE_CATEGORIES,
  PRICING_MODEL_LABELS,
  PRICING_MODELS,
  SERVICE_CATEGORY_KEYS,
  SERVICE_CATEGORY_LABELS,
  SERVICE_CURRENCIES,
} from "@/types/services";
export type {
  Activity,
  ActivityStatus,
  ActivityType,
  ActorSource,
  EstimatedValueRange,
  LossReason,
  LossReasonKey,
  QualificationCriteria,
  QualificationLevel,
  SolutionLinkKind,
  SolutionServiceLink,
} from "@/types/commercial";
export {
  ACTIVITY_STATUSES,
  ACTIVITY_STATUS_LABELS,
  ACTIVITY_TYPES,
  ACTIVITY_TYPE_LABELS,
  ACTOR_SOURCES,
  DEFAULT_LOSS_REASONS,
  LOSS_REASON_KEYS,
  QUALIFICATION_LEVELS,
  QUALIFICATION_LEVEL_LABELS,
  SOLUTION_LINK_KINDS,
} from "@/types/commercial";
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
