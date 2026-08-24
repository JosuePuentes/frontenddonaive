import DsRequirePermission from "@/components/donaive-software/DsRequirePermission";
import DsPlaceholder from "@/pages/donaive-software/DsPlaceholder";
import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";

export default function DsComprasNueva() {
  const routes = getDonaiveSoftwareRoutes();
  return (
    <DsRequirePermission permission="purchases.create">
      <DsPlaceholder
        title="Nueva compra"
        modulePath={routes.compras}
        moduleLabel="Compras"
        blurb="Registrar factura de proveedor con tasa Bs, impuestos repartibles y actualización de CPP."
      />
    </DsRequirePermission>
  );
}
