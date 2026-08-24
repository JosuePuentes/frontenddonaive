import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";
import DsRequirePermission from "@/components/donaive-software/DsRequirePermission";
import DsPlaceholder from "@/pages/donaive-software/DsPlaceholder";

export default function DsInventarioMovimientos() {
  const r = getDonaiveSoftwareRoutes();
  return (
    <DsRequirePermission permission="inventory.adjust">
      <DsPlaceholder
        title="Movimientos"
        modulePath={r.inventario}
        moduleLabel="Inventario"
        blurb="Kardex de entradas, salidas y ajustes. Las entradas alimentan el CPP."
      />
    </DsRequirePermission>
  );
}
