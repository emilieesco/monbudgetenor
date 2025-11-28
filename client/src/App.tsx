import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Auth from "@/pages/auth";
import Home from "@/pages/home";
import StudentJoin from "@/pages/student-join";
import TeacherSetup from "@/pages/teacher-setup";
import Dashboard from "@/pages/dashboard";
import Catalog from "@/pages/catalog";
import Admin from "@/pages/admin";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Auth} />
      <Route path="/student-join" component={StudentJoin} />
      <Route path="/teacher-setup" component={TeacherSetup} />
      <Route path="/teacher/:classId" component={Home} />
      <Route path="/admin/:classId" component={Admin} />
      <Route path="/student/:studentId" component={Dashboard} />
      <Route path="/student/:studentId/catalog" component={Catalog} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
