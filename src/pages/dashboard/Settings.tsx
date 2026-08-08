import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { FormActions } from "@/components/dashboard/forms/FormActions";
import { FormField } from "@/components/dashboard/forms/FormField";
import { FormSection } from "@/components/dashboard/forms/FormSection";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";

const Settings = () => {
  return (
    <DashboardPage
      title="Configuración"
      description="Ajustes generales del panel. Formulario visual sin persistencia."
    >
      <FormSection
        title="Organización"
        description="Campos preparados para futura configuración."
      >
        <FormField label="Nombre de la organización" htmlFor="org-name">
          <Input
            id="org-name"
            placeholder="Donaive"
            disabled
            aria-disabled="true"
          />
        </FormField>
        <FormField
          label="Zona horaria"
          htmlFor="timezone"
          hint="La persistencia se conectará con backend más adelante."
        >
          <Input
            id="timezone"
            placeholder="America/Caracas"
            disabled
            aria-disabled="true"
          />
        </FormField>
        <FormActions>
          <Button type="button" variant="outline" disabled>
            Cancelar
          </Button>
          <Button type="button" disabled>
            Guardar
          </Button>
        </FormActions>
      </FormSection>
    </DashboardPage>
  );
};

export default Settings;
