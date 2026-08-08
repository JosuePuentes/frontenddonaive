import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router";
import { Layout } from "@/components/layout/Layout";
import { DashboardLayout } from "@/components/dashboard/layout/DashboardLayout";
import { PageLoader } from "@/components/page/PageLoader";
import { ROUTES } from "@/constants/routes";
import { DASHBOARD_ROUTES } from "@/constants/dashboard-routes";

const Home = lazy(() => import("@/pages/Home"));
const Empresa = lazy(() => import("@/pages/Empresa"));
const Soluciones = lazy(() => import("@/pages/Soluciones"));
const Academy = lazy(() => import("@/pages/Academy"));
const Media = lazy(() => import("@/pages/Media"));
const Blog = lazy(() => import("@/pages/Blog"));
const Contacto = lazy(() => import("@/pages/Contacto"));
const Privacidad = lazy(() => import("@/pages/Privacidad"));
const Terminos = lazy(() => import("@/pages/Terminos"));

const Dashboard = lazy(() => import("@/pages/dashboard/Dashboard"));
const Users = lazy(() => import("@/pages/dashboard/Users"));
const Roles = lazy(() => import("@/pages/dashboard/Roles"));
const DashboardBlog = lazy(() => import("@/pages/dashboard/Blog"));
const DashboardAcademy = lazy(() => import("@/pages/dashboard/Academy"));
const DashboardMedia = lazy(() => import("@/pages/dashboard/Media"));
const Products = lazy(() => import("@/pages/dashboard/Products"));
const Services = lazy(() => import("@/pages/dashboard/Services"));
const Cases = lazy(() => import("@/pages/dashboard/Cases"));
const Files = lazy(() => import("@/pages/dashboard/Files"));
const Settings = lazy(() => import("@/pages/dashboard/Settings"));
const Profile = lazy(() => import("@/pages/dashboard/Profile"));

const CrmDashboard = lazy(
  () => import("@/modules/private/crm/pages/CrmDashboard"),
);
const CrmLeads = lazy(() => import("@/modules/private/crm/pages/CrmLeads"));
const CrmLeadDetail = lazy(
  () => import("@/modules/private/crm/pages/CrmLeadDetail"),
);
const CrmOpportunities = lazy(
  () => import("@/modules/private/crm/pages/CrmOpportunities"),
);
const CrmDiagnostics = lazy(
  () => import("@/modules/private/crm/pages/CrmDiagnostics"),
);
const CrmProposals = lazy(
  () => import("@/modules/private/crm/pages/CrmProposals"),
);
const CrmProjects = lazy(
  () => import("@/modules/private/crm/pages/CrmProjects"),
);

const AppRouter = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* Público */}
      <Route element={<Layout />}>
        <Route path={ROUTES.home} element={<Home />} />
        <Route path={ROUTES.empresa} element={<Empresa />} />
        <Route path={ROUTES.soluciones} element={<Soluciones />} />
        <Route path={ROUTES.academy} element={<Academy />} />
        <Route path={ROUTES.media} element={<Media />} />
        <Route path={ROUTES.blog} element={<Blog />} />
        <Route path={ROUTES.contacto} element={<Contacto />} />
        <Route path={ROUTES.privacidad} element={<Privacidad />} />
        <Route path={ROUTES.terminos} element={<Terminos />} />
      </Route>

      {/* Privado — scaffolding sin PrivateRoute funcional */}
      <Route element={<DashboardLayout />}>
        <Route path={DASHBOARD_ROUTES.root} element={<Dashboard />} />
        <Route path={DASHBOARD_ROUTES.usuarios} element={<Users />} />
        <Route path={DASHBOARD_ROUTES.roles} element={<Roles />} />
        <Route path={DASHBOARD_ROUTES.blog} element={<DashboardBlog />} />
        <Route path={DASHBOARD_ROUTES.academy} element={<DashboardAcademy />} />
        <Route path={DASHBOARD_ROUTES.media} element={<DashboardMedia />} />
        <Route path={DASHBOARD_ROUTES.productos} element={<Products />} />
        <Route path={DASHBOARD_ROUTES.servicios} element={<Services />} />
        <Route path={DASHBOARD_ROUTES.casos} element={<Cases />} />
        <Route path={DASHBOARD_ROUTES.archivos} element={<Files />} />
        <Route path={DASHBOARD_ROUTES.configuracion} element={<Settings />} />
        <Route path={DASHBOARD_ROUTES.perfil} element={<Profile />} />

        {/* CRM */}
        <Route path={DASHBOARD_ROUTES.crm} element={<CrmDashboard />} />
        <Route path={DASHBOARD_ROUTES.crmLeads} element={<CrmLeads />} />
        <Route
          path={DASHBOARD_ROUTES.crmLeadDetail}
          element={<CrmLeadDetail />}
        />
        <Route
          path={DASHBOARD_ROUTES.crmOportunidades}
          element={<CrmOpportunities />}
        />
        <Route
          path={DASHBOARD_ROUTES.crmDiagnosticos}
          element={<CrmDiagnostics />}
        />
        <Route
          path={DASHBOARD_ROUTES.crmPropuestas}
          element={<CrmProposals />}
        />
        <Route path={DASHBOARD_ROUTES.crmProyectos} element={<CrmProjects />} />
      </Route>
    </Routes>
  </Suspense>
);

export default AppRouter;
