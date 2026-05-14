import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import Incidents from "./pages/Incidents";
import Assets from "./pages/Assets";
import Traces from "./pages/Traces";
import Systems from "./pages/Systems";
import TrainJourney from "./pages/TrainJourney";
import WaysideIntel from "./pages/WaysideIntel";
import CommIntel from "./pages/CommIntel";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Dashboard} />
      <Route path={"/incidents"} component={Incidents} />
      <Route path={"/assets"} component={Assets} />
      <Route path={"/traces"} component={Traces} />
      <Route path={"/systems"} component={Systems} />
      <Route path={"/train/:id"} component={TrainJourney} />
      <Route path={"/train"} component={TrainJourney} />
      <Route path={"/wayside"} component={WaysideIntel} />
      <Route path={"/comms"} component={CommIntel} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
