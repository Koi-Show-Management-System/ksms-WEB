import { Router } from "./routes/sections";
import { HelmetProvider } from "react-helmet-async";
import DashboardLayout from "./layout/DashboardLayout";

function App() {
  return (
    <HelmetProvider>
      <div>
        <Router />
      </div>
    </HelmetProvider>
  );
}

export default App;
