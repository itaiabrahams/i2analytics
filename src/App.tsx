import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LandingPage from "./pages/LandingPage";
import PendingApproval from "./pages/PendingApproval";
import CoachDashboard from "./pages/CoachDashboard";
import PlayerProfile from "./pages/PlayerProfile";
import SessionDetail from "./pages/SessionDetail";
import NewSession from "./pages/NewSession";
import UserManagement from "./pages/UserManagement";
import ShotTracker from "./pages/ShotTracker";
import ChallengesPage from "./pages/ChallengesPage";
import Leaderboard from "./pages/Leaderboard";
import TeamCoachFeedback from "./pages/TeamCoachFeedback";
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
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/team-feedback/:token" element={<TeamCoachFeedback />} />
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </BrowserRouter>
    );
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
        <Route path="/player/:playerId/shots" element={<ShotTracker />} />
        <Route path="/shots" element={<ShotTracker />} />
        <Route path="/manage-users" element={<UserManagement />} />
        <Route path="/challenges" element={<ChallengesPage />} />
        <Route path="/player/:playerId/challenges" element={<ChallengesPage />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/team-feedback/:token" element={<TeamCoachFeedback />} />
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
