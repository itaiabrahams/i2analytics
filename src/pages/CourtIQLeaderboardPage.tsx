import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Trophy, Flame, Crown, Medal, ChevronLeft, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { LeaderboardEntry } from '@/lib/courtiq-types';

const periods = [
  { value: 'daily', label: 'יומי' },
  { value: 'weekly', label: 'שבועי' },
  { value: 'all_time', label: 'כל הזמנים' },
];

const getMedalStyle = (rank: number) => {
  switch (rank) {
    case 1: return { bg: 'bg-yellow-500/20 border-yellow-500/50', icon: '👑', text: 'text-yellow-400' };
    case 2: return { bg: 'bg-gray-400/20 border-gray-400/50', icon: '🥈', text: 'text-gray-300' };
    case 3: return { bg: 'bg-amber-700/20 border-amber-700/50', icon: '🥉', text: 'text-amber-600' };
    default: return { bg: '', icon: '', text: '' };
  }
};

const CourtIQLeaderboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [period, setPeriod] = useState('weekly');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [period]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    const { data } = await supabase.rpc('get_courtiq_leaderboard' as any, { _period: period });
    setEntries((data as LeaderboardEntry[]) || []);
    setLoading(false);
  };

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('courtiq-leaderboard')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'courtiq_answers' }, () => {
        fetchLeaderboard();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [period]);

  const handleShare = async (entry: LeaderboardEntry, rank: number) => {
    const text = `🏀 COURT IQ — מקום ${rank} בדירוג ה${periods.find(p => p.value === period)?.label}!\n⭐ ${entry.total_points} נקודות | 🎯 ${entry.accuracy}% דיוק\n${window.location.origin}/courtiq`;
    if (navigator.share) {
      await navigator.share({ text });
    } else {
      await navigator.clipboard.writeText(text);
      toast.success('הועתק!');
    }
  };

  const myRank = entries.findIndex(e => e.player_id === user?.id) + 1;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => navigate('/courtiq')} className="h-8 w-8">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Trophy className="h-5 w-5 text-accent" /> COURT IQ דירוג
        </h1>
      </div>

      <Tabs value={period} onValueChange={setPeriod} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-3 grid grid-cols-3">
          {periods.map(p => (
            <TabsTrigger key={p.value} value={p.value}>{p.label}</TabsTrigger>
          ))}
        </TabsList>

        <div className="flex-1 p-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>אין נתונים עדיין</p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry, i) => {
                const rank = i + 1;
                const medal = getMedalStyle(rank);
                const isMe = entry.player_id === user?.id;
                return (
                  <motion.div
                    key={entry.player_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      isMe ? 'border-accent bg-accent/10 ring-1 ring-accent/30' :
                      medal.bg ? `${medal.bg} border` : 'border-border bg-card'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${medal.text || 'text-muted-foreground'}`}>
                      {medal.icon || rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground truncate">
                        {entry.display_name} {isMe && <span className="text-xs text-accent">(אתה)</span>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-0.5"><Flame className="h-3 w-3 text-orange-500" />{entry.current_streak}</span>
                        <span>🎯 {entry.accuracy}%</span>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-foreground">{entry.total_points}</div>
                      <div className="text-xs text-muted-foreground">נקודות</div>
                    </div>
                    {isMe && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-accent" onClick={() => handleShare(entry, rank)}>
                        <Share2 className="h-4 w-4" />
                      </Button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </Tabs>
    </div>
  );
};

export default CourtIQLeaderboardPage;
