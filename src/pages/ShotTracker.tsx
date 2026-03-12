import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, Plus, Flame, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import BasketballCourt from '@/components/shots/BasketballCourt';
import ShotInputDialog from '@/components/shots/ShotInputDialog';
import ShotStats from '@/components/shots/ShotStats';
import ShotProgressChart from '@/components/shots/ShotProgressChart';
import VideoUpload from '@/components/shots/VideoUpload';
import { ZoneId, ZoneStats, ZONES, ShotType, Element, FinishType } from '@/lib/shotZones';
import { usePlayer } from '@/hooks/useSupabaseData';

const ShotTracker = () => {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const { auth, user } = useAuth();
  const isCoach = auth.role === 'coach';

  const id = isCoach ? playerId! : auth.playerId!;
  const { player } = usePlayer(id);

  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [shots, setShots] = useState<any[]>([]);
  const [selectedZone, setSelectedZone] = useState<ZoneId | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showHeatMap, setShowHeatMap] = useState(true);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch shot sessions
  const fetchSessions = useCallback(async () => {
    const { data } = await supabase
      .from('shot_sessions')
      .select('*')
      .eq('player_id', id)
      .order('date', { ascending: false });
    if (data) {
      setSessions(data);
      if (data.length > 0 && !activeSessionId) {
        setActiveSessionId(data[0].id);
      }
    }
    setLoading(false);
  }, [id, activeSessionId]);

  // Fetch shots for active session
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

  // Compute zone stats from shots
  const zoneStats: ZoneStats[] = ZONES.map(zone => {
    const zoneShots = shots.filter(s => s.zone === zone.id);
    const attempts = zoneShots.reduce((s, sh) => s + sh.attempts, 0);
    const made = zoneShots.reduce((s, sh) => s + sh.made, 0);
    return {
      zone: zone.id,
      attempts,
      made,
      percentage: attempts > 0 ? Math.round((made / attempts) * 100) : 0,
    };
  });

  // All-time stats (across all sessions)
  const [allShots, setAllShots] = useState<any[]>([]);
  useEffect(() => {
    if (sessions.length === 0) return;
    const sessionIds = sessions.map(s => s.id);
    supabase
      .from('shots')
      .select('*')
      .in('session_id', sessionIds)
      .then(({ data }) => { if (data) setAllShots(data); });
  }, [sessions]);

  const allTimeStats: ZoneStats[] = ZONES.map(zone => {
    const zoneShots = allShots.filter(s => s.zone === zone.id);
    const attempts = zoneShots.reduce((s, sh) => s + sh.attempts, 0);
    const made = zoneShots.reduce((s, sh) => s + sh.made, 0);
    return {
      zone: zone.id,
      attempts,
      made,
      percentage: attempts > 0 ? Math.round((made / attempts) * 100) : 0,
    };
  });

  const handleZoneClick = (zoneId: ZoneId) => {
    if (!isCoach) return;
    if (!activeSessionId) {
      toast.error('יש ליצור סשן קליעות קודם');
      return;
    }
    setSelectedZone(zoneId);
    setDialogOpen(true);
  };

  const handleShotSubmit = async (data: {
    zone: ZoneId;
    attempts: number;
    made: number;
    shotType: ShotType;
    element: Element | null;
    finishType: FinishType | null;
  }) => {
    if (!activeSessionId) return;

    const { error } = await supabase.from('shots').insert({
      session_id: activeSessionId,
      zone: data.zone,
      attempts: data.attempts,
      made: data.made,
      shot_type: data.shotType,
      element: data.element,
      finish_type: data.finishType,
    });

    if (error) {
      toast.error('שגיאה בשמירת הזריקות');
      return;
    }

    toast.success('הזריקות נשמרו!');
    fetchShots();
  };

  const handleCreateSession = async () => {
    if (!newSessionTitle.trim()) {
      toast.error('יש להזין כותרת לסשן');
      return;
    }
    setCreating(true);
    const { data, error } = await supabase
      .from('shot_sessions')
      .insert({
        player_id: id,
        coach_id: user?.id,
        title: newSessionTitle.trim(),
      })
      .select()
      .single();

    if (error) {
      toast.error('שגיאה ביצירת סשן');
    } else if (data) {
      setActiveSessionId(data.id);
      setNewSessionTitle('');
      toast.success('סשן קליעות חדש נוצר!');
      fetchSessions();
    }
    setCreating(false);
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">טוען...</p></div>;
  }

  const activeSession = sessions.find(s => s.id === activeSessionId);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={showHeatMap ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowHeatMap(!showHeatMap)}
              className={showHeatMap ? 'gradient-accent text-accent-foreground' : 'text-muted-foreground'}
            >
              <Flame className="ml-1 h-4 w-4" />
              Heat Map
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 justify-end">
                <span>מעקב קליעות</span>
                <BarChart3 className="h-6 w-6 text-accent" />
              </h1>
              {player && <p className="text-sm text-muted-foreground">{player.display_name}</p>}
            </div>
            <Button variant="ghost" onClick={() => navigate(`/player/${id}`)} className="text-muted-foreground">
              חזרה לפרופיל
              <ArrowRight className="mr-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Create new session (coach only) */}
        {isCoach && (
          <div className="gradient-card rounded-xl p-4 mb-6">
            <div className="flex gap-3 items-end">
              <Button onClick={handleCreateSession} disabled={creating} className="gradient-accent text-accent-foreground shrink-0">
                <Plus className="ml-1 h-4 w-4" />
                {creating ? 'יוצר...' : 'סשן חדש'}
              </Button>
              <div className="flex-1 space-y-1">
                <Label className="text-right block">כותרת סשן</Label>
                <Input
                  value={newSessionTitle}
                  onChange={e => setNewSessionTitle(e.target.value)}
                  placeholder='לדוגמה: "אימון קליעות 12/3"'
                  maxLength={100}
                  className="text-right"
                />
              </div>
            </div>
          </div>
        )}

        {/* Video upload for active session */}
        {activeSessionId && (
          <div className="mb-6">
            <VideoUpload
              sessionId={activeSessionId}
              currentUrl={activeSession?.video_url || null}
              playerId={id}
              onUploaded={(url) => {
                setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, video_url: url } : s));
              }}
            />
          </div>
        )}

        {/* Session selector */}
        {sessions.length > 0 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 justify-end">
            {sessions.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSessionId(s.id)}
                className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  s.id === activeSessionId
                    ? 'gradient-accent text-accent-foreground'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {s.title || new Date(s.date).toLocaleDateString('he-IL')}
              </button>
            ))}
          </div>
        )}

        {/* Main content */}
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Stats panel */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <div className="space-y-4">
              {activeSession && (
                <div className="text-right">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">סשן נוכחי: {activeSession.title}</h3>
                </div>
              )}
              <ShotStats zoneStats={activeSessionId ? zoneStats : allTimeStats} />

              {sessions.length > 1 && (
                <div className="gradient-card rounded-xl p-4">
                  <h3 className="font-semibold text-foreground text-right mb-2">סה"כ כל הסשנים</h3>
                  <ShotStats zoneStats={allTimeStats} />
                </div>
              )}

              {/* Progress chart */}
              {sessions.length > 1 && (
                <ShotProgressChart sessions={sessions} allShots={allShots} />
              )}
            </div>
          </div>

          {/* Court */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <div className="gradient-card rounded-xl p-4">
              <BasketballCourt
                zoneStats={activeSessionId ? zoneStats : allTimeStats}
                onZoneClick={handleZoneClick}
                showHeatMap={showHeatMap}
                interactive={isCoach}
              />
              {isCoach && (
                <p className="text-xs text-muted-foreground text-center mt-3">
                  לחץ על אזור במגרש כדי להזין זריקות
                </p>
              )}
            </div>
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
