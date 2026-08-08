import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { FormField } from "@/components/dashboard/forms/FormField";
import { FormSection } from "@/components/dashboard/forms/FormSection";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/input";

const Profile = () => {
  return (
    <DashboardPage
      title="Perfil"
      description="Perfil visual del área privada. Sin sesión real."
    >
      <FormSection
        title="Información de cuenta"
        description="Placeholder para datos de usuario autenticado."
      >
        <div className="flex items-center gap-2">
          <Badge variant="muted">Sin autenticación</Badge>
          <Badge variant="outline">Scaffold</Badge>
        </div>
        <FormField label="Nombre" htmlFor="profile-name">
          <Input id="profile-name" placeholder="Administrador" disabled />
        </FormField>
        <FormField label="Correo" htmlFor="profile-email">
          <Input
            id="profile-email"
            type="email"
            placeholder="admin@donaive.local"
            disabled
          />
        </FormField>
      </FormSection>
    </DashboardPage>
  );
};

export default Profile;
