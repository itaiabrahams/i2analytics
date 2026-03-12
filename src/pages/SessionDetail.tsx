import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { store } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { ACTION_TYPES } from '@/lib/types';

const SessionDetail = () => {
  const { sessionId } = useParams();
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<string>('all');

  const session = store.getSession(sessionId!);
  if (!session) return <div className="p-8 text-center text-foreground">סשן לא נמצא</div>;

  const player = store.getPlayer(session.playerId);
  const plusActions = session.actions.filter(a => a.score === 1).length;
  const zeroActions = session.actions.filter(a => a.score === 0).length;
  const minusActions = session.actions.filter(a => a.score === -1).length;

  const filteredActions = filter === 'all' ? session.actions : session.actions.filter(a => a.type === filter);

  const backPath = auth.role === 'coach' ? `/player/${session.playerId}` : `/player/${auth.playerId}`;

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
              <p className={`text-3xl font-bold ${session.overallScore > 0 ? 'text-success' : session.overallScore < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {session.overallScore.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">ציון כולל</p>
            </div>
            <div className="text-right">
              <h1 className="text-2xl font-bold text-foreground">נגד {session.opponent}</h1>
              <p className="text-muted-foreground">{player?.name} · {new Date(session.date).toLocaleDateString('he-IL')}</p>
              {session.videoUrl && (
                <a href={session.videoUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-accent hover:underline">
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
                { label: 'נקודות', value: session.gameStats.points },
                { label: 'אסיסטים', value: session.gameStats.assists },
                { label: 'ריבאונדים', value: session.gameStats.rebounds },
                { label: 'גניבות', value: session.gameStats.steals },
                { label: 'טורנוברים', value: session.gameStats.turnovers },
                { label: '% קליעה', value: `${session.gameStats.fgPercentage}%` },
              ].map((s, i) => (
                <div key={i} className="rounded-lg bg-secondary p-2">
                  <p className="text-lg font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Coach notes */}
        {session.coachNotes && (
          <div className="gradient-card rounded-xl p-4 mb-6">
            <h3 className="mb-2 text-right font-semibold text-foreground">הערות מאמן</h3>
            <p className="text-right text-muted-foreground">{session.coachNotes}</p>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionDetail;
