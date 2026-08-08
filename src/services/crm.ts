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
import type { PaginatedResponse } from "@/types/api";

/**
 * CRM service scaffold.
 * Typed stubs only — no HTTP, fetch, or persistence.
 */
export const crmService = {
  async listLeads(): Promise<PaginatedResponse<Lead>> {
    return { items: [], total: 0, page: 1, pageSize: 20 };
  },

  async getLead(_id: string): Promise<Lead | null> {
    return null;
  },

  async listOpportunities(): Promise<PaginatedResponse<Opportunity>> {
    return { items: [], total: 0, page: 1, pageSize: 20 };
  },

  async listOrganizations(): Promise<PaginatedResponse<Organization>> {
    return { items: [], total: 0, page: 1, pageSize: 20 };
  },

  async listDiagnoses(): Promise<PaginatedResponse<Diagnosis>> {
    return { items: [], total: 0, page: 1, pageSize: 20 };
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

  async getProposals(): Promise<PaginatedResponse<Proposal>> {
    return { items: [], total: 0, page: 1, pageSize: 20 };
  },

  /** Alias tipado — mantiene compatibilidad con listProposals. */
  async listProposals(): Promise<PaginatedResponse<Proposal>> {
    return crmService.getProposals();
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

  async listInteractions(_leadId?: string): Promise<Interaction[]> {
    return [];
  },
};
