import { Card } from "@/components/ui/Card";
import type { Proposal } from "@/types/proposal";

type ProposalSummaryProps = {
  proposal: Proposal;
};

function ProposalSummary({ proposal }: ProposalSummaryProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card variant="default" className="space-y-2">
        <h3 className="text-base font-semibold">Problema</h3>
        <p className="text-body-small text-muted-foreground">
          {proposal.problemSummary ??
            "Aquí se mostrará el problema comprendido a partir del diagnóstico."}
        </p>
      </Card>
      <Card variant="default" className="space-y-2">
        <h3 className="text-base font-semibold">Solución</h3>
        <p className="text-body-small text-muted-foreground">
          {proposal.solutionSummary ??
            "Aquí se mostrará la solución propuesta y el enfoque Donaive."}
        </p>
      </Card>
      <Card variant="outline" className="space-y-2 lg:col-span-2">
        <h3 className="text-base font-semibold">Comprensión</h3>
        <p className="text-body-small text-muted-foreground">
          {proposal.summary ??
            "Resumen ejecutivo que conecta el diagnóstico con el alcance comercial."}
        </p>
      </Card>
    </div>
  );
}

export { ProposalSummary };
export type { ProposalSummaryProps };
