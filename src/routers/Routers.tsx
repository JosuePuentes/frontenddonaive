import { Route, Routes } from "react-router";
import { Layout } from "@/components/layout/Layout";
import Home from "@/pages/Home";

const AppRouter = () => (
  <Routes>
    <Route element={<Layout />}>
      <Route path="/" element={<Home />} />
    </Route>
  </Routes>
);

export default AppRouter;
