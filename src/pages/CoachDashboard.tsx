import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, TrendingUp, TrendingDown, Minus, Users, Plus, Shield, Brain, ArrowRight, Dumbbell, Target, Crown, Menu, X, Crosshair, ArrowLeftRight, Pencil, ClipboardList } from 'lucide-react';
import EditPlayerDialog from '@/components/EditPlayerDialog';
import NotificationBell from '@/components/NotificationBell';
import { usePlayers, usePlayerSessionCounts } from '@/hooks/useSupabaseData';
import AddPlayerDialog from '@/components/AddPlayerDialog';
import FantasyInfoDialog from '@/components/FantasyInfoDialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type AgeCategory = 'U14' | 'U15' | 'U16' | 'U18' | 'SENIOR' | 'לא מוגדר';

const AGE_CATEGORIES: { key: AgeCategory; label: string; maxAge: number; emoji: string }[] = [
  { key: 'U14', label: 'U14', maxAge: 14, emoji: '🏀' },
  { key: 'U15', label: 'U15', maxAge: 15, emoji: '🏀' },
  { key: 'U16', label: 'U16', maxAge: 16, emoji: '🏀' },
  { key: 'U18', label: 'U18', maxAge: 18, emoji: '🏀' },
  { key: 'SENIOR', label: 'SENIOR', maxAge: 999, emoji: '⭐' },
  { key: 'לא מוגדר', label: 'לא מוגדר', maxAge: -1, emoji: '❓' },
];

function getAgeCategory(age: number | null): AgeCategory {
  if (age == null) return 'לא מוגדר';
  if (age <= 14) return 'U14';
  if (age <= 15) return 'U15';
  if (age <= 16) return 'U16';
  if (age <= 18) return 'U18';
  return 'SENIOR';
}

const CoachDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { players, loading, refetch } = usePlayers();
  const sessionCounts = usePlayerSessionCounts();
  const [addPlayerOpen, setAddPlayerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AgeCategory | null>(null);
  const [activeSection, setActiveSection] = useState<'premium' | 'basic'>('premium');
  const [menuOpen, setMenuOpen] = useState(false);
  const [editPlayer, setEditPlayer] = useState<{ user_id: string; display_name: string; team: string | null; age: number | null } | null>(null);
  const [fantasyOpen, setFantasyOpen] = useState(false);

  const buildPlayerData = (list: typeof players) => list.map(p => {
    const sc = sessionCounts[p.user_id] || { count: 0, avgScore: 0, latestScores: [] };
    let trend: 'up' | 'down' | 'neutral' = 'neutral';
    if (sc.latestScores.length >= 2) {
      trend = sc.latestScores[0] > sc.latestScores[1] ? 'up' : sc.latestScores[0] < sc.latestScores[1] ? 'down' : 'neutral';
    }
    return { ...p, sessionsCount: sc.count, avgScore: sc.avgScore, trend, ageCategory: getAgeCategory(p.age) };
  });

  const allPlayerData = useMemo(() => buildPlayerData(players), [players, sessionCounts]);

  const premiumPlayers = useMemo(() => allPlayerData.filter(p => p.subscription_tier === 'premium'), [allPlayerData]);
  const basicPlayers = useMemo(() => allPlayerData.filter(p => p.subscription_tier !== 'premium'), [allPlayerData]);

  const currentPlayers = activeSection === 'premium' ? premiumPlayers : basicPlayers;

  type PlayerDataItem = ReturnType<typeof buildPlayerData>[number];

  const groupedPlayers = useMemo(() => {
    const groups: Record<AgeCategory, PlayerDataItem[]> = {
      'U14': [], 'U15': [], 'U16': [], 'U18': [], 'SENIOR': [], 'לא מוגדר': [],
    };
    currentPlayers.forEach(p => { groups[p.ageCategory].push(p); });
    return groups;
  }, [currentPlayers]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">טוען...</p></div>;
  }

  const handleMovePlayer = async (playerId: string, targetCategory: AgeCategory) => {
    const targetCat = AGE_CATEGORIES.find(c => c.key === targetCategory);
    if (!targetCat || targetCategory === 'לא מוגדר') return;
    
    // Set age to the max age of the target category
    const newAge = targetCat.maxAge === 999 ? 19 : targetCat.maxAge;
    
    const { error } = await supabase
      .from('profiles')
      .update({ age: newAge })
      .eq('user_id', playerId);
    
    if (error) {
      toast.error('שגיאה בהעברת השחקן');
    } else {
      toast.success(`השחקן הועבר ל-${targetCategory}`);
      refetch();
    }
  };

  const renderPlayerCards = (playersToShow: PlayerDataItem[]) => (
    <div className="grid gap-4 md:grid-cols-2">
      {playersToShow.map((p, i) => (
        <div
          key={p.id}
          className="gradient-card rounded-xl p-6 text-right transition-all hover:shadow-lg animate-fade-in border border-accent/20"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {p.is_demo && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent font-medium">דמו</span>
              )}
              {p.trend === 'up' && <TrendingUp className="h-5 w-5 text-success" />}
              {p.trend === 'down' && <TrendingDown className="h-5 w-5 text-destructive" />}
              {p.trend === 'neutral' && <Minus className="h-5 w-5 text-muted-foreground" />}
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">{p.display_name}</h3>
              <p className="text-sm text-muted-foreground">{p.position} · {p.team}</p>
            </div>
          </div>
          <div className="mt-4 flex gap-6 justify-end">
            <div className="text-center">
              <p className="text-2xl font-bold text-accent">{p.avgScore.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">ציון ממוצע</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{p.sessionsCount}</p>
              <p className="text-xs text-muted-foreground">סשנים</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{p.age ?? '-'}</p>
              <p className="text-xs text-muted-foreground">גיל</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-end gap-2 flex-wrap">
            <Button variant="ghost" size="sm" onClick={() => setEditPlayer({ user_id: p.user_id, display_name: p.display_name, team: p.team, age: p.age })} className="text-muted-foreground h-8 w-8 p-0">
              <Pencil className="h-4 w-4" />
            </Button>
            <Select
              value=""
              onValueChange={(val) => handleMovePlayer(p.user_id, val as AgeCategory)}
            >
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <div className="flex items-center gap-1">
                  <ArrowLeftRight className="h-3 w-3" />
                  <span>העבר קטגוריה</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                {AGE_CATEGORIES.filter(c => c.key !== 'לא מוגדר' && c.key !== p.ageCategory).map(c => (
                  <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => navigate(`/player/${p.user_id}/shots`)} className="text-muted-foreground">
              <Target className="ml-1 h-4 w-4" />
              מעקב קליעה
            </Button>
            <Button size="sm" onClick={() => navigate(`/player/${p.user_id}`)} className="gradient-accent text-accent-foreground">
              פרופיל שחקן
            </Button>
          </div>
        </div>
      ))}
    </div>
  );

  const menuItems = [
    { label: 'מעקב קליעה כללי', icon: Crosshair, onClick: () => navigate('/shot-tracker') },
    { label: 'תוכניות עבודה', icon: Dumbbell, onClick: () => navigate('/workout-plans') },
    { label: 'Court IQ', icon: Brain, onClick: () => navigate('/courtiq/admin') },
    { label: 'ניהול משתמשים', icon: Shield, onClick: () => navigate('/manage-users') },
    { label: 'משימות', icon: ClipboardList, onClick: () => navigate('/admin-tasks') },
    { label: '🏆 פנטזי יורוליג', icon: Crown, onClick: () => setFantasyOpen(true) },
    { label: '💬 וואטסאפ פנטזי', icon: Users, onClick: () => window.open('https://chat.whatsapp.com/CcDosZDAL7OBReZ2ZR7gJV?mode=gi_t', '_blank') },
  ];

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-3xl font-bold text-foreground">לוח בקרה</h1>
              <p className="text-muted-foreground">ניהול שחקנים לפי מסלול ותפקיד</p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <Button onClick={() => setAddPlayerOpen(true)} className="gradient-accent text-accent-foreground">
              <Plus className="ml-2 h-4 w-4" />
              הוסף שחקן
            </Button>
            <div className="flex items-center gap-2 rounded-lg bg-card px-3 py-2">
              <Users className="h-4 w-4 text-accent" />
              <span className="font-semibold text-foreground text-sm">{players.length}</span>
            </div>
            <NotificationBell />
            <div className="relative">
              <Button variant="ghost" size="icon" onClick={() => setMenuOpen(!menuOpen)} className="text-muted-foreground hover:text-foreground">
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              {menuOpen && (
                <div className="absolute left-0 top-full mt-2 w-56 rounded-xl border border-border bg-card shadow-xl z-50 overflow-hidden animate-fade-in">
                  {menuItems.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => { item.onClick(); setMenuOpen(false); }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-right text-sm text-foreground hover:bg-accent/10 transition-colors"
                    >
                      <item.icon className="h-4 w-4 text-accent flex-shrink-0" />
                      {item.label}
                    </button>
                  ))}
                  <div className="border-t border-border" />
                  <button
                    onClick={() => { logout(); setMenuOpen(false); }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-right text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4 flex-shrink-0" />
                    יציאה
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section Toggle */}
        <div className="mb-6 flex gap-3">
          <button
            onClick={() => { setActiveSection('premium'); setSelectedCategory(null); }}
            className={`flex items-center gap-2 rounded-xl px-5 py-3 font-bold text-sm transition-all ${
              activeSection === 'premium'
                ? 'gradient-accent text-accent-foreground shadow-lg'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <Crown className="h-5 w-5" />
            ליווי אישי מלא
            <Badge variant="secondary" className="mr-1">{premiumPlayers.length}</Badge>
          </button>
          <button
            onClick={() => { setActiveSection('basic'); setSelectedCategory(null); }}
            className={`flex items-center gap-2 rounded-xl px-5 py-3 font-bold text-sm transition-all ${
              activeSection === 'basic'
                ? 'gradient-accent text-accent-foreground shadow-lg'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <Target className="h-5 w-5" />
            מעקב קליעות + Court IQ
            <Badge variant="secondary" className="mr-1">{basicPlayers.length}</Badge>
          </button>
        </div>

        <div className="mb-10">
          {selectedCategory === null ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {AGE_CATEGORIES.filter(cat => cat.key !== 'לא מוגדר' || groupedPlayers['לא מוגדר'].length > 0).map((cat, i) => {
                  const catPlayers = groupedPlayers[cat.key];
                  const isEmpty = catPlayers.length === 0;
                  return (
                    <button
                      key={cat.key}
                      onClick={() => setSelectedCategory(cat.key)}
                      className={`gradient-card rounded-2xl p-6 text-center transition-all hover:scale-[1.03] hover:shadow-xl animate-fade-in border ${isEmpty ? 'border-border/30 opacity-70' : 'border-accent/30'}`}
                      style={{ animationDelay: `${i * 80}ms` }}
                    >
                      <span className="text-4xl block mb-3">{cat.emoji}</span>
                      <h3 className="text-2xl font-black text-foreground mb-1">{cat.label}</h3>
                      <Badge variant={isEmpty ? 'outline' : 'secondary'} className="text-sm font-bold">
                        {catPlayers.length} שחקנים
                      </Badge>
                    </button>
                  );
                })}
              </div>
              {currentPlayers.length === 0 && (
                <div className="gradient-card rounded-xl p-8 text-center mt-4">
                  <p className="text-muted-foreground">
                    {activeSection === 'premium'
                      ? 'אין שחקני ליווי אישי עדיין.'
                      : 'אין שחקני מעקב קליעות עדיין.'}
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <div />
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-bold text-foreground">{selectedCategory}</h3>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(null)} className="text-muted-foreground">
                    חזרה לקטגוריות
                    <ArrowRight className="mr-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
              {groupedPlayers[selectedCategory].length === 0 ? (
                <div className="gradient-card rounded-xl p-8 text-center">
                  <p className="text-muted-foreground">אין שחקנים בקטגוריה זו.</p>
                </div>
              ) : (
                renderPlayerCards(groupedPlayers[selectedCategory])
              )}
            </>
          )}
        </div>
      </div>
      <AddPlayerDialog open={addPlayerOpen} onOpenChange={setAddPlayerOpen} onSaved={refetch} />
      <EditPlayerDialog open={!!editPlayer} onOpenChange={(o) => { if (!o) setEditPlayer(null); }} player={editPlayer} onSaved={refetch} />
      <FantasyInfoDialog open={fantasyOpen} onOpenChange={setFantasyOpen} />
    </div>
  );
};

export default CoachDashboard;
