import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/sidebar";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import SendEmail from "@/pages/SendEmail";
import Templates from "@/pages/Templates";
import SmtpConfig from "@/pages/SmtpConfig";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/email" component={SendEmail} />
      <Route path="/templates" component={Templates} />
      <Route path="/smtp" component={SmtpConfig} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="flex h-screen overflow-hidden bg-gray-50">
          <Sidebar />
          <div className="flex-1 overflow-auto">
            <Router />
          </div>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
