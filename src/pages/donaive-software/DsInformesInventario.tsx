import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";
import DsRequirePermission from "@/components/donaive-software/DsRequirePermission";
import DsPlaceholder from "@/pages/donaive-software/DsPlaceholder";

export default function DsInformesInventario() {
  const r = getDonaiveSoftwareRoutes();
  return (
    <DsRequirePermission permission="reports.read">
      <DsPlaceholder
        title="Informe de inventario"
        modulePath={r.informes}
        moduleLabel="Informes"
        blurb="Valorizado a CPP y existencias por depósito."
      />
    </DsRequirePermission>
  );
}
