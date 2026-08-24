import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";
import DsRequirePermission from "@/components/donaive-software/DsRequirePermission";
import DsPlaceholder from "@/pages/donaive-software/DsPlaceholder";

export default function DsPosVender() {
  const r = getDonaiveSoftwareRoutes();
  return (
    <DsRequirePermission permission="pos.sell">
      <DsPlaceholder
        title="Vender"
        modulePath={r.pos}
        moduleLabel="Punto de venta"
        blurb="Cobro rápido con tasas BCV/protegida y pagos mixtos. Misma base monetaria que A&D."
      />
    </DsRequirePermission>
  );
}
