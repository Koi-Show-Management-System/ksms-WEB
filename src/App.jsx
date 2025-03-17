import { Router } from "./routes/sections";
import { HelmetProvider } from 'react-helmet-async';

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
