import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";
import DsPlaceholder from "@/pages/donaive-software/DsPlaceholder";

export default function DsInformesVentas() {
  const r = getDonaiveSoftwareRoutes();
  return (
    <DsPlaceholder
      title="Informe de ventas"
      modulePath={r.informes}
      moduleLabel="Informes"
      blurb="Ventas por período, caja y método de pago."
    />
  );
}
