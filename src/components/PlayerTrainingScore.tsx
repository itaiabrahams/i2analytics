import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Target, Brain, Trophy, TrendingUp } from 'lucide-react';

interface PlayerTrainingScoreProps {
  playerId: string;
  isCoach?: boolean;
}

interface TrainingData {
  // Shot tracker
  totalAttempts: number;
  totalMade: number;
  shootingPct: number;
  monthlyAttempts: number;
  // Court IQ
  courtIQPoints: number;
  courtIQAccuracy: number;
  courtIQStreak: number;
  courtIQAnswered: number;
  courtIQCorrect: number;
  // Combined
  combinedScore: number;
  shotScore: number;
  quizScore: number;
}

function calcShotScore(pct: number, attempts: number): number {
  // Volume-first: effort (70%) + accuracy bonus (30%)
  const volumeScore = Math.min((attempts / 2000) * 100, 100); // 2000 attempts = max
  const accuracyBonus = Math.min(pct, 100);
  return Math.round(volumeScore * 0.7 + accuracyBonus * 0.3);
}

function calcQuizScore(accuracy: number, points: number, streak: number): number {
  // Quiz score: accuracy (50%), points normalized (30%), streak bonus (20%)
  const accuracyScore = Math.min(accuracy, 100);
  const pointsScore = Math.min((points / 5000) * 100, 100); // 5000 pts = max
  const streakScore = Math.min(streak * 10, 100); // 10 streak = max
  return Math.round(accuracyScore * 0.5 + pointsScore * 0.3 + streakScore * 0.2);
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-success';
  if (score >= 60) return 'text-accent';
  if (score >= 40) return 'text-foreground';
  return 'text-muted-foreground';
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'מצוין';
  if (score >= 75) return 'טוב מאוד';
  if (score >= 60) return 'טוב';
  if (score >= 40) return 'סביר';
  if (score >= 20) return 'דרוש שיפור';
  return 'מתחיל';
}

const PlayerTrainingScore = ({ playerId, isCoach }: PlayerTrainingScoreProps) => {
  const [data, setData] = useState<TrainingData | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!playerId) return;

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const [{ data: shotSessions }, { data: courtiq }] = await Promise.all([
        supabase.from('shot_sessions').select('id, date').eq('player_id', playerId),
        supabase.from('courtiq_player_stats')
          .select('total_points, total_answered, total_correct, current_streak')
          .eq('player_id', playerId)
          .maybeSingle(),
      ]);

      let totalAttempts = 0, totalMade = 0, monthlyAttempts = 0;

      if (shotSessions && shotSessions.length > 0) {
        const allIds = shotSessions.map(s => s.id);
        const monthlyIds = shotSessions
          .filter(s => s.date >= monthStart && s.date <= monthEnd)
          .map(s => s.id);

        const [{ data: allShots }, { data: mShots }] = await Promise.all([
          supabase.from('shots').select('attempts, made').in('session_id', allIds),
          monthlyIds.length > 0
            ? supabase.from('shots').select('attempts').in('session_id', monthlyIds)
            : Promise.resolve({ data: [] }),
        ]);

        if (allShots) {
          totalAttempts = allShots.reduce((s, sh) => s + sh.attempts, 0);
          totalMade = allShots.reduce((s, sh) => s + sh.made, 0);
        }
        monthlyAttempts = (mShots ?? []).reduce((s: number, sh: any) => s + sh.attempts, 0);
      }

      const shootingPct = totalAttempts > 0 ? Math.round((totalMade / totalAttempts) * 100) : 0;
      const ciqPoints = courtiq?.total_points ?? 0;
      const ciqAnswered = courtiq?.total_answered ?? 0;
      const ciqCorrect = courtiq?.total_correct ?? 0;
      const ciqStreak = courtiq?.current_streak ?? 0;
      const ciqAccuracy = ciqAnswered > 0 ? Math.round((ciqCorrect / ciqAnswered) * 100) : 0;

      const shotScore = calcShotScore(shootingPct, totalAttempts);
      const quizScore = calcQuizScore(ciqAccuracy, ciqPoints, ciqStreak);
      const combinedScore = Math.round(shotScore * 0.5 + quizScore * 0.5);

      setData({
        totalAttempts, totalMade, shootingPct, monthlyAttempts,
        courtIQPoints: ciqPoints, courtIQAccuracy: ciqAccuracy,
        courtIQStreak: ciqStreak, courtIQAnswered: ciqAnswered, courtIQCorrect: ciqCorrect,
        combinedScore, shotScore, quizScore,
      });
      setLoading(false);
    };

    fetch();
  }, [playerId]);

  if (loading) return <div className="gradient-card rounded-xl p-4 animate-pulse h-24" />;
  if (!data) return null;

  return (
    <div className="gradient-card rounded-xl p-4 mb-6">
      {/* Combined Score Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-accent" />
          <span className="font-semibold text-foreground">דירוג אימונים כולל</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{getScoreLabel(data.combinedScore)}</span>
          <span className={`text-2xl font-bold ${getScoreColor(data.combinedScore)}`}>{data.combinedScore}</span>
          <TrendingUp className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''} text-muted-foreground`} />
        </div>
      </button>

      {/* Score Bars */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-secondary p-3">
          <div className="flex items-center justify-between mb-1">
            <span className={`text-lg font-bold ${getScoreColor(data.shotScore)}`}>{data.shotScore}</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">קליעה</span>
              <Target className="h-3.5 w-3.5 text-accent" />
            </div>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${data.shotScore}%` }} />
          </div>
        </div>
        <div className="rounded-lg bg-secondary p-3">
          <div className="flex items-center justify-between mb-1">
            <span className={`text-lg font-bold ${getScoreColor(data.quizScore)}`}>{data.quizScore}</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Court IQ</span>
              <Brain className="h-3.5 w-3.5 text-accent" />
            </div>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${data.quizScore}%` }} />
          </div>
        </div>
      </div>

      {/* Expanded Breakdown */}
      {expanded && (
        <div className="mt-4 space-y-3 animate-fade-in">
          {/* Shot Tracker Breakdown */}
          <div className="rounded-lg border border-border p-3">
            <h4 className="text-sm font-semibold text-foreground mb-2 text-right flex items-center justify-end gap-1">
              <span>פירוט מעקב קליעה</span>
              <Target className="h-4 w-4 text-accent" />
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { label: 'סה"כ ניסיונות', value: data.totalAttempts.toLocaleString() },
                { label: 'קליעות מוצלחות', value: data.totalMade.toLocaleString() },
                { label: 'אחוז קליעה', value: `${data.shootingPct}%` },
                { label: 'זריקות החודש', value: data.monthlyAttempts.toLocaleString() },
              ].map((stat, i) => (
                <div key={i} className="rounded-md bg-muted/50 p-2 text-center">
                  <p className="text-sm font-bold text-foreground">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Court IQ Breakdown */}
          <div className="rounded-lg border border-border p-3">
            <h4 className="text-sm font-semibold text-foreground mb-2 text-right flex items-center justify-end gap-1">
              <span>פירוט Court IQ</span>
              <Brain className="h-4 w-4 text-accent" />
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { label: 'נקודות חידון', value: data.courtIQPoints.toLocaleString() },
                { label: 'דיוק', value: `${data.courtIQAccuracy}%` },
                { label: 'תשובות נכונות', value: `${data.courtIQCorrect}/${data.courtIQAnswered}` },
                { label: 'רצף נוכחי', value: `${data.courtIQStreak} 🔥` },
              ].map((stat, i) => (
                <div key={i} className="rounded-md bg-muted/50 p-2 text-center">
                  <p className="text-sm font-bold text-foreground">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerTrainingScore;
