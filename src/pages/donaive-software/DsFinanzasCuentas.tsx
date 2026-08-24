import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";
import DsRequirePermission from "@/components/donaive-software/DsRequirePermission";
import DsPlaceholder from "@/pages/donaive-software/DsPlaceholder";

export default function DsFinanzasCuentas() {
  const r = getDonaiveSoftwareRoutes();
  return (
    <DsRequirePermission permission="finance.accounts">
      <DsPlaceholder
        title="Cuentas"
        modulePath={r.finanzas}
        moduleLabel="Finanzas"
        blurb="Cuentas por cobrar y pagar del negocio."
      />
    </DsRequirePermission>
  );
}
