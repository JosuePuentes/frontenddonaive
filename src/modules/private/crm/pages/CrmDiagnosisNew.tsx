import { Link, useSearchParams } from "react-router";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { Button } from "@/components/ui/Button";
import { DASHBOARD_ROUTES } from "@/constants/dashboard-routes";
import { DiagnosisProgress } from "@/modules/private/crm/components/diagnosis/DiagnosisProgress";
import { DiagnosisWizardShell } from "@/modules/private/crm/components/diagnosis/DiagnosisWizardShell";

const CrmDiagnosisNew = () => {
  const [params] = useSearchParams();
  const leadId = params.get("leadId");

  return (
    <DashboardPage
      title="Nuevo diagnóstico"
      description="Formulario por etapas. Shell visual sin guardado ni envío."
      actions={
        <Button asChild variant="outline">
          <Link to={DASHBOARD_ROUTES.crmDiagnosticos}>Volver</Link>
        </Button>
      }
    >
      <DiagnosisProgress activeStage={0} className="mb-2" />
      <DiagnosisWizardShell leadId={leadId} />
    </DashboardPage>
  );
};

export default CrmDiagnosisNew;
