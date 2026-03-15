import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Target, Crown } from 'lucide-react';

type Mode = 'select' | 'login' | 'signup';
type SubscriptionTier = 'basic' | 'premium';
type PremiumPackage = 'single' | 'monthly' | 'seasonal';

const LoginPage = () => {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<Mode>('select');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'coach' | 'player'>('player');
  const [coachId, setCoachId] = useState('');
  const [teamCoachApproved, setTeamCoachApproved] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('basic');
  const [premiumPackage, setPremiumPackage] = useState<PremiumPackage | ''>('');
  const [coaches, setCoaches] = useState<{ user_id: string; display_name: string }[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    supabase
      .from('profiles')
      .select('user_id, display_name')
      .eq('role', 'coach')
      .eq('is_approved', true)
      .order('display_name')
      .then(({ data }) => {
        if (data) setCoaches(data);
      });
  }, []);

  const resetFields = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setPhone('');
    setRole('player');
    setCoachId('');
    setTeamCoachApproved(false);
    setSubscriptionTier('basic');
    setPremiumPackage('');
    setError('');
    setSuccess('');
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('יש למלא אימייל וסיסמה');
      return;
    }
    setIsLoading(true);
    setError('');
    const result = await login(email.trim(), password);
    if (result.error) setError(result.error);
    setIsLoading(false);
  };

  const handleSignup = async () => {
    if (!email.trim() || !password || !displayName.trim()) {
      setError('יש למלא את כל השדות');
      return;
    }
    if (password.length < 6) {
      setError('סיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }
    if (role === 'player' && subscriptionTier === 'premium' && !premiumPackage) {
      setError('יש לבחור חבילת ליווי אישי');
      return;
    }
    if (role === 'player' && subscriptionTier === 'premium' && !coachId && coaches.length > 0) {
      setError('יש לבחור מאמן מלווה');
      return;
    }
    if (role === 'player' && subscriptionTier === 'premium' && !teamCoachApproved) {
      setError('יש לאשר שמאמן הקבוצה שלך אישר לך להיכנס לתהליך הליווי');
      return;
    }
    setIsLoading(true);
    setError('');
    const result = await signup(
      email.trim(),
      password,
      displayName.trim(),
      role,
      role === 'player' && subscriptionTier === 'premium' ? coachId : undefined,
      role === 'player' ? subscriptionTier : 'free'
    );
    if (result.error) {
      setError(result.error);
    } else {
      if (role === 'coach') {
        setSuccess('ההרשמה הצליחה! חשבונך ממתין לאישור.');
      } else {
        setSuccess('ההרשמה הצליחה! לאחר ביצוע התשלום, חשבונך יאושר על ידי המאמן.');
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl gradient-accent">
            <span className="text-3xl font-black text-accent-foreground">I²</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">I² Analytics & Video</h1>
          <p className="mt-2 text-muted-foreground">ניתוח וידאו מקצועי לשחקני כדורסל</p>
        </div>

        <div className="gradient-card rounded-xl p-6">
          {mode === 'select' && (
            <div className="space-y-4">
              <h2 className="text-center text-xl font-semibold text-foreground">ברוכים הבאים</h2>
              <Button
                onClick={() => { setMode('login'); resetFields(); }}
                className="w-full gradient-primary text-primary-foreground hover:opacity-90 h-12 text-lg"
              >
                התחברות
              </Button>
              <Button
                onClick={() => { setMode('signup'); resetFields(); }}
                variant="outline"
                className="w-full border-accent text-accent hover:bg-accent hover:text-accent-foreground h-12 text-lg"
              >
                הרשמה
              </Button>
            </div>
          )}

          {mode === 'login' && (
            <div className="space-y-4">
              <h2 className="text-center text-xl font-semibold text-foreground">התחברות</h2>
              <div className="space-y-2">
                <Label>אימייל</Label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  className="h-12 bg-secondary border-border text-foreground"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>סיסמה</Label>
                <Input
                  type="password"
                  placeholder="סיסמה"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  className="h-12 bg-secondary border-border text-foreground"
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button onClick={handleLogin} disabled={isLoading} className="w-full gradient-accent text-accent-foreground h-12 text-lg font-semibold">
                {isLoading ? 'מתחבר...' : 'כניסה'}
              </Button>
              <Button variant="ghost" onClick={() => { setMode('select'); resetFields(); }} className="w-full text-muted-foreground">
                חזרה
              </Button>
            </div>
          )}

          {mode === 'signup' && (
            <div className="space-y-4">
              <h2 className="text-center text-xl font-semibold text-foreground">הרשמה</h2>
              <div className="space-y-2">
                <Label>שם מלא</Label>
                <Input
                  placeholder="השם שלך"
                  value={displayName}
                  onChange={e => { setDisplayName(e.target.value); setError(''); }}
                  className="h-12 bg-secondary border-border text-foreground"
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label>אימייל</Label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  className="h-12 bg-secondary border-border text-foreground"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>סיסמה</Label>
                <Input
                  type="password"
                  placeholder="לפחות 6 תווים"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  className="h-12 bg-secondary border-border text-foreground"
                  maxLength={72}
                />
              </div>
              <div className="space-y-2">
                <Label>תפקיד</Label>
                <Select value={role} onValueChange={v => { setRole(v as 'coach' | 'player'); setError(''); }}>
                  <SelectTrigger className="h-12 bg-secondary border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="player">שחקן</SelectItem>
                    <SelectItem value="coach">מאמן</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tier selection - only for players */}
              {role === 'player' && (
                <div className="space-y-3">
                  <Label>סוג מנוי</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => { setSubscriptionTier('basic'); setCoachId(''); setPremiumPackage(''); setError(''); }}
                      className={`rounded-xl border-2 p-4 text-right transition-all ${
                        subscriptionTier === 'basic'
                          ? 'border-accent bg-accent/10'
                          : 'border-border bg-secondary hover:border-muted-foreground'
                      }`}
                    >
                      <Target className="h-6 w-6 text-accent mb-2" />
                      <p className="font-semibold text-foreground text-sm">מעקב קליעות + Court IQ</p>
                      <p className="text-xs text-muted-foreground mt-1">אתגרים, טבלת מובילים, מעקב זריקות, חידון כדורסל</p>
                      <p className="text-accent font-bold mt-2">30₪ / חודש</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSubscriptionTier('premium'); setError(''); }}
                      className={`rounded-xl border-2 p-4 text-right transition-all ${
                        subscriptionTier === 'premium'
                          ? 'border-accent bg-accent/10'
                          : 'border-border bg-secondary hover:border-muted-foreground'
                      }`}
                    >
                      <Crown className="h-6 w-6 text-accent mb-2" />
                      <p className="font-semibold text-foreground text-sm">ליווי אישי</p>
                      <p className="text-xs text-muted-foreground mt-1">כולל את הכל + ניתוח וידאו, פגישות, יעדים</p>
                      <p className="text-accent font-bold mt-2">לפי חבילה</p>
                    </button>
                  </div>
                </div>
              )}

              {/* Premium package selection */}
              {role === 'player' && subscriptionTier === 'premium' && (
                <div className="space-y-3">
                  <Label>בחר חבילת ליווי אישי</Label>
                  <div className="space-y-2">
                    {[
                      { value: 'single' as PremiumPackage, label: 'סשן בודד', desc: 'סשן וידאו אישי בודד לניתוח משחק, ללא ליווי שוטף', price: '350₪' },
                      { value: 'monthly' as PremiumPackage, label: 'מנוי חודשי', desc: '4 סשנים בחודש + ליווי שוטף', price: '1,500₪ / חודש' },
                      { value: 'seasonal' as PremiumPackage, label: 'מנוי עונתי', desc: 'ליווי לאורך כל העונה, המחיר הכי משתלם', price: '1,250₪ / חודש' },
                    ].map(pkg => (
                      <button
                        key={pkg.value}
                        type="button"
                        onClick={() => { setPremiumPackage(pkg.value); setError(''); }}
                        className={`w-full rounded-xl border-2 p-3 text-right transition-all flex items-center gap-3 ${
                          premiumPackage === pkg.value
                            ? 'border-accent bg-accent/10'
                            : 'border-border bg-secondary hover:border-muted-foreground'
                        }`}
                      >
                        <div className={`h-4 w-4 rounded-full border-2 flex-shrink-0 ${
                          premiumPackage === pkg.value ? 'border-accent bg-accent' : 'border-muted-foreground'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold text-foreground text-sm">{pkg.label}</p>
                            <p className="text-accent font-bold text-sm whitespace-nowrap">{pkg.price}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{pkg.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Coach selection - only for premium players */}
              {role === 'player' && subscriptionTier === 'premium' && coaches.length > 0 && (
                <div className="space-y-2">
                  <Label>מאמן מלווה</Label>
                  <Select value={coachId} onValueChange={v => { setCoachId(v); setError(''); }}>
                    <SelectTrigger className="h-12 bg-secondary border-border text-foreground">
                      <SelectValue placeholder="בחר את המאמן שלך" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {coaches.map(c => (
                        <SelectItem key={c.user_id} value={c.user_id}>{c.display_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Team coach approval checkbox - only for premium players */}
              {role === 'player' && subscriptionTier === 'premium' && (
                <div className="flex items-start gap-3 rounded-lg bg-secondary/50 p-3 border border-border">
                  <Checkbox
                    id="teamCoachApproved"
                    checked={teamCoachApproved}
                    onCheckedChange={(checked) => { setTeamCoachApproved(checked === true); setError(''); }}
                    className="mt-0.5"
                  />
                  <label htmlFor="teamCoachApproved" className="text-sm text-foreground cursor-pointer leading-relaxed">
                    אני מאשר/ת שמאמן הקבוצה שלי יודע ואישר לי להיכנס לתהליך ליווי אישי
                  </label>
                </div>
              )}

              {/* Payment note */}
              {role === 'player' && (
                <div className="rounded-lg bg-accent/10 border border-accent/30 p-3 text-right">
                  <p className="text-sm text-foreground font-medium">
                    {subscriptionTier === 'basic'
                      ? '💳 עלות: 30₪ לחודש · התשלום מתבצע מחוץ לאפליקציה'
                      : premiumPackage
                        ? `💳 חבילה שנבחרה: ${premiumPackage === 'single' ? 'סשן בודד · 350₪' : premiumPackage === 'monthly' ? 'מנוי חודשי · 1,500₪/חודש' : 'מנוי עונתי · 1,250₪/חודש'} · התשלום מתבצע מחוץ לאפליקציה`
                        : '💳 התשלום לליווי אישי מתבצע מחוץ לאפליקציה בהתאם לחבילה שנבחרה'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">לאחר ביצוע התשלום, המאמן יאשר את הגישה שלך</p>
                </div>
              )}

              {error && <p className="text-sm text-destructive">{error}</p>}
              {success && <p className="text-sm text-success">{success}</p>}
              <Button onClick={handleSignup} disabled={isLoading} className="w-full gradient-accent text-accent-foreground h-12 text-lg font-semibold">
                {isLoading ? 'נרשם...' : 'הרשמה'}
              </Button>
              <Button variant="ghost" onClick={() => { setMode('select'); resetFields(); }} className="w-full text-muted-foreground">
                חזרה
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
