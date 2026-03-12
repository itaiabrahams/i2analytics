import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { store } from '@/lib/store';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, TrendingUp, TrendingDown, Minus, Users, Plus } from 'lucide-react';
import PlayerFormDialog from '@/components/PlayerFormDialog';
import NotificationBell from '@/components/NotificationBell';

const CoachDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [, setRefresh] = useState(0);

  const forceRefresh = useCallback(() => setRefresh(n => n + 1), []);

  const players = store.getPlayers();
  const playerData = players.map(p => {
    const sessions = store.getPlayerSessions(p.id);
    const avgScore = store.getPlayerAvgScore(p.id);
    let trend: 'up' | 'down' | 'neutral' = 'neutral';
    if (sessions.length >= 2) {
      const sorted = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      trend = sorted[0].overallScore > sorted[1].overallScore ? 'up' : sorted[0].overallScore < sorted[1].overallScore ? 'down' : 'neutral';
    }
    return { ...p, sessionsCount: sessions.length, avgScore, trend };
  });

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">לוח בקרה</h1>
            <p className="text-muted-foreground">ניהול שחקנים וסשנים</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setDialogOpen(true)} className="gradient-accent text-accent-foreground">
              <Plus className="ml-2 h-4 w-4" />
              שחקן חדש
            </Button>
            <div className="flex items-center gap-2 rounded-lg bg-card px-4 py-2">
              <Users className="h-5 w-5 text-accent" />
              <span className="font-semibold text-foreground">{players.length} שחקנים</span>
            </div>
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
              onClick={() => navigate(`/player/${p.id}`)}
              className="gradient-card rounded-xl p-6 text-right transition-all hover:scale-[1.02] hover:shadow-lg animate-fade-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {p.trend === 'up' && <TrendingUp className="h-5 w-5 text-success" />}
                  {p.trend === 'down' && <TrendingDown className="h-5 w-5 text-destructive" />}
                  {p.trend === 'neutral' && <Minus className="h-5 w-5 text-muted-foreground" />}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">{p.name}</h3>
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
                  <p className="text-2xl font-bold text-foreground">{p.age}</p>
                  <p className="text-xs text-muted-foreground">גיל</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <PlayerFormDialog open={dialogOpen} onOpenChange={setDialogOpen} player={null} onSaved={forceRefresh} />
    </div>
  );
};

export default CoachDashboard;
