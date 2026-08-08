import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { EmptyState } from "@/components/page/EmptyState";

const Cases = () => {
  return (
    <DashboardPage
      title="Casos de éxito"
      description="Espacio reservado. No se inventan casos ni resultados."
    >
      <EmptyState
        title="Sin casos publicados"
        description="Cuando existan casos reales autorizados, se gestionarán desde este módulo."
      />
    </DashboardPage>
  );
};

export default Cases;
