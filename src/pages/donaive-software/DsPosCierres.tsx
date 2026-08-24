import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";
import DsRequirePermission from "@/components/donaive-software/DsRequirePermission";
import DsPlaceholder from "@/pages/donaive-software/DsPlaceholder";

export default function DsPosCierres() {
  const r = getDonaiveSoftwareRoutes();
  return (
    <DsRequirePermission permission="pos.closures">
      <DsPlaceholder
        title="Cierres"
        modulePath={r.pos}
        moduleLabel="Punto de venta"
        blurb="Cierre de turno y cuadre de caja por método de pago."
      />
    </DsRequirePermission>
  );
}
