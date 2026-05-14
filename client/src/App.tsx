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
import WMSObservability from "./pages/WMSObservability";
import FleetOps from "./pages/FleetOps";
import Dispatch from "./pages/Dispatch";
import CrewHOS from "./pages/CrewHOS";
import CarSearch from "./pages/CarSearch";
import AIAssistant from "./pages/AIAssistant";
import AlertRules from "./pages/AlertRules";
import WatchRules from "./pages/WatchRules";
import CrossingMonitoring from "./pages/CrossingMonitoring";
function Router() {
  // make sure to consider if you need authentication for certain routes
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
      <Route path={"/wms"} component={WMSObservability} />
      <Route path={"/fleet"} component={FleetOps} />
      <Route path={"/dispatch"} component={Dispatch} />
      <Route path={"/crew"} component={CrewHOS} />
      <Route path={"/cars"} component={CarSearch} />
      <Route path={"/ai-assistant"} component={AIAssistant} />
      <Route path={"/alert-rules"} component={AlertRules} />
      <Route path={"/watch-rules"} component={WatchRules} />
      <Route path={"/crossings"} component={CrossingMonitoring} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable={true}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
