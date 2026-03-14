import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, TrendingUp, TrendingDown, Minus, Users, Plus, Shield, Brain, ArrowRight } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import { usePlayers, usePlayerSessionCounts } from '@/hooks/useSupabaseData';
import AddPlayerDialog from '@/components/AddPlayerDialog';
import { Badge } from '@/components/ui/badge';

type AgeCategory = 'U14' | 'U15' | 'U16' | 'U18' | 'SENIOR' | 'לא מוגדר';

const AGE_CATEGORIES: { key: AgeCategory; label: string; minAge: number; maxAge: number; emoji: string }[] = [
  { key: 'U14', label: 'U14', minAge: 0, maxAge: 13, emoji: '🏀' },
  { key: 'U15', label: 'U15', minAge: 14, maxAge: 14, emoji: '🏀' },
  { key: 'U16', label: 'U16', minAge: 15, maxAge: 15, emoji: '🏀' },
  { key: 'U18', label: 'U18', minAge: 16, maxAge: 17, emoji: '🏀' },
  { key: 'SENIOR', label: 'SENIOR', minAge: 18, maxAge: 99, emoji: '⭐' },
  { key: 'לא מוגדר', label: 'לא מוגדר', minAge: -1, maxAge: -1, emoji: '❓' },
];

function getAgeCategory(age: number | null): AgeCategory {
  if (age == null) return 'לא מוגדר';
  for (const cat of AGE_CATEGORIES) {
    if (cat.key === 'לא מוגדר') continue;
    if (age >= cat.minAge && age <= cat.maxAge) return cat.key;
  }
  return 'SENIOR';
}

const CoachDashboard = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const { players, loading, refetch } = usePlayers();
  const sessionCounts = usePlayerSessionCounts();
  const [addPlayerOpen, setAddPlayerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AgeCategory | null>(null);

  const myPlayers = players.filter(p => p.coach_id === user?.id || p.is_demo);

  const playerData = myPlayers.map(p => {
    const sc = sessionCounts[p.user_id] || { count: 0, avgScore: 0, latestScores: [] };
    let trend: 'up' | 'down' | 'neutral' = 'neutral';
    if (sc.latestScores.length >= 2) {
      trend = sc.latestScores[0] > sc.latestScores[1] ? 'up' : sc.latestScores[0] < sc.latestScores[1] ? 'down' : 'neutral';
    }
    return { ...p, sessionsCount: sc.count, avgScore: sc.avgScore, trend, ageCategory: getAgeCategory(p.age) };
  });

  const groupedPlayers = useMemo(() => {
    const groups: Record<AgeCategory, typeof playerData> = {
      'U14': [], 'U15': [], 'U16': [], 'U18': [], 'SENIOR': [], 'לא מוגדר': [],
    };
    playerData.forEach(p => {
      groups[p.ageCategory].push(p);
    });
    return groups;
  }, [playerData]);

  // Always show all 5 main age categories; only hide 'לא מוגדר' when empty
  const categoriesToShow = AGE_CATEGORIES.filter(cat => cat.key !== 'לא מוגדר' || groupedPlayers['לא מוגדר'].length > 0);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">טוען...</p></div>;
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">לוח בקרה</h1>
            <p className="text-muted-foreground">ניהול שחקנים וסשנים</p>
          </div>
          <div className="flex gap-3 items-center flex-wrap justify-end">
            <Button variant="outline" onClick={() => navigate('/courtiq/admin')} className="text-muted-foreground">
              <Brain className="ml-2 h-4 w-4" />
              Court IQ
            </Button>
            <Button variant="outline" onClick={() => navigate('/manage-users')} className="text-muted-foreground">
              <Shield className="ml-2 h-4 w-4" />
              ניהול משתמשים
            </Button>
            <Button onClick={() => setAddPlayerOpen(true)} className="gradient-accent text-accent-foreground">
              <Plus className="ml-2 h-4 w-4" />
              הוסף שחקן
            </Button>
            <div className="flex items-center gap-2 rounded-lg bg-card px-4 py-2">
              <Users className="h-5 w-5 text-accent" />
              <span className="font-semibold text-foreground">{myPlayers.length} שחקנים</span>
            </div>
            <NotificationBell />
            <Button variant="ghost" onClick={logout} className="text-muted-foreground hover:text-foreground">
              <LogOut className="ml-2 h-4 w-4" />
              יציאה
            </Button>
          </div>
        </div>

        {/* Category view or Player list view */}
        {selectedCategory === null ? (
          <>
            {/* Age Category Tiles */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {categoriesToShow.map((cat, i) => {
                const catPlayers = groupedPlayers[cat.key];
                return (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(cat.key)}
                    className="gradient-card rounded-2xl p-6 text-center transition-all hover:scale-[1.03] hover:shadow-xl animate-fade-in border border-border/50"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <span className="text-4xl block mb-3">{cat.emoji}</span>
                    <h2 className="text-2xl font-black text-foreground mb-1">{cat.label}</h2>
                    <Badge variant="secondary" className="text-sm font-bold">
                      {catPlayers.length} שחקנים
                    </Badge>
                  </button>
                );
              })}
            </div>

            {myPlayers.length === 0 && (
              <div className="gradient-card rounded-xl p-8 text-center mt-4">
                <p className="text-muted-foreground">אין שחקנים עדיין. לחץ על "הוסף שחקן" כדי להוסיף שחקן חדש.</p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Back + Category title */}
            <div className="flex items-center justify-between mb-6">
              <div />
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-foreground">{selectedCategory}</h2>
                <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(null)} className="text-muted-foreground">
                  חזרה לקטגוריות
                  <ArrowRight className="mr-2 h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Players in category */}
            <div className="grid gap-4 md:grid-cols-2">
              {groupedPlayers[selectedCategory].map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => navigate(`/player/${p.user_id}`)}
                  className="gradient-card rounded-xl p-6 text-right transition-all hover:scale-[1.02] hover:shadow-lg animate-fade-in"
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
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <AddPlayerDialog open={addPlayerOpen} onOpenChange={setAddPlayerOpen} onSaved={refetch} />
    </div>
  );
};

export default CoachDashboard;
