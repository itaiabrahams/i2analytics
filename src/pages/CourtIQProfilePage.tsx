import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Flame, Star, Target, Brain, Trophy, Share2, ChevronLeft, TrendingUp, Zap, Award, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Cropper from 'react-easy-crop';
import type { CourtIQStats, LeaderboardEntry } from '@/lib/courtiq-types';
import type { Area } from 'react-easy-crop';

interface Achievement {
  id: string;
  title: string;
  icon: string;
  unlocked: boolean;
  description: string;
}

const CourtIQProfilePage = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<CourtIQStats | null>(null);
  const [weeklyRank, setWeeklyRank] = useState(0);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!user) return;
    const [statsRes, lbRes, profileRes] = await Promise.all([
      supabase.from('courtiq_player_stats' as any).select('*').eq('player_id', user.id).maybeSingle(),
      supabase.rpc('get_courtiq_leaderboard' as any, { _period: 'weekly' }),
      supabase.from('profiles').select('avatar_url').eq('user_id', user.id).maybeSingle(),
    ]);
    if (statsRes.data) setStats(statsRes.data as unknown as CourtIQStats);
    if (lbRes.data) {
      const entries = lbRes.data as LeaderboardEntry[];
      const rank = entries.findIndex(e => e.player_id === user.id) + 1;
      setWeeklyRank(rank || 0);
    }
    if (profileRes.data) setAvatarUrl((profileRes.data as any).avatar_url);
    setLoading(false);
  };

  const [cropImage, setCropImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('הקובץ גדול מדי (מקסימום 5MB)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCropImage(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getCroppedBlob = async (): Promise<Blob> => {
    const image = new Image();
    image.src = cropImage!;
    await new Promise(r => { image.onload = r; });
    const canvas = document.createElement('canvas');
    const size = 400;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const { x, y, width, height } = croppedAreaPixels!;
    ctx.drawImage(image, x, y, width, height, 0, 0, size, size);
    return new Promise(resolve => canvas.toBlob(b => resolve(b!), 'image/jpeg', 0.9));
  };

  const handleCropSave = async () => {
    if (!user || !croppedAreaPixels) return;
    setUploading(true);
    try {
      const blob = await getCroppedBlob();
      const path = `${user.id}/avatar.jpg`;
      const { error: uploadErr } = await supabase.storage.from('avatars').upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
      if (uploadErr) throw uploadErr;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;
      await supabase.from('profiles').update({ avatar_url: urlWithCacheBust } as any).eq('user_id', user.id);
      setAvatarUrl(urlWithCacheBust);
      setCropImage(null);
      toast.success('התמונה עודכנה!');
    } catch (err) {
      console.error(err);
      toast.error('שגיאה בהעלאת התמונה');
    } finally {
      setUploading(false);
    }
  };

  const accuracy = stats && stats.total_answered > 0
    ? Math.round((stats.total_correct / stats.total_answered) * 100)
    : 0;

  const getAchievements = (): Achievement[] => {
    if (!stats) return [];
    const streak = stats.current_streak;
    const points = stats.total_points;
    return [
      { id: '3day', title: '3 ימים רצופים 🔥', icon: '🔥', unlocked: streak >= 3, description: 'שמור על Streak של 3 ימים' },
      { id: '7day', title: '7 ימים רצופים 🌟', icon: '🌟', unlocked: streak >= 7, description: 'שמור על Streak של 7 ימים' },
      { id: '14day', title: '14 ימים רצופים 💎', icon: '💎', unlocked: streak >= 14, description: 'שמור על Streak של 14 ימים' },
      { id: '30day', title: '30 ימים רצופים 👑', icon: '👑', unlocked: streak >= 30, description: 'שמור על Streak של 30 ימים' },
      { id: 'tact80', title: 'אשף הטקטיקה 🧠', icon: '🧠', unlocked: accuracy >= 80 && stats.total_answered >= 10, description: '80% דיוק עם 10+ שאלות' },
      { id: 'flash', title: 'בזק ⚡', icon: '⚡', unlocked: stats.correct_streak >= 10, description: '10 תשובות נכונות ברצף' },
      { id: '1k', title: '1,000 נקודות 🏅', icon: '🏅', unlocked: points >= 1000, description: 'צבור 1,000 נקודות' },
      { id: '5k', title: '5,000 נקודות 🏆', icon: '🏆', unlocked: points >= 5000, description: 'צבור 5,000 נקודות' },
      { id: '10k', title: '10,000 נקודות 💰', icon: '💰', unlocked: points >= 10000, description: 'צבור 10,000 נקודות' },
    ];
  };

  const achievements = getAchievements();
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  const getAchievementPhrase = () => {
    if (!stats) return '';
    if (stats.total_points >= 10000) return 'רק 1% מהשחקנים הגיעו לרמה הזו 🏆';
    if (stats.total_points >= 5000) return 'רק 5% מהשחקנים הגיעו לרמה הזו 💎';
    if (stats.total_points >= 1000) return 'רק 15% מהשחקנים הגיעו לרמה הזו 🌟';
    if (accuracy >= 80) return 'אחוז דיוק מרשים! אתה מבין כדורסל 🧠';
    if (stats.current_streak >= 7) return 'Streak מדהים! המשך ככה 🔥';
    return 'המשך לענות ולהתקדם! 💪';
  };

  const appLink = 'https://i2analytics.lovable.app/courtiq';

  const handleShareCard = async () => {
    const text = `🏀 COURT IQ | כרטיס שחקן\n\n` +
      `👤 ${profile?.display_name}\n` +
      `🏀 ${profile?.position || 'שחקן'} · ${profile?.team || ''}\n` +
      `🔥 Streak: ${stats?.current_streak || 0} ימים\n` +
      `⭐ ${stats?.total_points || 0} נקודות\n` +
      `🎯 דיוק: ${accuracy}%\n` +
      `📊 שאלות שנענו: ${stats?.total_answered || 0}\n` +
      `✅ תשובות נכונות: ${stats?.total_correct || 0}\n` +
      `🏆 מקום ${weeklyRank || '?'} בדירוג השבועי\n` +
      `⚡ רצף נכונות: ${stats?.correct_streak || 0}\n` +
      `🔥 Streak שיא: ${stats?.longest_streak || 0}\n\n` +
      `${getAchievementPhrase()}\n\n` +
      `🏀 בוא לשחק גם! 👇\n` +
      appLink;

    if (navigator.share) {
      await navigator.share({ title: 'COURT IQ | כרטיס שחקן', text, url: appLink });
    } else {
      await navigator.clipboard.writeText(text);
      toast.success('הכרטיס הועתק ללוח!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold text-foreground">פרופיל COURT IQ</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Player Card */}
        <motion.div ref={cardRef} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border-2 border-accent/30 p-6"
          style={{ background: 'linear-gradient(135deg, hsl(220, 35%, 14%), hsl(220, 60%, 10%), hsl(25, 40%, 12%))' }}
        >
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-4 left-4 text-6xl opacity-20">🏀</div>
            <div className="absolute bottom-4 right-4 text-4xl opacity-20">⭐</div>
          </div>

          <div className="relative z-10 text-center space-y-3">
            <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleFileSelect} />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-3xl gradient-accent cursor-pointer relative overflow-hidden group"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                profile?.display_name?.[0]?.toUpperCase() || '?'
              )}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-5 w-5 text-white" />
              </div>
              {uploading && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /></div>}
            </div>
            <div>
              <h2 className="text-xl font-black text-foreground">{profile?.display_name}</h2>
              {profile?.team && <p className="text-sm text-muted-foreground">{profile.team}</p>}
            </div>

            <div className="grid grid-cols-4 gap-2 pt-2">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="font-black text-lg text-foreground">{stats?.current_streak || 0}</span>
                </div>
                <p className="text-xs text-muted-foreground">Streak</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="font-black text-lg text-foreground">{stats?.total_points || 0}</span>
                </div>
                <p className="text-xs text-muted-foreground">נקודות</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Trophy className="h-4 w-4 text-accent" />
                  <span className="font-black text-lg text-foreground">#{weeklyRank || '—'}</span>
                </div>
                <p className="text-xs text-muted-foreground">דירוג</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Target className="h-4 w-4 text-success" />
                  <span className="font-black text-lg text-foreground">{accuracy}%</span>
                </div>
                <p className="text-xs text-muted-foreground">דיוק</p>
              </div>
            </div>

            <p className="text-sm text-accent font-medium pt-1">{getAchievementPhrase()}</p>
            {profile?.position && (
              <p className="text-xs text-muted-foreground">{profile.position} · {profile.team || ''}</p>
            )}
            <p className="text-[10px] text-muted-foreground/50 pt-2">🏀 i2analytics.lovable.app/courtiq</p>
          </div>
        </motion.div>

        <Button onClick={handleShareCard} className="w-full gap-2" variant="outline">
          <Share2 className="h-4 w-4" /> שתף כרטיס שחקן
        </Button>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-5 w-5 mx-auto mb-1 text-accent" />
              <p className="text-2xl font-black text-foreground">{stats?.total_answered || 0}</p>
              <p className="text-xs text-muted-foreground">שאלות שנענו</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Zap className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
              <p className="text-2xl font-black text-foreground">{stats?.correct_streak || 0}</p>
              <p className="text-xs text-muted-foreground">רצף נכונות</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Flame className="h-5 w-5 mx-auto mb-1 text-orange-500" />
              <p className="text-2xl font-black text-foreground">{stats?.longest_streak || 0}</p>
              <p className="text-xs text-muted-foreground">Streak שיא</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Award className="h-5 w-5 mx-auto mb-1 text-purple-500" />
              <p className="text-2xl font-black text-foreground">{unlockedCount}/{achievements.length}</p>
              <p className="text-xs text-muted-foreground">הישגים</p>
            </CardContent>
          </Card>
        </div>

        {/* Achievements */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <Award className="h-5 w-5 text-accent" /> הישגים
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {achievements.map(ach => (
                <motion.div
                  key={ach.id}
                  whileTap={{ scale: 0.95 }}
                  className={`p-3 rounded-xl text-center transition-all ${
                    ach.unlocked ? 'bg-accent/10 border border-accent/30' : 'bg-muted/30 border border-border opacity-50'
                  }`}
                >
                  <span className="text-2xl block mb-1">{ach.icon}</span>
                  <p className="text-[10px] font-medium text-foreground leading-tight">{ach.title}</p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Crop Dialog */}
      <Dialog open={!!cropImage} onOpenChange={(open) => { if (!open) setCropImage(null); }}>
        <DialogContent className="max-w-sm p-0 overflow-hidden">
          <DialogTitle className="px-4 pt-4 text-base font-bold text-foreground">כוון את התמונה</DialogTitle>
          <div className="relative w-full h-72 bg-black">
            {cropImage && (
              <Cropper
                image={cropImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>
          <div className="px-4 pb-4 space-y-3">
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-[hsl(var(--accent))]"
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setCropImage(null)}>ביטול</Button>
              <Button className="flex-1 gradient-accent text-accent-foreground" onClick={handleCropSave} disabled={uploading}>
                {uploading ? 'שומר...' : 'שמור תמונה'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourtIQProfilePage;
