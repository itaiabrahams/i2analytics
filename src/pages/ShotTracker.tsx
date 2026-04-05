import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ArrowRight, Flame, BarChart3, Trophy, Eye, CalendarDays, Plus, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import BasketballCourt from '@/components/shots/BasketballCourt';
import ShotInputDialog from '@/components/shots/ShotInputDialog';
import ShotStats from '@/components/shots/ShotStats';
import ShotProgressChart from '@/components/shots/ShotProgressChart';
import ShotCalendar from '@/components/shots/ShotCalendar';
import WeeklyChallenges from '@/components/challenges/WeeklyChallenges';
import PlayerChallenges from '@/components/challenges/PlayerChallenges';
import { ZoneId, ZoneStats, ZONES, ShotType, Element, FinishType } from '@/lib/shotZones';
import { usePlayer } from '@/hooks/useSupabaseData';
import TechniqueVideos from '@/components/TechniqueVideos';
import CurrentMonthWorkout from '@/components/CurrentMonthWorkout';

const ShotTracker = () => {
  const { playerId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { auth, user } = useAuth();
  const isCoach = auth.role === 'coach';

  const queryPlayerId = new URLSearchParams(location.search).get('player');
  const id = isCoach ? (playerId ?? queryPlayerId ?? '') : (auth.playerId ?? '');
  const { player } = usePlayer(id || undefined);

  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [shots, setShots] = useState<any[]>([]);
  const [selectedZone, setSelectedZone] = useState<ZoneId | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showHeatMap, setShowHeatMap] = useState(true);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'all' | 'date' | 'session'>('all');
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [quickStarting, setQuickStarting] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const fetchSessions = useCallback(async () => {
    if (!id) { setSessions([]); setLoading(false); return; }
    const { data } = await supabase
      .from('shot_sessions').select('*').eq('player_id', id)
      .order('date', { ascending: false });
    if (data) setSessions(data);
    setLoading(false);
  }, [id]);

  const fetchShots = useCallback(async () => {
    if (!activeSessionId) { setShots([]); return; }
    const { data } = await supabase.from('shots').select('*').eq('session_id', activeSessionId);
    if (data) setShots(data);
  }, [activeSessionId]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);
  useEffect(() => { fetchShots(); }, [fetchShots]);

  const zoneStats: ZoneStats[] = ZONES.map(zone => {
    const zoneShots = shots.filter(s => s.zone === zone.id);
    const attempts = zoneShots.reduce((s, sh) => s + sh.attempts, 0);
    const made = zoneShots.reduce((s, sh) => s + sh.made, 0);
    return { zone: zone.id, attempts, made, percentage: attempts > 0 ? Math.round((made / attempts) * 100) : 0 };
  });

  const [allShots, setAllShots] = useState<any[]>([]);
  useEffect(() => {
    if (sessions.length === 0) return;
    const sessionIds = sessions.map(s => s.id);
    supabase.from('shots').select('*').in('session_id', sessionIds)
      .then(({ data }) => { if (data) setAllShots(data); });
  }, [sessions]);

  const allTimeStats: ZoneStats[] = ZONES.map(zone => {
    const zoneShots = allShots.filter(s => s.zone === zone.id);
    const attempts = zoneShots.reduce((s, sh) => s + sh.attempts, 0);
    const made = zoneShots.reduce((s, sh) => s + sh.made, 0);
    return { zone: zone.id, attempts, made, percentage: attempts > 0 ? Math.round((made / attempts) * 100) : 0 };
  });

  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setViewMode('session');
  };

  const handleViewAll = () => {
    setViewMode('all');
    setActiveSessionId(null);
    setSelectedDateKey(null);
  };

  const handleDateSelect = (dateKey: string) => {
    setSelectedDateKey(dateKey);
    setViewMode('date');
    setActiveSessionId(null);
  };

  const handleZoneClick = (zoneId: ZoneId) => {
    if (viewMode !== 'session') {
      toast.error('בחר אימון או לחץ "התחל אימון" כדי להזין זריקות');
      return;
    }
    if (!activeSessionId) {
      toast.error('יש ליצור אימון קליעות קודם');
      return;
    }
    setSelectedZone(zoneId);
    setDialogOpen(true);
  };

  const handleShotSubmit = async (data: {
    zone: ZoneId; attempts: number; made: number;
    shotType: ShotType; element: Element | null; finishType: FinishType | null;
  }) => {
    if (!activeSessionId) return;
    const { error } = await supabase.from('shots').insert({
      session_id: activeSessionId, zone: data.zone,
      attempts: data.attempts, made: data.made,
      shot_type: data.shotType, element: data.element, finish_type: data.finishType,
    });
    if (error) { toast.error('שגיאה בשמירת הזריקות'); return; }
    toast.success('נשמר! 🏀');
    fetchShots();
  };

  // Quick start — create session with one tap
  const handleQuickStart = async () => {
    if (!id) return;
    setQuickStarting(true);
    const today = new Date();
    const title = `אימון ${format(today, 'dd/MM')}`;
    const dateStr = format(today, 'yyyy-MM-dd');

    const { data, error } = await supabase.from('shot_sessions').insert({
      player_id: id,
      coach_id: isCoach ? user?.id : null,
      title,
      date: dateStr,
    }).select('id').single();

    if (error || !data) {
      toast.error('שגיאה ביצירת אימון');
      setQuickStarting(false);
      return;
    }

    toast.success('אימון נוצר! לחץ על אזור במגרש 🎯');
    setActiveSessionId(data.id);
    setViewMode('session');
    fetchSessions();
    setQuickStarting(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-3">
          <div className="mx-auto h-12 w-12 rounded-2xl gradient-accent flex items-center justify-center animate-pulse">
            <span className="text-lg font-black text-accent-foreground">🏀</span>
          </div>
          <p className="text-muted-foreground text-sm">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  const activeSession = sessions.find(s => s.id === activeSessionId);

  const dateSessionIds = selectedDateKey
    ? sessions.filter(s => s.date.split('T')[0] === selectedDateKey).map(s => s.id)
    : [];
  const dateShotsFiltered = allShots.filter(s => dateSessionIds.includes(s.session_id));
  const dateStats: ZoneStats[] = ZONES.map(zone => {
    const zoneShots = dateShotsFiltered.filter(s => s.zone === zone.id);
    const attempts = zoneShots.reduce((s, sh) => s + sh.attempts, 0);
    const made = zoneShots.reduce((s, sh) => s + sh.made, 0);
    return { zone: zone.id, attempts, made, percentage: attempts > 0 ? Math.round((made / attempts) * 100) : 0 };
  });

  const displayStats = viewMode === 'all' ? allTimeStats : viewMode === 'date' ? dateStats : zoneStats;
  const allSessionVideos = sessions.filter(s => s.video_url);
  const dateSessionVideos = selectedDateKey
    ? sessions.filter(s => s.video_url && s.date.split('T')[0] === selectedDateKey)
    : [];

  const totalAllAttempts = allTimeStats.reduce((s, z) => s + z.attempts, 0);
  const totalAllMade = allTimeStats.reduce((s, z) => s + z.made, 0);
  const overallPct = totalAllAttempts > 0 ? Math.round((totalAllMade / totalAllAttempts) * 100) : 0;

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-8 pb-20 sm:pb-8">
      <div className="mx-auto max-w-6xl space-y-4">

        {/* Hero quick-start area */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[hsl(220,35%,14%)] to-[hsl(220,40%,8%)] border border-[hsl(220,25%,22%)] p-4 sm:p-5">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none" />
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 shrink-0">
              {isCoach && (
                <Button variant="ghost" size="sm" onClick={() => navigate(`/player/${id}`)} className="text-muted-foreground h-9 w-9 p-0 rounded-xl">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
              {/* Quick stats pills */}
              {totalAllAttempts > 0 && (
                <div className="hidden xs:flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-accent bg-accent/10 px-2 py-1 rounded-full">{overallPct}%</span>
                  <span className="text-[10px] text-muted-foreground">{totalAllMade}/{totalAllAttempts}</span>
                </div>
              )}
            </div>
            <div className="text-right min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">מעקב קליעות</h1>
              {player && <p className="text-xs text-muted-foreground truncate">{player.display_name}</p>}
            </div>
          </div>

          {/* Quick start button */}
          {viewMode !== 'session' && (
            <Button
              onClick={handleQuickStart}
              disabled={quickStarting}
              className="w-full mt-4 h-14 rounded-2xl text-base font-bold gradient-accent text-accent-foreground shadow-lg shadow-accent/20 active:scale-[0.98] transition-all"
            >
              {quickStarting ? (
                <span className="flex items-center gap-2"><span className="animate-spin">⏳</span> יוצר אימון...</span>
              ) : (
                <span className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  התחל אימון חדש
                </span>
              )}
            </Button>
          )}
          {viewMode === 'session' && activeSession && (
            <div className="mt-3 flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={handleViewAll} className="text-xs text-muted-foreground h-8">
                <Eye className="ml-1 h-3.5 w-3.5" /> כל האימונים
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-accent">🎯 {activeSession.title}</span>
              </div>
            </div>
          )}
        </div>

        {/* Court - always visible & prominent */}
        <div className="rounded-2xl bg-gradient-to-b from-[hsl(220,35%,13%)] to-[hsl(220,35%,10%)] border border-[hsl(220,25%,20%)] p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Button
                variant={showHeatMap ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowHeatMap(!showHeatMap)}
                className={`h-8 text-[11px] px-2.5 rounded-xl transition-all ${showHeatMap ? 'gradient-accent text-accent-foreground' : 'text-muted-foreground border-border'}`}
              >
                <Flame className="ml-1 h-3.5 w-3.5" />
                Heat
              </Button>
            </div>
            <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${
              viewMode === 'all' ? 'bg-accent/15 text-accent' : viewMode === 'date' ? 'bg-secondary text-secondary-foreground' : 'bg-accent/20 text-accent'
            }`}>
              {viewMode === 'all' ? `📊 כללי · ${sessions.length} אימונים` : viewMode === 'date' ? `📅 ${selectedDateKey?.split('-').reverse().join('/')}` : `🎯 ${activeSession?.title || 'אימון'}`}
            </span>
          </div>

          <BasketballCourt
            zoneStats={displayStats}
            onZoneClick={handleZoneClick}
            showHeatMap={showHeatMap}
            interactive={true}
          />

          <p className="text-[11px] text-muted-foreground text-center mt-2 font-medium">
            {viewMode !== 'session'
              ? '👆 לחץ "התחל אימון" למעלה כדי להזין זריקות'
              : '👆 לחץ על אזור במגרש'}
          </p>
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <Button
            variant={viewMode === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={handleViewAll}
            className={`h-9 text-xs rounded-xl shrink-0 ${viewMode === 'all' ? 'gradient-accent text-accent-foreground' : 'text-muted-foreground border-border'}`}
          >
            <Eye className="ml-1 h-3.5 w-3.5" /> כל האימונים
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCalendar(!showCalendar)}
            className={`h-9 text-xs rounded-xl shrink-0 ${showCalendar ? 'border-accent text-accent' : 'text-muted-foreground border-border'}`}
          >
            <CalendarDays className="ml-1 h-3.5 w-3.5" /> לוח שנה
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 text-xs rounded-xl shrink-0 text-muted-foreground border-border">
                <Trophy className="ml-1 h-3.5 w-3.5" /> אתגרים
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[92vw] sm:w-[420px] overflow-y-auto p-4">
              <div className="space-y-6 mt-6">
                <WeeklyChallenges />
                {id && <PlayerChallenges playerId={id} />}
              </div>
            </SheetContent>
          </Sheet>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/leaderboard')}
            className="h-9 text-xs rounded-xl shrink-0 text-muted-foreground border-border"
          >
            <BarChart3 className="ml-1 h-3.5 w-3.5" /> דירוג
          </Button>
        </div>

        {/* Calendar (collapsible) */}
        {showCalendar && (
          <ShotCalendar
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={handleSelectSession}
            onSessionCreated={() => { fetchSessions(); }}
            onDateSelect={handleDateSelect}
            playerId={id}
            coachId={isCoach ? user?.id : undefined}
            canCreate={true}
          />
        )}

        {/* Session shots summary */}
        {viewMode === 'session' && zoneStats.some(z => z.attempts > 0) && (
          <div className="rounded-2xl bg-gradient-to-br from-[hsl(220,35%,14%)] to-[hsl(220,35%,10%)] border border-[hsl(220,25%,20%)] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {(() => {
                  const att = zoneStats.reduce((s, z) => s + z.attempts, 0);
                  const md = zoneStats.reduce((s, z) => s + z.made, 0);
                  const pct = att > 0 ? Math.round((md / att) * 100) : 0;
                  return (
                    <>
                      <span className="text-xs text-muted-foreground">{md}/{att}</span>
                      <span className="text-lg font-bold text-accent">{pct}%</span>
                    </>
                  );
                })()}
              </div>
              <h3 className="text-sm font-semibold text-foreground">סיכום אימון</h3>
            </div>
            <ShotStats zoneStats={zoneStats} />
          </div>
        )}

        {/* All-time stats */}
        {totalAllAttempts > 0 && (viewMode === 'all' || (viewMode === 'session' && sessions.length > 1)) && (
          <div className="rounded-2xl bg-gradient-to-br from-[hsl(220,35%,14%)] to-[hsl(220,35%,10%)] border border-[hsl(220,25%,20%)] p-4">
            <h3 className="text-sm font-semibold text-foreground text-right mb-3">
              סה״כ כל האימונים ({sessions.length})
            </h3>
            <ShotStats zoneStats={allTimeStats} />
          </div>
        )}

        {/* Date stats */}
        {viewMode === 'date' && selectedDateKey && (
          <div className="rounded-2xl bg-gradient-to-br from-[hsl(220,35%,14%)] to-[hsl(220,35%,10%)] border border-[hsl(220,25%,20%)] p-4">
            <h3 className="text-sm font-semibold text-foreground text-right mb-3">
              {selectedDateKey.split('-').reverse().join('/')} ({dateSessionIds.length} אימונים)
            </h3>
            <ShotStats zoneStats={dateStats} />
          </div>
        )}

        {/* Videos */}
        {viewMode === 'all' && allSessionVideos.length > 0 && (
          <div className="rounded-2xl bg-gradient-to-br from-[hsl(220,35%,14%)] to-[hsl(220,35%,10%)] border border-[hsl(220,25%,20%)] p-4 space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground text-right">סרטוני אימונים 🎥 ({allSessionVideos.length})</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {allSessionVideos.map(s => (
                <div key={s.id} className="space-y-1">
                  <p className="text-xs text-muted-foreground text-right">{s.title} · {new Date(s.date).toLocaleDateString('he-IL')}</p>
                  <video src={s.video_url} controls className="w-full rounded-xl max-h-36" preload="metadata" />
                </div>
              ))}
            </div>
          </div>
        )}
        {viewMode === 'date' && dateSessionVideos.length > 0 && (
          <div className="rounded-2xl bg-gradient-to-br from-[hsl(220,35%,14%)] to-[hsl(220,35%,10%)] border border-[hsl(220,25%,20%)] p-4 space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground text-right">סרטוני אימונים 🎥</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {dateSessionVideos.map(s => (
                <div key={s.id} className="space-y-1">
                  <p className="text-xs text-muted-foreground text-right">{s.title}</p>
                  <video src={s.video_url} controls className="w-full rounded-xl max-h-36" preload="metadata" />
                </div>
              ))}
            </div>
          </div>
        )}
        {viewMode === 'session' && activeSession?.video_url && (
          <div className="rounded-2xl bg-gradient-to-br from-[hsl(220,35%,14%)] to-[hsl(220,35%,10%)] border border-[hsl(220,25%,20%)] p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2 text-right">סרטון אימון 🎥</h3>
            <video src={activeSession.video_url} controls className="w-full rounded-xl max-h-48" preload="metadata" />
          </div>
        )}

        {/* Progress chart */}
        {sessions.length > 1 && (
          <ShotProgressChart sessions={sessions} allShots={allShots} />
        )}

        {/* Workout plan */}
        <CurrentMonthWorkout />

        {/* Technique videos */}
        <TechniqueVideos playerId={id} isOwnProfile={!isCoach} />
      </div>

      <ShotInputDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        zoneId={selectedZone}
        onSubmit={handleShotSubmit}
      />
    </div>
  );
};

export default ShotTracker;
