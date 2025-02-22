import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import WorkPage from "@/pages/work";
import PassagePage from "@/pages/passage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/work/:id" component={WorkPage} />
      <Route path="/passage/:id" component={PassagePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;