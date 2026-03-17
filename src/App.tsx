import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
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
import BasicPlayerNav from "./components/BasicPlayerNav";
import CourtIQPage from "./pages/CourtIQPage";
import CourtIQLeaderboardPage from "./pages/CourtIQLeaderboardPage";
import CourtIQProfilePage from "./pages/CourtIQProfilePage";
import CourtIQAdminPage from "./pages/CourtIQAdminPage";
import AdminTasksPage from "./pages/AdminTasksPage";
import RoleSwitcher from "./components/RoleSwitcher";
import WorkoutPlansPage from "./pages/WorkoutPlansPage";
import FloatingLogo from "./components/FloatingLogo";
import MobileTopBar from "./components/MobileTopBar";

const queryClient = new QueryClient();

const LegacyShotTrackerRedirect = () => {
  const location = useLocation();
  const { playerId } = useParams();
  const queryPlayerId = new URLSearchParams(location.search).get('player');
  const targetPlayerId = playerId ?? queryPlayerId;

  if (targetPlayerId) {
    return <Navigate to={`/player/${targetPlayerId}/shots`} replace />;
  }

  return <ShotTracker />;
};

const AppRoutes = () => {
  const { role, loading, isApproved, profile } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-accent animate-pulse">
            <span className="text-2xl font-black text-accent-foreground">I2</span>
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

  const isBasicPlayer = role === 'player' && profile?.subscription_tier === 'basic';

  return (
    <BrowserRouter>
      <MobileTopBar />
      <FloatingLogo />
      <RoleSwitcher />
      <Routes>
        {isBasicPlayer ? (
          <>
            <Route path="/" element={<><BasicPlayerNav /><div className="pt-14 pb-20"><ShotTracker /></div></>} />
            <Route path="/shots" element={<><BasicPlayerNav /><div className="pt-14 pb-20"><ShotTracker /></div></>} />
            <Route path="/shot-tracker" element={<><BasicPlayerNav /><div className="pt-14 pb-20"><ShotTracker /></div></>} />
            <Route path="/shot-tracker/*" element={<><BasicPlayerNav /><div className="pt-14 pb-20"><ShotTracker /></div></>} />
            <Route path="/challenges" element={<><BasicPlayerNav /><div className="pt-14 pb-20"><ChallengesPage /></div></>} />
            <Route path="/leaderboard" element={<><BasicPlayerNav /><div className="pt-14 pb-20"><Leaderboard /></div></>} />
            <Route path="/courtiq" element={<><BasicPlayerNav /><div className="pt-14 pb-20"><CourtIQPage /></div></>} />
            <Route path="/workout-plans" element={<><BasicPlayerNav /><div className="pt-14 pb-20"><WorkoutPlansPage /></div></>} />
            <Route path="/courtiq/leaderboard" element={<><BasicPlayerNav /><div className="pt-14 pb-20"><CourtIQLeaderboardPage /></div></>} />
            <Route path="/courtiq/profile" element={<><BasicPlayerNav /><div className="pt-14 pb-20"><CourtIQProfilePage /></div></>} />
            <Route path="/team-feedback/:token" element={<TeamCoachFeedback />} />
            <Route path="*" element={<><BasicPlayerNav /><div className="pt-14 pb-20"><ShotTracker /></div></>} />
          </>
        ) : (
          <>
            <Route path="/" element={role === 'coach' ? <CoachDashboard /> : <PlayerProfile />} />
            <Route path="/player/:playerId" element={<PlayerProfile />} />
            <Route path="/player/:playerId/new-session" element={<NewSession />} />
            <Route path="/session/:sessionId" element={<SessionDetail />} />
            <Route path="/player/:playerId/shots" element={<ShotTracker />} />
            <Route path="/player/:playerId/*" element={<PlayerProfile />} />
            <Route path="/shot-tracker" element={<LegacyShotTrackerRedirect />} />
            <Route path="/shot-tracker/*" element={<LegacyShotTrackerRedirect />} />
            <Route path="/shot-tracker/:playerId" element={<LegacyShotTrackerRedirect />} />
            <Route path="/shot-tracker/:playerId/*" element={<LegacyShotTrackerRedirect />} />
            <Route path="/shots" element={<ShotTracker />} />
            <Route path="/manage-users" element={<UserManagement />} />
            <Route path="/challenges" element={<ChallengesPage />} />
            <Route path="/player/:playerId/challenges" element={<ChallengesPage />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/courtiq" element={<CourtIQPage />} />
            <Route path="/courtiq/leaderboard" element={<CourtIQLeaderboardPage />} />
            <Route path="/courtiq/profile" element={<CourtIQProfilePage />} />
            <Route path="/courtiq/admin" element={<CourtIQAdminPage />} />
            <Route path="/workout-plans" element={<WorkoutPlansPage />} />
            <Route path="/admin-tasks" element={<AdminTasksPage />} />
            <Route path="/team-feedback/:token" element={<TeamCoachFeedback />} />
            <Route path="*" element={<NotFound />} />
          </>
        )}
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
