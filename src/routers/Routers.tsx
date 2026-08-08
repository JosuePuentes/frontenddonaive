import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router";
import { Layout } from "@/components/layout/Layout";
import { PageLoader } from "@/components/page/PageLoader";
import { ROUTES } from "@/constants/routes";

const Home = lazy(() => import("@/pages/Home"));
const Empresa = lazy(() => import("@/pages/Empresa"));
const Soluciones = lazy(() => import("@/pages/Soluciones"));
const Academy = lazy(() => import("@/pages/Academy"));
const Media = lazy(() => import("@/pages/Media"));
const Blog = lazy(() => import("@/pages/Blog"));
const Contacto = lazy(() => import("@/pages/Contacto"));
const Privacidad = lazy(() => import("@/pages/Privacidad"));
const Terminos = lazy(() => import("@/pages/Terminos"));

const AppRouter = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
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
    </Routes>
  </Suspense>
);

export default AppRouter;
