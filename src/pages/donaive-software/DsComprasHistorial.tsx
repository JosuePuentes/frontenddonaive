import DsRequirePermission from "@/components/donaive-software/DsRequirePermission";
import DsPlaceholder from "@/pages/donaive-software/DsPlaceholder";
import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";

export default function DsComprasHistorial() {
  const routes = getDonaiveSoftwareRoutes();
  return (
    <DsRequirePermission permission="purchases.manage">
      <DsPlaceholder
        title="Historial de compras"
        modulePath={routes.compras}
        moduleLabel="Compras"
        blurb="Listado de compras, estados y vínculo con inventario y cuentas por pagar."
      />
    </DsRequirePermission>
  );
}
