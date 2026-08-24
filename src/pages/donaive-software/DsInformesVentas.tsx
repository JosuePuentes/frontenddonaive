import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";
import DsRequirePermission from "@/components/donaive-software/DsRequirePermission";
import DsPlaceholder from "@/pages/donaive-software/DsPlaceholder";

export default function DsInformesVentas() {
  const r = getDonaiveSoftwareRoutes();
  return (
    <DsRequirePermission permission="reports.read">
      <DsPlaceholder
        title="Informe de ventas"
        modulePath={r.informes}
        moduleLabel="Informes"
        blurb="Ventas por período, caja y método de pago."
      />
    </DsRequirePermission>
  );
}
