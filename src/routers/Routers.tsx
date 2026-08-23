import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router";
import { Layout } from "@/components/layout/Layout";
import { DashboardLayout } from "@/components/dashboard/layout/DashboardLayout";
import { PolisurLayout } from "@/components/polisur/PolisurLayout";
import { PageLoader } from "@/components/page/PageLoader";
import { ROUTES } from "@/constants/routes";
import { DASHBOARD_ROUTES } from "@/constants/dashboard-routes";
import { isPolisurHost } from "@/lib/polisur-host";
import { isAdLicoreriaHost } from "@/lib/ad-licoreria-host";
import { isDonaiveSoftwareHost } from "@/lib/donaive-software-host";
import { polisurRouteTree } from "@/routers/PolisurRouteTree";
import { adLicoreriaRouteTree } from "@/routers/AdLicoreriaRouteTree";
import { donaiveSoftwareRouteTree } from "@/routers/DonaiveSoftwareRouteTree";
import { AdLicoreriaLayout } from "@/components/ad-licoreria/AdLicoreriaLayout";
import { DonaiveSoftwareLayout } from "@/components/donaive-software/DonaiveSoftwareLayout";

const Home = lazy(() => import("@/pages/Home"));
const Empresa = lazy(() => import("@/pages/Empresa"));
const Soluciones = lazy(() => import("@/pages/Soluciones"));
const Academy = lazy(() => import("@/pages/Academy"));
const Media = lazy(() => import("@/pages/Media"));
const Blog = lazy(() => import("@/pages/Blog"));
const Contacto = lazy(() => import("@/pages/Contacto"));
const Privacidad = lazy(() => import("@/pages/Privacidad"));
const Terminos = lazy(() => import("@/pages/Terminos"));
const Diagnostico = lazy(() => import("@/pages/Diagnostico"));
const ProyectosDiagnostico = lazy(
  () => import("@/pages/ProyectosDiagnostico"),
);

const Dashboard = lazy(() => import("@/pages/dashboard/Dashboard"));
const Users = lazy(() => import("@/pages/dashboard/Users"));
const Roles = lazy(() => import("@/pages/dashboard/Roles"));
const DashboardBlog = lazy(() => import("@/pages/dashboard/Blog"));
const DashboardAcademy = lazy(() => import("@/pages/dashboard/Academy"));
const DashboardMedia = lazy(() => import("@/pages/dashboard/Media"));
const Products = lazy(() => import("@/pages/dashboard/Products"));
const Services = lazy(() => import("@/pages/dashboard/Services"));
const ServiceNew = lazy(() => import("@/pages/dashboard/ServiceNew"));
const ServiceDetail = lazy(() => import("@/pages/dashboard/ServiceDetail"));
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
const CrmDiagnosisNew = lazy(
  () => import("@/modules/private/crm/pages/CrmDiagnosisNew"),
);
const CrmDiagnosisDetail = lazy(
  () => import("@/modules/private/crm/pages/CrmDiagnosisDetail"),
);
const CrmProposals = lazy(
  () => import("@/modules/private/crm/pages/CrmProposals"),
);
const CrmProposalNew = lazy(
  () => import("@/modules/private/crm/pages/CrmProposalNew"),
);
const CrmProposalDetail = lazy(
  () => import("@/modules/private/crm/pages/CrmProposalDetail"),
);
const CrmProjects = lazy(
  () => import("@/modules/private/crm/pages/CrmProjects"),
);
const PolisurPreinscripciones = lazy(
  () => import("@/pages/dashboard/PolisurPreinscripciones"),
);

const AppRouter = () => {
  const onPolisurDomain = isPolisurHost();
  const onAdLicoreriaDomain = isAdLicoreriaHost();
  const onDonaiveSoftwareDomain = isDonaiveSoftwareHost();
  const showDonaiveShell =
    !onPolisurDomain && !onAdLicoreriaDomain && !onDonaiveSoftwareDomain;

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {showDonaiveShell ? (
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
            <Route path="/diagnostico" element={<Diagnostico />} />
            <Route
              path="/diagnostico/proyectos"
              element={<ProyectosDiagnostico />}
            />
          </Route>
        ) : null}

        {/* POLISUR — dominio propio (/) + namespace /polisur en Donaive */}
        {!onAdLicoreriaDomain && !onDonaiveSoftwareDomain ? (
          <Route element={<PolisurLayout />}>
            {onPolisurDomain ? polisurRouteTree("") : null}
            {polisurRouteTree("/polisur")}
          </Route>
        ) : null}

        {/* A&D Licorería — /licoreria ahora; raíz cuando exista dominio propio */}
        {!onPolisurDomain && !onDonaiveSoftwareDomain ? (
          <Route element={<AdLicoreriaLayout />}>
            {onAdLicoreriaDomain ? adLicoreriaRouteTree("") : null}
            {adLicoreriaRouteTree("/licoreria")}
          </Route>
        ) : null}

        {/* Donaive Software — /software en Donaive; raíz en host propio */}
        {!onPolisurDomain && !onAdLicoreriaDomain ? (
          <Route element={<DonaiveSoftwareLayout />}>
            {onDonaiveSoftwareDomain ? donaiveSoftwareRouteTree("") : null}
            {donaiveSoftwareRouteTree("/software")}
          </Route>
        ) : null}

        {showDonaiveShell ? (
          <Route element={<DashboardLayout />}>
            <Route path={DASHBOARD_ROUTES.root} element={<Dashboard />} />
            <Route path={DASHBOARD_ROUTES.usuarios} element={<Users />} />
            <Route path={DASHBOARD_ROUTES.roles} element={<Roles />} />
            <Route path={DASHBOARD_ROUTES.blog} element={<DashboardBlog />} />
            <Route
              path={DASHBOARD_ROUTES.academy}
              element={<DashboardAcademy />}
            />
            <Route path={DASHBOARD_ROUTES.media} element={<DashboardMedia />} />
            <Route path={DASHBOARD_ROUTES.productos} element={<Products />} />
            <Route
              path={DASHBOARD_ROUTES.servicioNuevo}
              element={<ServiceNew />}
            />
            <Route
              path={DASHBOARD_ROUTES.servicioDetail}
              element={<ServiceDetail />}
            />
            <Route path={DASHBOARD_ROUTES.servicios} element={<Services />} />
            <Route path={DASHBOARD_ROUTES.casos} element={<Cases />} />
            <Route path={DASHBOARD_ROUTES.archivos} element={<Files />} />
            <Route
              path={DASHBOARD_ROUTES.configuracion}
              element={<Settings />}
            />
            <Route path={DASHBOARD_ROUTES.perfil} element={<Profile />} />

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
              path={DASHBOARD_ROUTES.crmDiagnosticoNuevo}
              element={<CrmDiagnosisNew />}
            />
            <Route
              path={DASHBOARD_ROUTES.crmDiagnosticoDetail}
              element={<CrmDiagnosisDetail />}
            />
            <Route
              path={DASHBOARD_ROUTES.crmDiagnosticos}
              element={<CrmDiagnostics />}
            />
            <Route
              path={DASHBOARD_ROUTES.crmPropuestaNueva}
              element={<CrmProposalNew />}
            />
            <Route
              path={DASHBOARD_ROUTES.crmPropuestaDetail}
              element={<CrmProposalDetail />}
            />
            <Route
              path={DASHBOARD_ROUTES.crmPropuestas}
              element={<CrmProposals />}
            />
            <Route
              path={DASHBOARD_ROUTES.crmProyectos}
              element={<CrmProjects />}
            />
            <Route
              path={DASHBOARD_ROUTES.polisurPreinscripciones}
              element={<PolisurPreinscripciones />}
            />
          </Route>
        ) : null}
      </Routes>
    </Suspense>
  );
};

export default AppRouter;
