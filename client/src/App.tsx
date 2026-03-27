import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Auth from "@/pages/auth";
import Home from "@/pages/home";
import StudentJoin from "@/pages/student-join";
import StudentWelcome from "@/pages/student-welcome";
import StudentSetup from "@/pages/student-setup";
import TeacherSetup from "@/pages/teacher-setup";
import TeacherDashboard from "@/pages/teacher-dashboard";
import Dashboard from "@/pages/dashboard";
import Catalog from "@/pages/catalog";
import Admin from "@/pages/admin";
import AdminPanel from "@/pages/admin-panel";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/auth" component={Auth} />
      <Route path="/student-join" component={StudentJoin} />
      <Route path="/student/welcome" component={StudentWelcome} />
      <Route path="/student/setup" component={StudentSetup} />
      <Route path="/teacher-setup" component={TeacherSetup} />
      <Route path="/teacher/:classId" component={TeacherDashboard} />
      <Route path="/admin/:classId" component={Admin} />
      <Route path="/admin-panel" component={AdminPanel} />
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
