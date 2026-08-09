import type {
  Interaction,
  Lead,
  Opportunity,
  Organization,
  Project,
  Proposal,
} from "@/types/crm";
import type {
  Diagnosis,
  Observation,
  Problem,
  Solution,
} from "@/types/diagnosis";
import type {
  Activity,
  LossReason,
  QualificationCriteria,
  SolutionServiceLink,
} from "@/types/commercial";
import { DEFAULT_LOSS_REASONS } from "@/types/commercial";
import type { PaginatedResponse } from "@/types/api";

/**
 * CRM / motor comercial — stubs tipados.
 * Sin HTTP, fetch ni persistencia.
 */
export const crmService = {
  async listLeads(): Promise<PaginatedResponse<Lead>> {
    return { items: [], total: 0, page: 1, pageSize: 20 };
  },

  async getLead(_id: string): Promise<Lead | null> {
    return null;
  },

  async updateLeadQualification(
    _leadId: string,
    _qualification: QualificationCriteria,
  ): Promise<Lead | null> {
    return null;
  },

  async listOpportunities(): Promise<PaginatedResponse<Opportunity>> {
    return { items: [], total: 0, page: 1, pageSize: 20 };
  },

  async getOpportunity(_id: string): Promise<Opportunity | null> {
    return null;
  },

  async createOpportunity(
    _input: Partial<Opportunity>,
  ): Promise<Opportunity | null> {
    return null;
  },

  async updateOpportunity(
    _id: string,
    _input: Partial<Opportunity>,
  ): Promise<Opportunity | null> {
    return null;
  },

  async listOrganizations(): Promise<PaginatedResponse<Organization>> {
    return { items: [], total: 0, page: 1, pageSize: 20 };
  },

  async listDiagnoses(): Promise<PaginatedResponse<Diagnosis>> {
    return { items: [], total: 0, page: 1, pageSize: 20 };
  },

  async listDiagnosesByOpportunity(
    _opportunityId: string,
  ): Promise<Diagnosis[]> {
    return [];
  },

  async getDiagnosis(_id: string): Promise<Diagnosis | null> {
    return null;
  },

  async createDiagnosis(
    _input: Partial<Diagnosis>,
  ): Promise<Diagnosis | null> {
    return null;
  },

  async updateDiagnosis(
    _id: string,
    _input: Partial<Diagnosis>,
  ): Promise<Diagnosis | null> {
    return null;
  },

  async getDiagnosisObservations(_diagnosisId: string): Promise<Observation[]> {
    return [];
  },

  async getDiagnosisProblems(_diagnosisId: string): Promise<Problem[]> {
    return [];
  },

  async getDiagnosisSolutions(_diagnosisId: string): Promise<Solution[]> {
    return [];
  },

  async getSolutionServiceLinks(
    _solutionId: string,
  ): Promise<SolutionServiceLink[]> {
    return [];
  },

  async getProposals(): Promise<PaginatedResponse<Proposal>> {
    return { items: [], total: 0, page: 1, pageSize: 20 };
  },

  async listProposals(): Promise<PaginatedResponse<Proposal>> {
    return crmService.getProposals();
  },

  async listProposalsByOpportunity(
    _opportunityId: string,
  ): Promise<Proposal[]> {
    return [];
  },

  async getProposal(_id: string): Promise<Proposal | null> {
    return null;
  },

  async createProposal(_input: Partial<Proposal>): Promise<Proposal | null> {
    return null;
  },

  async updateProposal(
    _id: string,
    _input: Partial<Proposal>,
  ): Promise<Proposal | null> {
    return null;
  },

  async listProjects(): Promise<PaginatedResponse<Project>> {
    return { items: [], total: 0, page: 1, pageSize: 20 };
  },

  async getProject(_id: string): Promise<Project | null> {
    return null;
  },

  async createProjectFromProposal(
    _proposalId: string,
  ): Promise<Project | null> {
    return null;
  },

  async listInteractions(_leadId?: string): Promise<Interaction[]> {
    return [];
  },

  async listActivities(_filters?: {
    opportunityId?: string;
    leadId?: string;
    organizationId?: string;
  }): Promise<Activity[]> {
    return [];
  },

  async createActivity(_input: Partial<Activity>): Promise<Activity | null> {
    return null;
  },

  async updateActivity(
    _id: string,
    _input: Partial<Activity>,
  ): Promise<Activity | null> {
    return null;
  },

  async listLossReasons(): Promise<LossReason[]> {
    return DEFAULT_LOSS_REASONS;
  },
};
