import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { ACTION_TYPES } from '@/lib/types';
import VideoMeeting from '@/components/VideoMeeting';
import { useSession, usePlayer } from '@/hooks/useSupabaseData';
import { getLetterGrade, getGradeColor } from '@/lib/gradeUtils';

const SessionDetail = () => {
  const { sessionId } = useParams();
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<string>('all');

  const { session, actions, loading } = useSession(sessionId);
  const { player } = usePlayer(session?.player_id);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">טוען...</p></div>;
  }

  if (!session) return <div className="p-8 text-center text-foreground">סשן לא נמצא</div>;

  const plusActions = actions.filter(a => a.score === 1).length;
  const zeroActions = actions.filter(a => a.score === 0).length;
  const minusActions = actions.filter(a => a.score === -1).length;

  const filteredActions = filter === 'all' ? actions : actions.filter(a => a.type === filter);

  const backPath = auth.role === 'coach' ? `/player/${session.player_id}` : `/player/${auth.playerId}`;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <Button variant="ghost" onClick={() => navigate(backPath)} className="mb-4 text-muted-foreground">
          חזרה לפרופיל
          <ArrowRight className="mr-2 h-4 w-4" />
        </Button>

        {/* Session header */}
        <div className="gradient-card rounded-xl p-6 mb-6 animate-fade-in">
          <div className="flex items-start justify-between">
            <div className="stat-glow rounded-xl bg-secondary p-4 text-center">
              <p className={`text-3xl font-bold ${Number(session.overall_score) > 0 ? 'text-success' : Number(session.overall_score) < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {Number(session.overall_score).toFixed(2)}
              </p>
              <p className={`text-lg font-bold ${getGradeColor(getLetterGrade(Number(session.overall_score)))}`}>
                {getLetterGrade(Number(session.overall_score))}
              </p>
              <p className="text-xs text-muted-foreground">ציון כולל</p>
            </div>
            <div className="text-right">
              <h1 className="text-2xl font-bold text-foreground">נגד {session.opponent}</h1>
              <p className="text-muted-foreground">{player?.display_name} · {new Date(session.date).toLocaleDateString('he-IL')}</p>
              {session.video_url && (
                <a href={session.video_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-accent hover:underline">
                  <ExternalLink className="h-3 w-3" />
                  צפייה בוידאו
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Distribution + Game stats */}
        <div className="grid gap-4 md:grid-cols-2 mb-6">
          <div className="gradient-card rounded-xl p-4">
            <h3 className="mb-3 text-right font-semibold text-foreground">התפלגות פעולות</h3>
            <div className="flex justify-around">
              <div className="text-center">
                <p className="text-3xl font-bold text-destructive">{minusActions}</p>
                <p className="text-sm text-muted-foreground">-1</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-muted-foreground">{zeroActions}</p>
                <p className="text-sm text-muted-foreground">0</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-success">{plusActions}</p>
                <p className="text-sm text-muted-foreground">+1</p>
              </div>
            </div>
          </div>
          <div className="gradient-card rounded-xl p-4">
            <h3 className="mb-3 text-right font-semibold text-foreground">סטטיסטיקות משחק</h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'נקודות', value: session.points },
                { label: 'אסיסטים', value: session.assists },
                { label: 'ריבאונדים', value: session.rebounds },
                { label: 'גניבות', value: session.steals },
                { label: 'טורנוברים', value: session.turnovers },
                { label: '% קליעה', value: `${session.fg_percentage}%` },
              ].map((s, i) => (
                <div key={i} className="rounded-lg bg-secondary p-2">
                  <p className="text-lg font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Video meeting */}
        <VideoMeeting meetingUrl={session.meeting_url} />

        {/* Coach notes */}
        {session.coach_notes && (
          <div className="gradient-card rounded-xl p-4 mb-6">
            <h3 className="mb-2 text-right font-semibold text-foreground">הערות מאמן</h3>
            <p className="text-right text-muted-foreground">{session.coach_notes}</p>
          </div>
        )}

        {/* Actions log */}
        <div className="gradient-card rounded-xl p-4">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{filteredActions.length} פעולות</span>
            <h3 className="font-semibold text-foreground">יומן פעולות</h3>
          </div>

          {/* Filter */}
          <div className="mb-4 flex flex-wrap gap-2 justify-end">
            <button
              onClick={() => setFilter('all')}
              className={`rounded-full px-3 py-1 text-sm transition-colors ${filter === 'all' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
            >
              הכל
            </button>
            {ACTION_TYPES.map(type => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`rounded-full px-3 py-1 text-sm transition-colors ${filter === type ? 'bg-accent text-accent-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredActions.map((action, i) => (
              <div
                key={action.id}
                className="flex items-center justify-between rounded-lg bg-secondary p-3 animate-fade-in"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <span className={`rounded-full px-3 py-1 text-sm font-bold ${
                  action.score === 1 ? 'bg-success/20 text-success' :
                  action.score === -1 ? 'bg-destructive/20 text-destructive' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {action.score > 0 ? '+1' : action.score === 0 ? '0' : '-1'}
                </span>
                <div className="flex-1 text-right mx-3">
                  <p className="text-sm text-foreground">{action.description}</p>
                  <p className="text-xs text-muted-foreground">{action.type}</p>
                </div>
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  Q{action.quarter} · {action.minute}'
                </span>
              </div>
            ))}
            {filteredActions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">אין פעולות</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionDetail;
