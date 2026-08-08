import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { Widget } from "@/components/dashboard/widgets/Widget";
import { EmptyState } from "@/components/page/EmptyState";

const Academy = () => {
  return (
    <DashboardPage
      title="Academy"
      description="Módulo administrativo para la futura Academia Donaive."
    >
      <Widget title="Programas" description="Contenido formativo pendiente.">
        <EmptyState
          title="Sin programas"
          description="Este módulo está preparado para gestionar formación más adelante."
        />
      </Widget>
    </DashboardPage>
  );
};

export default Academy;
