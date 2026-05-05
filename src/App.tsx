import "./App.css";
import AppRouter from "./routers/Routers";
import { UserProvider } from "@/context/UserContext";
import Navbar from "@/components/Navbar";
import { useLocation } from "react-router";
import { TravelpayoutsDriveScript } from "@/components/TravelpayoutsDriveScript";

function App() {
  const { pathname } = useLocation();
  const isSpiritRescueLanding = pathname === "/spirit-rescue";

  return (
    <UserProvider>
      <TravelpayoutsDriveScript />
      <div>
        {!isSpiritRescueLanding && <Navbar />}
        <AppRouter />
      </div>
    </UserProvider>
  );
}

export default App