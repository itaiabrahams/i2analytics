import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import PendingApproval from "./pages/PendingApproval";
import CoachDashboard from "./pages/CoachDashboard";
import PlayerProfile from "./pages/PlayerProfile";
import SessionDetail from "./pages/SessionDetail";
import NewSession from "./pages/NewSession";
import UserManagement from "./pages/UserManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { role, loading, isApproved } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-accent animate-pulse">
            <span className="text-2xl font-black text-accent-foreground">I²</span>
          </div>
          <p className="text-muted-foreground">טוען...</p>
        </div>
      </div>
    );
  }

  if (!role) {
    return <LoginPage />;
  }

  if (!isApproved) {
    return <PendingApproval />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={role === 'coach' ? <CoachDashboard /> : <PlayerProfile />} />
        <Route path="/player/:playerId" element={<PlayerProfile />} />
        <Route path="/player/:playerId/new-session" element={<NewSession />} />
        <Route path="/session/:sessionId" element={<SessionDetail />} />
        <Route path="/manage-users" element={<UserManagement />} />
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
