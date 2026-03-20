import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ArrowRight, Flame, BarChart3, Trophy, Eye, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
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

  const fetchSessions = useCallback(async () => {
    if (!id) {
      setSessions([]);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('shot_sessions')
      .select('*')
      .eq('player_id', id)
      .order('date', { ascending: false });
    if (data) {
      setSessions(data);
      // Don't auto-select a session; start in "view all" mode
    }
    setLoading(false);
  }, [id]);

  const fetchShots = useCallback(async () => {
    if (!activeSessionId) { setShots([]); return; }
    const { data } = await supabase
      .from('shots')
      .select('*')
      .eq('session_id', activeSessionId);
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
      toast.error('יש לבחור אימון ספציפי כדי להזין זריקות');
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
    toast.success('הזריקות נשמרו!');
    fetchShots();
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">טוען...</p></div>;
  }

  const activeSession = sessions.find(s => s.id === activeSessionId);
  
  // Compute date-based stats when in date view mode
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

  return (
    <div className="min-h-screen p-2 sm:p-4 md:p-8 pb-20 sm:pb-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-3 sm:mb-4 space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between">
            <Button
              variant={showHeatMap ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowHeatMap(!showHeatMap)}
              className={`h-10 sm:h-8 text-xs px-3 rounded-xl active:scale-[0.97] transition-transform ${showHeatMap ? 'gradient-accent text-accent-foreground' : 'text-muted-foreground'}`}
            >
              <Flame className="ml-1 h-4 w-4 sm:h-3.5 sm:w-3.5" />
              Heat Map
            </Button>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <h1 className="text-base sm:text-2xl font-bold text-foreground flex items-center gap-1.5 justify-end">
                  <span>מעקב קליעות</span>
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                </h1>
                {player && <p className="text-[11px] sm:text-xs text-muted-foreground">{player.display_name}</p>}
              </div>
              <Button variant="ghost" size="sm" onClick={() => isCoach ? navigate(`/player/${id}`) : navigate('/')} className="text-muted-foreground h-10 w-10 sm:h-8 sm:w-8 p-0 rounded-xl">
                <ArrowRight className="h-5 w-5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="text-accent border-accent/30 h-10 sm:h-8 text-xs px-3 rounded-xl active:scale-[0.97] transition-transform">
                  <Trophy className="ml-1 h-4 w-4 sm:h-3.5 sm:w-3.5" />
                  אתגרים
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
              className="text-accent border-accent/30 h-10 sm:h-8 text-xs px-3 rounded-xl active:scale-[0.97] transition-transform"
            >
              <BarChart3 className="ml-1 h-4 w-4 sm:h-3.5 sm:w-3.5" />
              דירוג
            </Button>
          </div>
        </div>

        {/* Main layout */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-5">
          {/* Left side */}
          <div className="lg:col-span-2 order-2 lg:order-1 space-y-3 sm:space-y-4">
            {/* View All toggle */}
            <div className="flex items-center gap-2 justify-end flex-wrap">
              <Button
                variant={viewMode === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={handleViewAll}
                className={`h-10 sm:h-8 text-xs rounded-xl active:scale-[0.97] transition-transform ${viewMode === 'all' ? 'gradient-accent text-accent-foreground' : 'text-muted-foreground border-accent/30'}`}
              >
                <Eye className="ml-1 h-4 w-4 sm:h-3.5 sm:w-3.5" />
                כל האימונים
              </Button>
              {viewMode === 'date' && selectedDateKey && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {selectedDateKey.split('-').reverse().join('/')}
                </span>
              )}
              {viewMode === 'session' && activeSession && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {activeSession.title}
                </span>
              )}
            </div>

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

            {/* Videos */}
            {viewMode === 'all' ? (
              allSessionVideos.length > 0 && (
                <div className="gradient-card rounded-xl p-4 space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground text-right">כל סרטוני האימונים 🎥 ({allSessionVideos.length})</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {allSessionVideos.map(s => (
                      <div key={s.id} className="space-y-1">
                        <p className="text-xs text-muted-foreground text-right">{s.title} · {new Date(s.date).toLocaleDateString('he-IL')}</p>
                        <video src={s.video_url} controls className="w-full rounded-lg max-h-36" preload="metadata" />
                      </div>
                    ))}
                  </div>
                </div>
              )
            ) : viewMode === 'date' ? (
              dateSessionVideos.length > 0 && (
                <div className="gradient-card rounded-xl p-4 space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground text-right">סרטוני אימונים בתאריך 🎥 ({dateSessionVideos.length})</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {dateSessionVideos.map(s => (
                      <div key={s.id} className="space-y-1">
                        <p className="text-xs text-muted-foreground text-right">{s.title}</p>
                        <video src={s.video_url} controls className="w-full rounded-lg max-h-36" preload="metadata" />
                      </div>
                    ))}
                  </div>
                </div>
              )
            ) : (
              activeSession?.video_url && (
                <div className="gradient-card rounded-xl p-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 text-right">סרטון אימון 🎥</h3>
                  <video src={activeSession.video_url} controls className="w-full rounded-lg max-h-48" preload="metadata" />
                </div>
              )
            )}

            {/* Stats header */}
            {viewMode === 'session' && activeSession && (
              <div className="text-right">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">אימון: {activeSession.title}</h3>
              </div>
            )}
            {viewMode === 'date' && selectedDateKey && (
              <div className="text-right">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  נתוני תאריך: {selectedDateKey.split('-').reverse().join('/')} ({dateSessionIds.length} אימונים)
                </h3>
              </div>
            )}
            {viewMode === 'all' && sessions.length > 0 && (
              <div className="text-right">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">סה״כ כל האימונים ({sessions.length})</h3>
              </div>
            )}
            <ShotStats zoneStats={displayStats} />

            {viewMode !== 'all' && sessions.length > 1 && (
              <div className="gradient-card rounded-xl p-4">
                <h3 className="font-semibold text-foreground text-right mb-2">סה"כ כל האימונים</h3>
                <ShotStats zoneStats={allTimeStats} />
              </div>
            )}

            {sessions.length > 1 && (
              <ShotProgressChart sessions={sessions} allShots={allShots} />
            )}

            <TechniqueVideos playerId={id} isOwnProfile={!isCoach} />
          </div>

          {/* Right side: Court + Workout */}
          <div className="lg:col-span-3 order-1 lg:order-2 space-y-3 sm:space-y-4">
            <div className="gradient-card rounded-xl p-2.5 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[11px] sm:text-xs font-medium px-2 py-1 rounded-full ${
                  viewMode === 'all' ? 'bg-accent/20 text-accent' : viewMode === 'date' ? 'bg-secondary text-secondary-foreground' : 'bg-primary/20 text-primary'
                }`}>
                  {viewMode === 'all' ? '📊 תצוגה כללית' : viewMode === 'date' ? `📅 ${selectedDateKey?.split('-').reverse().join('/')}` : `🎯 ${activeSession?.title || 'אימון'}`}
                </span>
              </div>
              <BasketballCourt
                zoneStats={displayStats}
                onZoneClick={handleZoneClick}
                showHeatMap={showHeatMap}
                interactive={true}
              />
              <p className="text-[11px] sm:text-xs text-muted-foreground text-center mt-2 sm:mt-3 font-medium">
                {viewMode !== 'session' ? 'בחר אימון ספציפי בלוח השנה כדי להזין זריקות' : '👆 לחץ על אזור במגרש כדי להזין זריקות'}
              </p>
            </div>

            <CurrentMonthWorkout />
          </div>
        </div>
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
