import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { store } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { ArrowRight, Plus, LogOut, Pencil } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import PlayerFormDialog from '@/components/PlayerFormDialog';

const PlayerProfile = () => {
  const { playerId } = useParams();
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [, setRefresh] = useState(0);
  const forceRefresh = useCallback(() => setRefresh(n => n + 1), []);

  const id = auth.role === 'player' ? auth.playerId! : playerId!;
  const player = store.getPlayer(id);
  const sessions = store.getPlayerSessions(id).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (!player) return <div className="p-8 text-center text-foreground">שחקן לא נמצא</div>;

  // Aggregate stats
  const totalActions = sessions.reduce((s, ses) => s + ses.actions.length, 0);
  const positiveActions = sessions.reduce((s, ses) => s + ses.actions.filter(a => a.score === 1).length, 0);
  const negativeActions = sessions.reduce((s, ses) => s + ses.actions.filter(a => a.score === -1).length, 0);
  const improvementPct = sessions.length >= 2
    ? (((sessions[sessions.length - 1].overallScore - sessions[0].overallScore) / Math.abs(sessions[0].overallScore || 1)) * 100).toFixed(0)
    : '0';

  const progressData = sessions.map(s => ({
    date: new Date(s.date).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' }),
    score: parseFloat(s.overallScore.toFixed(2)),
  }));

  const statsData = sessions.map(s => ({
    date: new Date(s.date).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' }),
    נקודות: s.gameStats.points,
    אסיסטים: s.gameStats.assists,
    ריבאונדים: s.gameStats.rebounds,
    טורנוברים: s.gameStats.turnovers,
  }));

  const avgScore = store.getPlayerAvgScore(id);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          {auth.role === 'coach' ? (
            <Button variant="ghost" onClick={() => navigate('/')} className="text-muted-foreground">
              חזרה ללוח בקרה
              <ArrowRight className="mr-2 h-4 w-4" />
            </Button>
          ) : (
            <Button variant="ghost" onClick={logout} className="text-muted-foreground">
              <LogOut className="ml-2 h-4 w-4" />
              יציאה
            </Button>
          )}
          {auth.role === 'coach' && (
            <Button onClick={() => navigate(`/player/${id}/new-session`)} className="gradient-accent text-accent-foreground">
              <Plus className="ml-2 h-4 w-4" />
              סשן חדש
            </Button>
          )}
        </div>

        {/* Player info */}
        <div className="gradient-card rounded-xl p-6 mb-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="stat-glow rounded-xl bg-secondary p-4 text-center">
              <p className="text-3xl font-bold text-accent">{avgScore.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">ציון ממוצע</p>
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-bold text-foreground">{player.name}</h1>
              <p className="text-muted-foreground">{player.position} · גיל {player.age} · {player.team}</p>
            </div>
          </div>
        </div>

        {/* Aggregate stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'סה"כ פעולות', value: totalActions, color: 'text-foreground' },
            { label: 'פעולות חיוביות', value: positiveActions, color: 'text-success' },
            { label: 'פעולות שליליות', value: negativeActions, color: 'text-destructive' },
            { label: '% שיפור', value: `${improvementPct}%`, color: 'text-accent' },
          ].map((stat, i) => (
            <div key={i} className="gradient-card rounded-xl p-4 text-center animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        {sessions.length > 1 && (
          <div className="grid gap-4 md:grid-cols-2 mb-6">
            <div className="gradient-card rounded-xl p-4">
              <h3 className="mb-4 text-right font-semibold text-foreground">התקדמות ציון וידאו</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,25%,20%)" />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(215,15%,55%)', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'hsl(215,15%,55%)', fontSize: 12 }} domain={[-1, 1]} />
                  <Tooltip contentStyle={{ background: 'hsl(220,35%,12%)', border: '1px solid hsl(220,25%,20%)', borderRadius: 8, color: 'hsl(210,20%,92%)' }} />
                  <Line type="monotone" dataKey="score" stroke="hsl(25,95%,53%)" strokeWidth={3} dot={{ fill: 'hsl(25,95%,53%)', r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="gradient-card rounded-xl p-4">
              <h3 className="mb-4 text-right font-semibold text-foreground">סטטיסטיקות משחק</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={statsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,25%,20%)" />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(215,15%,55%)', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'hsl(215,15%,55%)', fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: 'hsl(220,35%,12%)', border: '1px solid hsl(220,25%,20%)', borderRadius: 8, color: 'hsl(210,20%,92%)' }} />
                  <Bar dataKey="נקודות" fill="hsl(25,95%,53%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="אסיסטים" fill="hsl(220,60%,45%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ריבאונדים" fill="hsl(142,71%,45%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="טורנוברים" fill="hsl(0,72%,51%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Session history */}
        <div className="gradient-card rounded-xl p-4">
          <h3 className="mb-4 text-right font-semibold text-foreground">היסטוריית סשנים</h3>
          <div className="space-y-2">
            {[...sessions].reverse().map((s, i) => (
              <button
                key={s.id}
                onClick={() => navigate(`/session/${s.id}`)}
                className="w-full rounded-lg bg-secondary p-4 text-right transition-colors hover:bg-muted animate-fade-in flex items-center justify-between"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span className={`text-xl font-bold ${s.overallScore > 0 ? 'text-success' : s.overallScore < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {s.overallScore.toFixed(2)}
                </span>
                <div>
                  <p className="font-medium text-foreground">נגד {s.opponent}</p>
                  <p className="text-sm text-muted-foreground">{new Date(s.date).toLocaleDateString('he-IL')} · {s.actions.length} פעולות</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerProfile;
