/**
 * Shell legado reutilizado como atajo al wizard por etapas.
 * El flujo principal vive en DiagnosisWizardShell.
 */
import { DiagnosisWizardShell } from "@/modules/private/crm/components/diagnosis/DiagnosisWizardShell";

function DiagnosisFormShell() {
  return <DiagnosisWizardShell />;
}

export { DiagnosisFormShell };
