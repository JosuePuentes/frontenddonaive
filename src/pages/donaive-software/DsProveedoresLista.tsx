import DsRequirePermission from "@/components/donaive-software/DsRequirePermission";
import DsPlaceholder from "@/pages/donaive-software/DsPlaceholder";
import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";

export default function DsProveedoresLista() {
  const routes = getDonaiveSoftwareRoutes();
  return (
    <DsRequirePermission permission="suppliers.manage">
      <DsPlaceholder
        title="Directorio de proveedores"
        modulePath={routes.proveedores}
        moduleLabel="Proveedores"
        blurb="Proveedores, condiciones y cuentas por pagar pendientes."
      />
    </DsRequirePermission>
  );
}
