import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Star, Clock, Brain, Send, Trophy, Share2, Lightbulb, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { ActiveQuestion, CourtIQStats, AnswerResult, OptionKey, CourtIQCategory } from '@/lib/courtiq-types';

// Deterministic shuffle based on playerId + questionId to prevent copying
function getShuffledOptions(questionId: string, playerId: string) {
  let seed = 0;
  const str = questionId + playerId;
  for (let i = 0; i < str.length; i++) {
    seed = ((seed << 5) - seed) + str.charCodeAt(i);
    seed |= 0;
  }
  const keys: OptionKey[] = ['a', 'b', 'c', 'd'];
  const shuffled = [...keys];
  for (let i = shuffled.length - 1; i > 0; i--) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const j = seed % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled; // shuffled[displayIndex] = originalKey
}

const TIMER_DURATION = 15000;

const CourtIQPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<ActiveQuestion[]>([]);
  const [stats, setStats] = useState<CourtIQStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [answering, setAnswering] = useState(false);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestText, setSuggestText] = useState('');
  const [suggestOptions, setSuggestOptions] = useState({ a: '', b: '', c: '', d: '' });
  const [suggestCorrect, setSuggestCorrect] = useState<string>('');
  const [suggestCategory, setSuggestCategory] = useState('');
  const [categories, setCategories] = useState<CourtIQCategory[]>([]);
  const [nextQuestionCountdown, setNextQuestionCountdown] = useState('');

  const currentQuestion = questions.find(q => !q.already_answered);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [questionsRes, statsRes, catsRes] = await Promise.all([
      supabase.rpc('get_active_courtiq_questions' as any),
      supabase.from('courtiq_player_stats' as any).select('*').eq('player_id', user.id).maybeSingle(),
      supabase.from('courtiq_categories' as any).select('*'),
    ]);
    if (questionsRes.data) setQuestions(questionsRes.data as unknown as ActiveQuestion[]);
    if (statsRes.data) setStats(statsRes.data as unknown as CourtIQStats);
    if (catsRes.data) setCategories(catsRes.data as unknown as CourtIQCategory[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Timer logic
  useEffect(() => {
    if (!currentQuestion || result || answering) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    startTimeRef.current = Date.now();
    setTimeLeft(TIMER_DURATION);
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, TIMER_DURATION - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        handleAnswer('timeout');
      }
    }, 50);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentQuestion?.id, result, answering]);

  // Countdown to next hour
  useEffect(() => {
    // Show countdown when no unanswered question available
    const shouldShowCountdown = !currentQuestion || result;
    if (!shouldShowCountdown) {
      setNextQuestionCountdown('');
      return;
    }
    const updateCountdown = () => {
      const now = new Date();
      // Next full hour
      const next = new Date(now);
      next.setHours(next.getHours() + 1, 0, 0, 0);
      const diff = next.getTime() - now.getTime();
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setNextQuestionCountdown(`${mins}:${secs.toString().padStart(2, '0')}`);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [currentQuestion, result]);

  const handleAnswer = async (option: string) => {
    if (answering || result || !currentQuestion) return;
    setAnswering(true);
    setSelectedOption(option);
    if (timerRef.current) clearInterval(timerRef.current);

    const answerTimeMs = Math.min(Date.now() - startTimeRef.current, TIMER_DURATION);

    const { data, error } = await supabase.rpc('submit_courtiq_answer' as any, {
      _question_id: currentQuestion.id,
      _selected_option: option,
      _answer_time_ms: answerTimeMs,
    });

    if (error) {
      toast.error(error.message);
      setAnswering(false);
      return;
    }
    if ((data as any)?.error) {
      toast.error((data as any).error);
      setAnswering(false);
      return;
    }

    setResult(data as AnswerResult);
    setAnswering(false);
    // Refresh stats
    const { data: newStats } = await supabase.from('courtiq_player_stats' as any).select('*').eq('player_id', user!.id).maybeSingle();
    if (newStats) setStats(newStats as unknown as CourtIQStats);
  };

  const handleNextQuestion = () => {
    setResult(null);
    setSelectedOption(null);
    setTimeLeft(TIMER_DURATION);
    // Mark question as answered in local state
    setQuestions(prev => prev.map(q => q.id === currentQuestion?.id ? { ...q, already_answered: true } : q));
  };

  const handleShare = async () => {
    const text = result?.is_correct
      ? `🏀 COURT IQ | עניתי נכון וצברתי ${result.points_earned} נקודות! 🔥\nStreak: ${stats?.current_streak || 0} ימים\n${window.location.origin}/courtiq`
      : `🏀 COURT IQ | אתגר הידע הכדורסלני!\n${window.location.origin}/courtiq`;
    if (navigator.share) {
      await navigator.share({ text });
    } else {
      await navigator.clipboard.writeText(text);
      toast.success('הקישור הועתק!');
    }
  };

  const handleSuggestSubmit = async () => {
    if (!suggestText.trim()) return;
    const { error } = await supabase.from('courtiq_suggestions' as any).insert({
      player_id: user!.id,
      question_text: suggestText,
      option_a: suggestOptions.a || null,
      option_b: suggestOptions.b || null,
      option_c: suggestOptions.c || null,
      option_d: suggestOptions.d || null,
      correct_option: suggestCorrect || null,
      category_id: suggestCategory || null,
    });
    if (error) { toast.error('שגיאה בשליחה'); return; }
    toast.success('ההצעה נשלחה! המאמן יבדוק אותה.');
    setSuggestOpen(false);
    setSuggestText('');
    setSuggestOptions({ a: '', b: '', c: '', d: '' });
    setSuggestCorrect('');
  };

  const seconds = Math.ceil(timeLeft / 1000);
  const timerProgress = timeLeft / TIMER_DURATION;
  const isUrgent = seconds <= 5 && !result;
  const circumference = 2 * Math.PI * 45;

  // Calculate time until question expires
  const getExpiryWarning = () => {
    if (!currentQuestion) return null;
    const expiresAt = new Date(currentQuestion.expires_at).getTime();
    const now = Date.now();
    const diff = expiresAt - now;
    const mins = Math.floor(diff / 60000);
    if (mins <= 5 && mins >= 0) return `השאלה נסגרת בעוד ${mins} דקות`;
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Stats Bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="h-8 w-8 text-muted-foreground">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="font-bold text-sm text-foreground">
              {stats ? (stats.questions_today >= 3 ? stats.current_streak + 1 : stats.current_streak) : 0}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-yellow-500" />
            <span className="font-bold text-sm text-foreground">{stats?.total_points || 0}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => navigate('/courtiq/leaderboard')} className="text-muted-foreground gap-1 h-8 px-2 text-xs">
            <Trophy className="h-3.5 w-3.5" /> דירוג
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/courtiq/profile')} className="text-muted-foreground gap-1 h-8 px-2 text-xs">
            <Brain className="h-3.5 w-3.5" /> פרופיל
          </Button>
        </div>
      </div>

      {/* Streak reminder */}
      {stats && stats.questions_today < 3 && (
        <div className="mx-4 mt-3 px-3 py-2 rounded-lg bg-secondary text-sm text-muted-foreground text-center">
          ענה על עוד {3 - stats.questions_today} שאלות כדי לשמור על ה-Streak 🔥
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* No active question */}
          {!currentQuestion && !result && (
            <motion.div key="no-question" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-center space-y-6">
              <Brain className="h-20 w-20 mx-auto text-muted-foreground opacity-30" />
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2">אין שאלה פעילה כרגע</h2>
                <p className="text-muted-foreground">השאלה הבאה בעוד <span className="font-mono text-accent font-bold">{nextQuestionCountdown}</span></p>
              </div>
              <Dialog open={suggestOpen} onOpenChange={setSuggestOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2"><Lightbulb className="h-4 w-4" /> הצע שאלה</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader><DialogTitle>הצע שאלה חדשה</DialogTitle></DialogHeader>
                  <div className="space-y-3 mt-2">
                    <Textarea placeholder="טקסט השאלה..." value={suggestText} onChange={e => setSuggestText(e.target.value)} />
                    <Select value={suggestCategory} onValueChange={setSuggestCategory}>
                      <SelectTrigger><SelectValue placeholder="קטגוריה" /></SelectTrigger>
                      <SelectContent>
                        {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {(['a', 'b', 'c', 'd'] as const).map(key => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="font-bold text-sm w-6">{key.toUpperCase()}</span>
                        <Input placeholder={`תשובה ${key.toUpperCase()}`} value={suggestOptions[key]} onChange={e => setSuggestOptions(p => ({ ...p, [key]: e.target.value }))} />
                      </div>
                    ))}
                    <Select value={suggestCorrect} onValueChange={setSuggestCorrect}>
                      <SelectTrigger><SelectValue placeholder="תשובה נכונה" /></SelectTrigger>
                      <SelectContent>
                        {(['a', 'b', 'c', 'd'] as const).map(k => <SelectItem key={k} value={k}>{k.toUpperCase()}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button onClick={handleSuggestSubmit} className="w-full gradient-accent text-accent-foreground"><Send className="h-4 w-4 ml-2" /> שלח הצעה</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </motion.div>
          )}

          {/* Active question */}
          {currentQuestion && !result && (
            <motion.div key="question" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="w-full max-w-lg space-y-4 sm:space-y-6">
              {/* Expiry warning */}
              {getExpiryWarning() && (
                <div className="text-center text-sm text-destructive animate-pulse font-medium">
                  ⏰ {getExpiryWarning()}
                </div>
              )}

              {/* Category badge */}
              <div className="flex justify-center">
                <span className="px-3 py-1 rounded-full text-sm font-semibold text-white" style={{ backgroundColor: currentQuestion.category_color || '#3b82f6' }}>
                  {currentQuestion.category_icon} {currentQuestion.category_name || 'כללי'}
                </span>
              </div>

              {/* Timer */}
              <div className="flex justify-center">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="45" fill="none" strokeWidth="6" className="stroke-muted" />
                    <circle cx="50" cy="50" r="45" fill="none" strokeWidth="6"
                      stroke={isUrgent ? 'hsl(0, 72%, 51%)' : 'hsl(25, 95%, 53%)'}
                      strokeDasharray={circumference}
                      strokeDashoffset={circumference * (1 - timerProgress)}
                      strokeLinecap="round"
                      className={`transition-all duration-100 ${isUrgent ? 'animate-pulse' : ''}`}
                    />
                  </svg>
                  <div className={`absolute inset-0 flex items-center justify-center ${isUrgent ? 'animate-pulse' : ''}`}>
                    <span className={`text-2xl sm:text-3xl font-black ${isUrgent ? 'text-destructive' : 'text-foreground'}`}>{seconds}</span>
                  </div>
                </div>
              </div>

              {/* Question */}
              <div className="text-center space-y-4">
                <h2 className="text-lg sm:text-xl font-bold text-foreground leading-relaxed">{currentQuestion.question_text}</h2>
                {currentQuestion.media_url && (
                  <div className="flex justify-center">
                    {currentQuestion.media_type === 'video' ? (
                      <video src={currentQuestion.media_url} autoPlay muted loop className="rounded-xl max-h-48 w-auto" />
                    ) : (
                      <img src={currentQuestion.media_url} alt="" className="rounded-xl max-h-48 w-auto" />
                    )}
                  </div>
                )}
              </div>

              {/* Options - shuffled per player */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {(() => {
                  const shuffledKeys = user ? getShuffledOptions(currentQuestion.id, user.id) : (['a', 'b', 'c', 'd'] as OptionKey[]);
                  return shuffledKeys.map((originalKey, displayIndex) => {
                    const displayLabel = ['A', 'B', 'C', 'D'][displayIndex];
                    const optionText = currentQuestion[`option_${originalKey}` as keyof ActiveQuestion] as string;
                    return (
                      <motion.button
                        key={originalKey}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleAnswer(originalKey)}
                        disabled={answering}
                        className="p-3 sm:p-4 rounded-xl border-2 border-border bg-card hover:border-accent hover:bg-secondary transition-all text-right disabled:opacity-50 min-h-[60px]"
                      >
                        <span className="text-xs font-bold text-accent mb-0.5 block">{displayLabel}</span>
                        <span className="text-xs sm:text-sm font-medium text-foreground">{optionText}</span>
                      </motion.button>
                    );
                  });
                })()}
              </div>
            </motion.div>
          )}

          {/* Result */}
          {result && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="w-full max-w-lg space-y-4 sm:space-y-6 text-center">
              {/* Correct/Wrong indicator */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 10, stiffness: 200 }}
                className={`w-16 h-16 sm:w-24 sm:h-24 rounded-full mx-auto flex items-center justify-center text-3xl sm:text-4xl ${
                  result.is_correct ? 'bg-success/20 border-2 border-success' : 'bg-destructive/20 border-2 border-destructive'
                }`}
              >
                {result.is_correct ? '✅' : '❌'}
              </motion.div>

              <motion.h2 initial={{ y: 20 }} animate={{ y: 0 }} className="text-xl sm:text-2xl font-black">
                {result.is_correct ? 'נכון!' : 'לא נכון'}
              </motion.h2>

              {/* Points */}
              {result.points_earned > 0 && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }} className="text-2xl sm:text-3xl font-black text-accent">
                  +{result.points_earned}
                  {result.bonus_points > 0 && <span className="text-base text-yellow-500 block">+{result.bonus_points} בונוס יומי! 🎉</span>}
                </motion.div>
              )}

              {/* Correct answer if wrong */}
              {!result.is_correct && currentQuestion && (
                <div className="text-sm text-muted-foreground">
                  התשובה הנכונה: <span className="font-bold text-foreground">{currentQuestion[`option_${result.correct_option}` as keyof ActiveQuestion] as string}</span>
                </div>
              )}

              {/* Explanation */}
              {result.explanation && (
                <div className="gradient-card rounded-xl p-3 sm:p-4 text-sm text-muted-foreground">
                  💡 {result.explanation}
                </div>
              )}

              {/* Stats */}
              <div className="text-xs sm:text-sm text-muted-foreground">
                  {result.is_correct
                  ? `${result.correct_percentage}% מהשחקנים ענו נכון · ${result.correct_percentage < 50 ? 'אתה בין המובילים! 🌟' : 'יפה מאוד! 💪'}`
                  : `${100 - result.correct_percentage}% גם טעו · ${result.correct_percentage < 50 ? 'זו שאלה קשה! 💪' : 'בפעם הבאה! 🔥'}`}
              </div>

              {/* Correct streak badge */}
              {result.correct_streak >= 5 && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent/20 text-accent text-xs sm:text-sm font-bold">
                  🔥 {result.correct_streak} תשובות נכונות ברצף!
                </motion.div>
              )}

              {/* Countdown to next question */}
              {nextQuestionCountdown && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>השאלה הבאה בעוד <span className="font-mono text-accent font-bold">{nextQuestionCountdown}</span></span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 sm:gap-3 justify-center pt-2 sm:pt-4">
                <Button onClick={handleShare} variant="outline" size="sm" className="gap-1.5 h-9">
                  <Share2 className="h-3.5 w-3.5" /> שתף
                </Button>
                <Button onClick={() => navigate('/courtiq/leaderboard')} variant="outline" size="sm" className="gap-1.5 h-9">
                  <Trophy className="h-3.5 w-3.5" /> דירוג
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Suggest question button (when viewing question) */}
      {currentQuestion && !result && (
        <div className="p-4 text-center">
          <Dialog open={suggestOpen} onOpenChange={setSuggestOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground text-xs gap-1">
                <Lightbulb className="h-3 w-3" /> הצע שאלה
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>הצע שאלה חדשה</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <Textarea placeholder="טקסט השאלה..." value={suggestText} onChange={e => setSuggestText(e.target.value)} />
                <Select value={suggestCategory} onValueChange={setSuggestCategory}>
                  <SelectTrigger><SelectValue placeholder="קטגוריה" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {(['a', 'b', 'c', 'd'] as const).map(key => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="font-bold text-sm w-6">{key.toUpperCase()}</span>
                    <Input placeholder={`תשובה ${key.toUpperCase()}`} value={suggestOptions[key]} onChange={e => setSuggestOptions(p => ({ ...p, [key]: e.target.value }))} />
                  </div>
                ))}
                <Select value={suggestCorrect} onValueChange={setSuggestCorrect}>
                  <SelectTrigger><SelectValue placeholder="תשובה נכונה" /></SelectTrigger>
                  <SelectContent>
                    {(['a', 'b', 'c', 'd'] as const).map(k => <SelectItem key={k} value={k}>{k.toUpperCase()}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button onClick={handleSuggestSubmit} className="w-full gradient-accent text-accent-foreground"><Send className="h-4 w-4 ml-2" /> שלח הצעה</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
};

export default CourtIQPage;
