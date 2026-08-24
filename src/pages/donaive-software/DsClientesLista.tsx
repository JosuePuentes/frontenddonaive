import DsRequirePermission from "@/components/donaive-software/DsRequirePermission";
import DsPlaceholder from "@/pages/donaive-software/DsPlaceholder";
import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";

export default function DsClientesLista() {
  const routes = getDonaiveSoftwareRoutes();
  return (
    <DsRequirePermission permission="clients.read">
      <DsPlaceholder
        title="Directorio de clientes"
        modulePath={routes.clientes}
        moduleLabel="Clientes"
        blurb="Ficha de clientes, límites de crédito y saldos por cobrar."
      />
    </DsRequirePermission>
  );
}
