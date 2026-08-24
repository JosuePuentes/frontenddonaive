import DsRequirePermission from "@/components/donaive-software/DsRequirePermission";
import DsPlaceholder from "@/pages/donaive-software/DsPlaceholder";
import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";

export default function DsAnalisisCompras() {
  const routes = getDonaiveSoftwareRoutes();
  return (
    <DsRequirePermission permission="analysis.view">
      <DsPlaceholder
        title="Análisis de compras"
        modulePath={routes.analisis}
        moduleLabel="Análisis"
        blurb="Sugerencias de reposición según rotación, stock mínimo y ventas recientes."
      />
    </DsRequirePermission>
  );
}
