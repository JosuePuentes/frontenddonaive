import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { DiagnosisFormShell } from "@/modules/private/crm/components/DiagnosisFormShell";
import { EmptyState } from "@/components/page/EmptyState";

const CrmDiagnostics = () => {
  return (
    <DashboardPage
      title="Diagnósticos"
      description="Estructura conceptual para registrar problemas observados, causas, impacto y solución propuesta."
    >
      <DiagnosisFormShell />
      <EmptyState
        className="mt-6"
        title="Sin diagnósticos guardados"
        description="La lógica y persistencia se implementarán cuando exista backend."
      />
    </DashboardPage>
  );
};

export default CrmDiagnostics;
