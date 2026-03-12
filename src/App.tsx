import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import CoachDashboard from "./pages/CoachDashboard";
import PlayerProfile from "./pages/PlayerProfile";
import SessionDetail from "./pages/SessionDetail";
import NewSession from "./pages/NewSession";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { auth } = useAuth();

  if (!auth.role) {
    return <LoginPage />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={auth.role === 'coach' ? <CoachDashboard /> : <PlayerProfile />} />
        <Route path="/player/:playerId" element={<PlayerProfile />} />
        <Route path="/player/:playerId/new-session" element={<NewSession />} />
        <Route path="/session/:sessionId" element={<SessionDetail />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
