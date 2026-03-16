import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowRight, Trophy, Medal, Crown, Flame, Target, Brain, Zap } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { startOfDay, startOfWeek, startOfMonth, startOfYear } from 'date-fns';
import { getVerbalRating } from '@/lib/shotZones';

type Period = 'daily' | 'weekly' | 'monthly' | 'all';
type RankingType = 'combined' | 'shooting' | 'quiz';

interface ProfileData {
  user_id: string;
  display_name: string;
  team: string | null;
  position: string | null;
}

interface LeaderboardEntry {
  playerId: string;
  displayName: string;
  team: string | null;
  position: string | null;
  // Shooting
  attempts: number;
  made: number;
  shootingPct: number;
  // Quiz
  quizPoints: number;
  quizAccuracy: number;
  quizAnswered: number;
  quizCorrect: number;
  // Combined
  shotScore: number;
  quizScore: number;
  combinedScore: number;
}

const PERIOD_LABELS: Record<Period, string> = {
  daily: 'יומי',
  weekly: 'שבועי',
  monthly: 'חודשי',
  all: 'כל הזמנים',
};

const RANKING_LABELS: Record<RankingType, { label: string; icon: typeof Trophy }> = {
  combined: { label: 'כללי', icon: Trophy },
  shooting: { label: 'קליעה', icon: Target },
  quiz: { label: 'חידון', icon: Brain },
};

function calcShotScore(pct: number, attempts: number): number {
  // Volume-first: effort (70%) + accuracy bonus (30%)
  const volumeScore = Math.min((attempts / 2000) * 100, 100);
  const accuracyBonus = Math.min(pct, 100);
  return Math.round(volumeScore * 0.7 + accuracyBonus * 0.3);
}

function calcQuizScore(accuracy: number, points: number, streak: number): number {
  const accuracyScore = Math.min(accuracy, 100);
  const pointsScore = Math.min((points / 5000) * 100, 100);
  const streakScore = Math.min(streak * 10, 100);
  return Math.round(accuracyScore * 0.5 + pointsScore * 0.3 + streakScore * 0.2);
}

const Leaderboard = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const isCoach = auth.role === 'coach';
  const [period, setPeriod] = useState<Period>('weekly');
  const [rankingType, setRankingType] = useState<RankingType>('combined');
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [shots, setShots] = useState<any[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<any[]>([]);
  const [quizStats, setQuizStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [profilesRes, sessionsRes, quizStatsRes, quizAnswersRes] = await Promise.all([
        supabase.from('profiles').select('user_id, display_name, team, position').eq('role', 'player'),
        supabase.from('shot_sessions').select('id, player_id, date'),
        supabase.from('courtiq_player_stats').select('player_id, total_points, total_answered, total_correct, current_streak'),
        supabase.from('courtiq_answers').select('player_id, is_correct, points_earned, answered_at'),
      ]);

      const allProfiles = profilesRes.data || [];
      const allSessions = sessionsRes.data || [];
      setProfiles(allProfiles);
      setSessions(allSessions);
      setQuizStats(quizStatsRes.data || []);
      setQuizAnswers(quizAnswersRes.data || []);

      if (allSessions.length > 0) {
        const sessionIds = allSessions.map(s => s.id);
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

    // ---- SHOOTING DATA ----
    const filteredSessions = startDate
      ? sessions.filter(s => new Date(s.date) >= startDate!)
      : sessions;

    const sessionIdSet = new Set(filteredSessions.map(s => s.id));
    const sessionPlayerMap: Record<string, string> = {};
    filteredSessions.forEach(s => { sessionPlayerMap[s.id] = s.player_id; });

    const playerShots: Record<string, { attempts: number; made: number }> = {};
    shots.forEach(shot => {
      if (!sessionIdSet.has(shot.session_id)) return;
      const pid = sessionPlayerMap[shot.session_id];
      if (!pid) return;
      if (!playerShots[pid]) playerShots[pid] = { attempts: 0, made: 0 };
      playerShots[pid].attempts += shot.attempts;
      playerShots[pid].made += shot.made;
    });

    // ---- QUIZ DATA ----
    const filteredAnswers = startDate
      ? quizAnswers.filter(a => new Date(a.answered_at) >= startDate!)
      : quizAnswers;

    const playerQuiz: Record<string, { points: number; answered: number; correct: number }> = {};
    filteredAnswers.forEach(a => {
      if (!playerQuiz[a.player_id]) playerQuiz[a.player_id] = { points: 0, answered: 0, correct: 0 };
      playerQuiz[a.player_id].points += (a.points_earned || 0);
      playerQuiz[a.player_id].answered += 1;
      if (a.is_correct) playerQuiz[a.player_id].correct += 1;
    });

    // Get streak from stats (all-time only, not period-filtered)
    const streakMap: Record<string, number> = {};
    quizStats.forEach(s => { streakMap[s.player_id] = s.current_streak || 0; });

    // ---- BUILD LEADERBOARD ----
    const allPlayerIds = new Set([
      ...Object.keys(playerShots),
      ...Object.keys(playerQuiz),
    ]);

    const profileMap: Record<string, ProfileData> = {};
    profiles.forEach(p => { profileMap[p.user_id] = p; });

    const result: LeaderboardEntry[] = [];

    allPlayerIds.forEach(pid => {
      const profile = profileMap[pid];
      if (!profile) return;

      const sh = playerShots[pid] || { attempts: 0, made: 0 };
      const qz = playerQuiz[pid] || { points: 0, answered: 0, correct: 0 };
      const shootingPct = sh.attempts > 0 ? Math.round((sh.made / sh.attempts) * 1000) / 10 : 0;
      const quizAccuracy = qz.answered > 0 ? Math.round((qz.correct / qz.answered) * 100) : 0;

      const shotScore = calcShotScore(shootingPct, sh.attempts);
      const quizScoreVal = calcQuizScore(quizAccuracy, qz.points, streakMap[pid] || 0);
      const combinedScore = Math.round(shotScore * 0.5 + quizScoreVal * 0.5);

      // Filter based on ranking type - only show if they have relevant data
      if (rankingType === 'shooting' && sh.attempts === 0) return;
      if (rankingType === 'quiz' && qz.answered === 0) return;
      if (rankingType === 'combined' && sh.attempts === 0 && qz.answered === 0) return;

      result.push({
        playerId: pid,
        displayName: profile.display_name,
        team: profile.team,
        position: profile.position,
        attempts: sh.attempts,
        made: sh.made,
        shootingPct,
        quizPoints: qz.points,
        quizAccuracy,
        quizAnswered: qz.answered,
        quizCorrect: qz.correct,
        shotScore,
        quizScore: quizScoreVal,
        combinedScore,
      });
    });

    // Sort
    if (rankingType === 'shooting') {
      result.sort((a, b) => b.shootingPct - a.shootingPct || b.attempts - a.attempts);
    } else if (rankingType === 'quiz') {
      result.sort((a, b) => b.quizPoints - a.quizPoints || b.quizAccuracy - a.quizAccuracy);
    } else {
      result.sort((a, b) => b.combinedScore - a.combinedScore || b.attempts - a.attempts);
    }

    return result;
  }, [period, rankingType, profiles, sessions, shots, quizAnswers, quizStats]);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-6 w-6 text-warning" />;
    if (index === 1) return <Medal className="h-5 w-5" style={{ color: 'hsl(38, 60%, 70%)' }} />;
    if (index === 2) return <Medal className="h-5 w-5" style={{ color: 'hsl(25, 50%, 55%)' }} />;
    return <span className="text-sm font-bold text-muted-foreground w-6 text-center">{index + 1}</span>;
  };

  const getRankBg = (index: number) => {
    if (index === 0) return 'bg-warning/10 border border-warning/30';
    if (index === 1) return 'bg-secondary/80';
    if (index === 2) return 'bg-secondary/60';
    return 'bg-secondary/40';
  };

  const renderStats = (player: LeaderboardEntry, i: number) => {
    if (rankingType === 'shooting') {
      return (
        <div className="flex gap-3 items-center flex-shrink-0">
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
              {player.shootingPct}%
            </p>
            <p className={`text-[10px] font-medium ${getVerbalRating(player.shootingPct, player.attempts).color}`}>
              {getVerbalRating(player.shootingPct, player.attempts).label}
            </p>
          </div>
        </div>
      );
    }

    if (rankingType === 'quiz') {
      return (
        <div className="flex gap-3 items-center flex-shrink-0">
          <div className="text-center">
            <p className="text-sm font-bold text-foreground">{player.quizAnswered}</p>
            <p className="text-[10px] text-muted-foreground">תשובות</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-success">{player.quizAccuracy}%</p>
            <p className="text-[10px] text-muted-foreground">דיוק</p>
          </div>
          <div className="text-center min-w-[50px]">
            <p className={`text-lg font-black ${i === 0 ? 'text-warning' : 'text-accent'}`}>
              {player.quizPoints}
            </p>
            <p className="text-[10px] text-muted-foreground">נק׳</p>
          </div>
        </div>
      );
    }

    // Combined
    return (
      <div className="flex gap-3 items-center flex-shrink-0">
        <div className="text-center">
          <p className="text-sm font-bold text-foreground">{player.shotScore}</p>
          <p className="text-[10px] text-muted-foreground">קליעה</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-foreground">{player.quizScore}</p>
          <p className="text-[10px] text-muted-foreground">חידון</p>
        </div>
        <div className="text-center min-w-[50px]">
          <p className={`text-lg font-black ${i === 0 ? 'text-warning' : 'text-accent'}`}>
            {player.combinedScore}
          </p>
          <p className="text-[10px] text-muted-foreground">כולל</p>
        </div>
      </div>
    );
  };

  const RankingIcon = RANKING_LABELS[rankingType].icon;

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
              <p className="text-sm text-muted-foreground">
                {RANKING_LABELS[rankingType].label} · {PERIOD_LABELS[period]}
              </p>
            </div>
            <Button variant="ghost" onClick={() => navigate(-1)} className="text-muted-foreground">
              חזרה
              <ArrowRight className="mr-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Ranking type tabs */}
        <Tabs value={rankingType} onValueChange={v => setRankingType(v as RankingType)} className="mb-3">
          <TabsList className="grid w-full grid-cols-3">
            {(Object.keys(RANKING_LABELS) as RankingType[]).map(r => {
              const Icon = RANKING_LABELS[r].icon;
              return (
                <TabsTrigger key={r} value={r} className="text-sm flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5" />
                  {RANKING_LABELS[r].label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

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
            <p className="text-muted-foreground">אין נתונים לתקופה זו</p>
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
                {renderStats(player, i)}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
