import { useState } from "react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/page/EmptyState";
import { DiagnosisHeader } from "@/modules/private/crm/components/diagnosis/DiagnosisHeader";
import { DiagnosisProgress } from "@/modules/private/crm/components/diagnosis/DiagnosisProgress";
import { DiagnosisSummary } from "@/modules/private/crm/components/diagnosis/DiagnosisSummary";
import { ObservationList } from "@/modules/private/crm/components/diagnosis/ObservationList";
import { ProblemCard } from "@/modules/private/crm/components/diagnosis/ProblemCard";
import { RootCauseCard } from "@/modules/private/crm/components/diagnosis/RootCauseCard";
import { ImpactCard } from "@/modules/private/crm/components/diagnosis/ImpactCard";
import { ProcessFlow } from "@/modules/private/crm/components/diagnosis/ProcessFlow";
import { AutomationOpportunityCard } from "@/modules/private/crm/components/diagnosis/AutomationOpportunityCard";
import { SolutionCard } from "@/modules/private/crm/components/diagnosis/SolutionCard";
import { RecommendationList } from "@/modules/private/crm/components/diagnosis/RecommendationList";
import type {
  AutomationOpportunity,
  CurrentProcessStep,
  Diagnosis,
  DiagnosisViewTabKey,
  Impact,
  Observation,
  Problem,
  ProposedProcessStep,
  Recommendation,
  RootCause,
  Solution,
} from "@/types/diagnosis";
import { DIAGNOSIS_VIEW_TABS } from "@/types/diagnosis";

type DiagnosisViewProps = {
  diagnosis: Diagnosis;
  observations?: Observation[];
  problems?: Problem[];
  causes?: RootCause[];
  impacts?: Impact[];
  currentProcess?: CurrentProcessStep[];
  proposedProcess?: ProposedProcessStep[];
  automations?: AutomationOpportunity[];
  solutions?: Solution[];
  recommendations?: Recommendation[];
};

function DiagnosisView({
  diagnosis,
  observations = [],
  problems = [],
  causes = [],
  impacts = [],
  currentProcess = [],
  proposedProcess = [],
  automations = [],
  solutions = [],
  recommendations = [],
}: DiagnosisViewProps) {
  const [tab, setTab] = useState<DiagnosisViewTabKey>("summary");

  return (
    <div className="space-y-6">
      <DiagnosisHeader diagnosis={diagnosis} />
      <DiagnosisProgress activeStage={2} />

      <div
        className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1"
        role="tablist"
        aria-label="Secciones del diagnóstico"
      >
        {DIAGNOSIS_VIEW_TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            className={cn(
              "shrink-0 rounded-[var(--radius-md)] px-3 py-2 text-caption font-medium transition-colors",
              tab === item.key
                ? "bg-primary text-primary-foreground"
                : "bg-surface-muted text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="min-h-[200px]">
        {tab === "summary" ? (
          <DiagnosisSummary
            diagnosis={diagnosis}
            observationCount={observations.length}
            problemCount={problems.length}
            causeCount={causes.length}
            impactCount={impacts.length}
            recommendationCount={recommendations.length}
          />
        ) : null}

        {tab === "observations" ? (
          <ObservationList observations={observations} />
        ) : null}

        {tab === "problems" ? (
          problems.length === 0 ? (
            <EmptyState
              title="Sin problemas registrados"
              description="Los problemas detectados se listarán aquí."
            />
          ) : (
            <div className="grid gap-3">
              {problems.map((problem) => (
                <ProblemCard key={problem.id} problem={problem} />
              ))}
            </div>
          )
        ) : null}

        {tab === "causes" ? (
          causes.length === 0 ? (
            <EmptyState
              title="Sin causas registradas"
              description="Diferencie observado, inferido y por validar."
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {causes.map((cause) => (
                <RootCauseCard key={cause.id} cause={cause} />
              ))}
            </div>
          )
        ) : null}

        {tab === "impacts" ? (
          impacts.length === 0 ? (
            <EmptyState
              title="Sin impactos registrados"
              description="No se inventan valores estimados."
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {impacts.map((impact) => (
                <ImpactCard key={impact.id} impact={impact} />
              ))}
            </div>
          )
        ) : null}

        {tab === "process" ? (
          <div className="space-y-8">
            <ProcessFlow variant="current" steps={currentProcess} />
            <ProcessFlow variant="proposed" steps={proposedProcess} />
          </div>
        ) : null}

        {tab === "automation" ? (
          automations.length === 0 ? (
            <EmptyState
              title="Sin oportunidades de automatización"
              description="Scaffolding visual — sin automatizaciones reales."
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {automations.map((item) => (
                <AutomationOpportunityCard key={item.id} item={item} />
              ))}
            </div>
          )
        ) : null}

        {tab === "solution" ? (
          solutions.length === 0 ? (
            <EmptyState
              title="Sin solución propuesta"
              description="La solución estructurada se mostrará aquí."
            />
          ) : (
            <div className="grid gap-3">
              {solutions.map((solution) => (
                <SolutionCard key={solution.id} solution={solution} />
              ))}
            </div>
          )
        ) : null}

        {tab === "recommendations" ? (
          <RecommendationList recommendations={recommendations} />
        ) : null}
      </div>
    </div>
  );
}

export { DiagnosisView };
export type { DiagnosisViewProps };
