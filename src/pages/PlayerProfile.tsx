import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowRight, Plus, LogOut, Video, Target, Brain, User } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import ScheduleMeetingDialog from '@/components/ScheduleMeetingDialog';
import NotificationBell from '@/components/NotificationBell';
import UpcomingMeetings from '@/components/UpcomingMeetings';
import PlayerRatings from '@/components/PlayerRatings';
import PlayerGoals from '@/components/PlayerGoals';
import TeamCoachFeedbackSection from '@/components/TeamCoachFeedbackSection';
import TechniqueVideos from '@/components/TechniqueVideos';
import { usePlayer, usePlayerSessions, usePlayerAvgScore } from '@/hooks/useSupabaseData';
import { getLetterGrade, getGradeColor, getPlayerTier, getTierBadgeStyle } from '@/lib/gradeUtils';
import { supabase } from '@/integrations/supabase/client';

const PlayerProfile = () => {
  const { playerId } = useParams();
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [monthlyAttempts, setMonthlyAttempts] = useState(0);
  const [shotTotals, setShotTotals] = useState({ attempts: 0, made: 0 });
  const [courtIQStats, setCourtIQStats] = useState({ totalPoints: 0, totalAnswered: 0, totalCorrect: 0, currentStreak: 0 });
  const id = auth.role === 'player' ? auth.playerId! : playerId!;
  const { player, loading: playerLoading } = usePlayer(id);
  const { sessions, loading: sessionsLoading } = usePlayerSessions(id);
  const avgScore = usePlayerAvgScore(id);

  // Fetch shot tracker + Court IQ summary
  useEffect(() => {
    const fetchPerformanceData = async () => {
      if (!id) return;

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const [{ data: shotSessions }, { data: courtiqData }] = await Promise.all([
        supabase.from('shot_sessions').select('id, date').eq('player_id', id),
        supabase
          .from('courtiq_player_stats')
          .select('total_points, total_answered, total_correct, current_streak')
          .eq('player_id', id)
          .maybeSingle(),
      ]);

      setCourtIQStats({
        totalPoints: courtiqData?.total_points ?? 0,
        totalAnswered: courtiqData?.total_answered ?? 0,
        totalCorrect: courtiqData?.total_correct ?? 0,
        currentStreak: courtiqData?.current_streak ?? 0,
      });

      if (!shotSessions || shotSessions.length === 0) {
        setMonthlyAttempts(0);
        setShotTotals({ attempts: 0, made: 0 });
        return;
      }

      const allSessionIds = shotSessions.map(s => s.id);
      const monthlySessionIds = shotSessions
        .filter(s => s.date >= monthStart && s.date <= monthEnd)
        .map(s => s.id);

      const { data: allShots } = await supabase
        .from('shots')
        .select('attempts, made')
        .in('session_id', allSessionIds);

      if (allShots) {
        setShotTotals({
          attempts: allShots.reduce((sum, shot) => sum + shot.attempts, 0),
          made: allShots.reduce((sum, shot) => sum + shot.made, 0),
        });
      }

      if (monthlySessionIds.length === 0) {
        setMonthlyAttempts(0);
        return;
      }

      const { data: monthlyShots } = await supabase
        .from('shots')
        .select('attempts')
        .in('session_id', monthlySessionIds);

      setMonthlyAttempts((monthlyShots ?? []).reduce((sum, shot) => sum + shot.attempts, 0));
    };

    fetchPerformanceData();
  }, [id]);

  if (playerLoading || sessionsLoading) {
    return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">טוען...</p></div>;
  }

  if (!player) return <div className="p-8 text-center text-foreground">שחקן לא נמצא</div>;

  const isBasicPlan = (player as any).subscription_tier === 'basic';

  // Aggregate stats
  const totalSessions = sessions.length;
  const avgPoints = totalSessions > 0 ? (sessions.reduce((s, ses) => s + ses.points, 0) / totalSessions).toFixed(1) : '0';
  const avgAssists = totalSessions > 0 ? (sessions.reduce((s, ses) => s + ses.assists, 0) / totalSessions).toFixed(1) : '0';
  const avgRebounds = totalSessions > 0 ? (sessions.reduce((s, ses) => s + ses.rebounds, 0) / totalSessions).toFixed(1) : '0';

  const progressData = sessions.map(s => ({
    date: new Date(s.date).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' }),
    score: Number(s.overall_score),
  }));

  const statsData = sessions.map(s => ({
    date: new Date(s.date).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' }),
    נקודות: s.points,
    אסיסטים: s.assists,
    ריבאונדים: s.rebounds,
    טורנוברים: s.turnovers,
  }));

  const courtIQAccuracy = courtIQStats.totalAnswered > 0
    ? Math.round((courtIQStats.totalCorrect / courtIQStats.totalAnswered) * 100)
    : 0;


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
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" onClick={() => navigate('/shots')} className="text-muted-foreground">
                <Target className="ml-2 h-4 w-4" />
                מעקב קליעות
              </Button>
              <Button variant="outline" onClick={() => navigate('/courtiq')} className="text-muted-foreground">
                <Brain className="ml-2 h-4 w-4" />
                Court IQ
              </Button>
              <Button variant="outline" onClick={() => navigate('/courtiq/profile')} className="text-muted-foreground">
                <User className="ml-2 h-4 w-4" />
                כרטיס שחקן
              </Button>
              <NotificationBell />
              <Button variant="ghost" onClick={logout} className="text-muted-foreground">
                <LogOut className="ml-2 h-4 w-4" />
                יציאה
              </Button>
            </div>
          )}
          {auth.role === 'coach' && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate(`/player/${id}/shots`)} className="text-muted-foreground">
                <Target className="ml-2 h-4 w-4" />
                מעקב קליעות
              </Button>
              {!isBasicPlan && (
                <>
                  <Button variant="outline" onClick={() => setMeetingOpen(true)} className="text-muted-foreground">
                    <Video className="ml-2 h-4 w-4" />
                    תזמן פגישה
                  </Button>
                  <Button onClick={() => navigate(`/player/${id}/new-session`)} className="gradient-accent text-accent-foreground">
                    <Plus className="ml-2 h-4 w-4" />
                    סשן חדש
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Player info */}
        <div className="gradient-card rounded-xl p-6 mb-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="stat-glow rounded-xl bg-secondary p-4 text-center">
              <p className="text-3xl font-bold text-accent">{avgScore.toFixed(2)}</p>
              <p className={`text-lg font-bold ${getGradeColor(getLetterGrade(avgScore))}`}>
                {getLetterGrade(avgScore)}
              </p>
              <p className="text-xs text-muted-foreground">ציון ממוצע</p>
            </div>
            <div className="text-right flex items-center gap-3">
              <div>
                <h1 className="text-3xl font-bold text-foreground">{player.display_name}</h1>
                <p className="text-muted-foreground">{player.position} · גיל {player.age} · {player.team}</p>
              </div>
              <div className={`flex items-center justify-center h-auto px-3 py-1 rounded-xl shrink-0 border ${getTierBadgeStyle(getPlayerTier(monthlyAttempts).tier)}`}>
                <span className="text-sm font-black">{getPlayerTier(monthlyAttempts).label}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming meetings */}
        {!isBasicPlan && <UpcomingMeetings playerId={id} />}

        {/* Aggregate stats */}
        {!isBasicPlan && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'סה"כ סשנים', value: totalSessions, color: 'text-foreground' },
              { label: 'ממוצע נקודות', value: avgPoints, color: 'text-success' },
              { label: 'ממוצע אסיסטים', value: avgAssists, color: 'text-accent' },
              { label: 'ממוצע ריבאונדים', value: avgRebounds, color: 'text-accent' },
            ].map((stat, i) => (
              <div key={i} className="gradient-card rounded-xl p-4 text-center animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Shot Tracker + Court IQ summary */}
        <div className="gradient-card rounded-xl p-4 mb-6">
          <h3 className="mb-3 text-right font-semibold text-foreground">מעקב קליעה + Court IQ</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'זריקות החודש', value: monthlyAttempts, color: 'text-accent' },
              { label: 'ניסיונות קליעה', value: shotTotals.attempts, color: 'text-foreground' },
              { label: 'קליעות מוצלחות', value: shotTotals.made, color: 'text-success' },
              { label: 'נקודות חידון', value: courtIQStats.totalPoints, color: 'text-accent' },
              { label: 'דיוק חידון', value: `${courtIQAccuracy}%`, color: 'text-foreground' },
            ].map((stat, i) => (
              <div key={i} className="rounded-lg bg-secondary p-3 text-center">
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Charts */}
        {!isBasicPlan && sessions.length > 1 && (
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

        {/* Ratings, Goals & Team Coach Feedback */}
        {!isBasicPlan && (
          <div className="grid gap-4 md:grid-cols-2 mb-6">
            <PlayerGoals playerId={id} isCoach={auth.role === 'coach'} />
            <PlayerRatings playerId={id} isCoach={auth.role === 'coach'} />
          </div>
        )}

        {/* Technique Videos */}
        {!isBasicPlan && (
          <div className="mb-6">
            <TechniqueVideos playerId={id} isOwnProfile={auth.role === 'player'} />
          </div>
        )}

        {/* Team Coach Feedback */}
        {!isBasicPlan && (
          <div className="mb-6">
            <TeamCoachFeedbackSection playerId={id} isPlayer={auth.role === 'player'} />
          </div>
        )}

        {/* Session history */}
        {!isBasicPlan && (
          <div className="gradient-card rounded-xl p-4">
            <h3 className="mb-4 text-right font-semibold text-foreground">היסטוריית סשנים</h3>
            <div className="space-y-2">
              {sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">אין סשנים עדיין</p>
              ) : (
                [...sessions].reverse().map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => navigate(`/session/${s.id}`)}
                    className="w-full rounded-lg bg-secondary p-4 text-right transition-colors hover:bg-muted animate-fade-in flex items-center justify-between"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <span className={`text-xl font-bold ${Number(s.overall_score) > 0 ? 'text-success' : Number(s.overall_score) < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {Number(s.overall_score).toFixed(2)}
                      <span className={`ml-2 text-sm ${getGradeColor(getLetterGrade(Number(s.overall_score)))}`}>
                        {getLetterGrade(Number(s.overall_score))}
                      </span>
                    </span>
                    <div>
                      <p className="font-medium text-foreground">נגד {s.opponent}</p>
                      <p className="text-sm text-muted-foreground">{new Date(s.date).toLocaleDateString('he-IL')}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* WhatsApp contact */}
        {auth.role === 'player' && (
          <div className="mt-6 text-center">
            <a href="https://wa.me/972526124759" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-success hover:underline text-sm font-medium">
              <span className="text-lg">💬</span>
              לשאלות והתייעצויות — 052-6124759
            </a>
          </div>
        )}

        {auth.role === 'coach' && (
          <ScheduleMeetingDialog open={meetingOpen} onOpenChange={setMeetingOpen} playerId={id} playerName={player.display_name} />
        )}
      </div>
    </div>
  );
};

export default PlayerProfile;
