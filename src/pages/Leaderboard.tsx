import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowRight, Trophy, Medal, Crown, Flame } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, startOfDay, startOfWeek, startOfMonth } from 'date-fns';
import { getVerbalRating } from '@/lib/shotZones';

type Period = 'daily' | 'weekly' | 'monthly' | 'all';

interface PlayerStat {
  playerId: string;
  displayName: string;
  team: string | null;
  position: string | null;
  attempts: number;
  made: number;
  percentage: number;
}

const PERIOD_LABELS: Record<Period, string> = {
  daily: 'יומי',
  weekly: 'שבועי',
  monthly: 'חודשי',
  all: 'כל הזמנים',
};

const Leaderboard = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const isCoach = auth.role === 'coach';
  const [period, setPeriod] = useState<Period>('weekly');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [shots, setShots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [profilesRes, sessionsRes] = await Promise.all([
        supabase.from('profiles').select('user_id, display_name, team, position').eq('role', 'player'),
        supabase.from('shot_sessions').select('id, player_id, date'),
      ]);

      const allProfiles = profilesRes.data || [];
      const allSessions = sessionsRes.data || [];
      setProfiles(allProfiles);
      setSessions(allSessions);

      if (allSessions.length > 0) {
        const sessionIds = allSessions.map(s => s.id);
        // Fetch in batches if needed (limit 1000)
        let allShots: any[] = [];
        for (let i = 0; i < sessionIds.length; i += 500) {
          const batch = sessionIds.slice(i, i + 500);
          const { data } = await supabase.from('shots').select('session_id, attempts, made').in('session_id', batch);
          if (data) allShots = allShots.concat(data);
        }
        setShots(allShots);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const leaderboard = useMemo(() => {
    const now = new Date();
    let startDate: Date | null = null;
    if (period === 'daily') startDate = startOfDay(now);
    else if (period === 'weekly') startDate = startOfWeek(now, { weekStartsOn: 0 });
    else if (period === 'monthly') startDate = startOfMonth(now);

    // Filter sessions by period
    const filteredSessions = startDate
      ? sessions.filter(s => new Date(s.date) >= startDate!)
      : sessions;

    const sessionIdSet = new Set(filteredSessions.map(s => s.id));
    const sessionPlayerMap: Record<string, string> = {};
    filteredSessions.forEach(s => { sessionPlayerMap[s.id] = s.player_id; });

    // Aggregate shots per player
    const playerStats: Record<string, { attempts: number; made: number }> = {};
    shots.forEach(shot => {
      if (!sessionIdSet.has(shot.session_id)) return;
      const playerId = sessionPlayerMap[shot.session_id];
      if (!playerId) return;
      if (!playerStats[playerId]) playerStats[playerId] = { attempts: 0, made: 0 };
      playerStats[playerId].attempts += shot.attempts;
      playerStats[playerId].made += shot.made;
    });

    // Build leaderboard
    const result: PlayerStat[] = profiles
      .filter(p => playerStats[p.user_id])
      .map(p => {
        const stats = playerStats[p.user_id];
        return {
          playerId: p.user_id,
          displayName: p.display_name,
          team: p.team,
          position: p.position,
          attempts: stats.attempts,
          made: stats.made,
          percentage: stats.attempts > 0 ? Math.round((stats.made / stats.attempts) * 1000) / 10 : 0,
        };
      })
      .sort((a, b) => b.percentage - a.percentage || b.attempts - a.attempts);

    return result;
  }, [period, profiles, sessions, shots]);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-6 w-6 text-warning" />;
    if (index === 1) return <Medal className="h-5 w-5 text-muted-foreground" style={{ color: 'hsl(38, 60%, 70%)' }} />;
    if (index === 2) return <Medal className="h-5 w-5" style={{ color: 'hsl(25, 50%, 55%)' }} />;
    return <span className="text-sm font-bold text-muted-foreground w-6 text-center">{index + 1}</span>;
  };

  const getRankBg = (index: number) => {
    if (index === 0) return 'bg-warning/10 border border-warning/30';
    if (index === 1) return 'bg-secondary/80';
    if (index === 2) return 'bg-secondary/60';
    return 'bg-secondary/40';
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div />
          <div className="flex items-center gap-3">
            <div className="text-right">
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 justify-end">
                <span>טבלת דירוג</span>
                <Trophy className="h-6 w-6 text-warning" />
              </h1>
              <p className="text-sm text-muted-foreground">דירוג שחקנים לפי אחוזי קליעה</p>
            </div>
            <Button variant="ghost" onClick={() => navigate(-1)} className="text-muted-foreground">
              חזרה
              <ArrowRight className="mr-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Period tabs */}
        <Tabs value={period} onValueChange={v => setPeriod(v as Period)} className="mb-6">
          <TabsList className="grid w-full grid-cols-4">
            {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
              <TabsTrigger key={p} value={p} className="text-sm">
                {PERIOD_LABELS[p]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Leaderboard */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">טוען דירוג...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="gradient-card rounded-xl p-8 text-center">
            <Flame className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">אין נתוני קליעה לתקופה זו</p>
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((player, i) => (
              <button
                key={player.playerId}
                onClick={() => {
                  if (isCoach) navigate(`/player/${player.playerId}/shots`);
                  else if (player.playerId === auth.playerId) navigate('/shots');
                }}
                className={`w-full rounded-xl p-4 flex items-center gap-4 transition-all hover:scale-[1.01] hover:shadow-md animate-fade-in ${getRankBg(i)}`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {/* Rank */}
                <div className="flex-shrink-0 w-8 flex justify-center">
                  {getRankIcon(i)}
                </div>

                {/* Player info */}
                <div className="flex-1 text-right min-w-0">
                  <p className="font-bold text-foreground truncate">{player.displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {player.position}{player.team ? ` · ${player.team}` : ''}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex gap-4 items-center flex-shrink-0">
                  <div className="text-center">
                    <p className="text-sm font-bold text-foreground">{player.attempts}</p>
                    <p className="text-[10px] text-muted-foreground">זריקות</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-success">{player.made}</p>
                    <p className="text-[10px] text-muted-foreground">קליעות</p>
                  </div>
                  <div className="text-center min-w-[50px]">
                    <p className={`text-lg font-black ${i === 0 ? 'text-warning' : 'text-accent'}`}>
                      {player.percentage}%
                    </p>
                    <p className={`text-[10px] font-medium ${getVerbalRating(player.percentage, player.attempts).color}`}>
                      {getVerbalRating(player.percentage, player.attempts).label}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
