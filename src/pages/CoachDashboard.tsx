import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, TrendingUp, TrendingDown, Minus, Users, Plus, Shield, Brain } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import { usePlayers, usePlayerSessionCounts } from '@/hooks/useSupabaseData';
import AddPlayerDialog from '@/components/AddPlayerDialog';

const CoachDashboard = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const { players, loading, refetch } = usePlayers();
  const sessionCounts = usePlayerSessionCounts();
  const [addPlayerOpen, setAddPlayerOpen] = useState(false);

  // Filter players: show coach's own players + demo players
  const myPlayers = players.filter(p => p.coach_id === user?.id || p.is_demo);

  const playerData = myPlayers.map(p => {
    const sc = sessionCounts[p.user_id] || { count: 0, avgScore: 0, latestScores: [] };
    let trend: 'up' | 'down' | 'neutral' = 'neutral';
    if (sc.latestScores.length >= 2) {
      trend = sc.latestScores[0] > sc.latestScores[1] ? 'up' : sc.latestScores[0] < sc.latestScores[1] ? 'down' : 'neutral';
    }
    return { ...p, sessionsCount: sc.count, avgScore: sc.avgScore, trend };
  });

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">טוען...</p></div>;
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">לוח בקרה</h1>
            <p className="text-muted-foreground">ניהול שחקנים וסשנים</p>
          </div>
          <div className="flex gap-3 items-center">
            <Button variant="outline" onClick={() => navigate('/manage-users')} className="text-muted-foreground">
              <Shield className="ml-2 h-4 w-4" />
              ניהול משתמשים
            </Button>
            <Button onClick={() => setAddPlayerOpen(true)} className="gradient-accent text-accent-foreground">
              <Plus className="ml-2 h-4 w-4" />
              הוסף שחקן
            </Button>
            <div className="flex items-center gap-2 rounded-lg bg-card px-4 py-2">
              <Users className="h-5 w-5 text-accent" />
              <span className="font-semibold text-foreground">{myPlayers.length} שחקנים</span>
            </div>
            <NotificationBell />
            <Button variant="ghost" onClick={logout} className="text-muted-foreground hover:text-foreground">
              <LogOut className="ml-2 h-4 w-4" />
              יציאה
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {playerData.map((p, i) => (
            <button
              key={p.id}
              onClick={() => navigate(`/player/${p.user_id}`)}
              className="gradient-card rounded-xl p-6 text-right transition-all hover:scale-[1.02] hover:shadow-lg animate-fade-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {p.is_demo && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent font-medium">דמו</span>
                  )}
                  {p.trend === 'up' && <TrendingUp className="h-5 w-5 text-success" />}
                  {p.trend === 'down' && <TrendingDown className="h-5 w-5 text-destructive" />}
                  {p.trend === 'neutral' && <Minus className="h-5 w-5 text-muted-foreground" />}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">{p.display_name}</h3>
                  <p className="text-sm text-muted-foreground">{p.position} · {p.team}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-6 justify-end">
                <div className="text-center">
                  <p className="text-2xl font-bold text-accent">{p.avgScore.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">ציון ממוצע</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{p.sessionsCount}</p>
                  <p className="text-xs text-muted-foreground">סשנים</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{p.age ?? '-'}</p>
                  <p className="text-xs text-muted-foreground">גיל</p>
                </div>
              </div>
            </button>
          ))}
          {myPlayers.length === 0 && (
            <div className="gradient-card rounded-xl p-8 text-center col-span-2">
              <p className="text-muted-foreground">אין שחקנים עדיין. לחץ על "הוסף שחקן" כדי להוסיף שחקן חדש, או שחקנים יופיעו כאן לאחר שיירשמו ויאושרו.</p>
            </div>
          )}
        </div>
      </div>
      <AddPlayerDialog open={addPlayerOpen} onOpenChange={setAddPlayerOpen} onSaved={refetch} />
    </div>
  );
};

export default CoachDashboard;
