import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

type Mode = 'select' | 'login' | 'signup';

const LoginPage = () => {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<Mode>('select');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'coach' | 'player'>('player');
  const [coachId, setCoachId] = useState('');
  const [teamCoachApproved, setTeamCoachApproved] = useState(false);
  const [coaches, setCoaches] = useState<{ user_id: string; display_name: string }[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch coaches for the dropdown
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
    setRole('player');
    setCoachId('');
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
    if (role === 'player' && !coachId && coaches.length > 0) {
      setError('יש לבחור מאמן מלווה');
      return;
    }
    setIsLoading(true);
    setError('');
    const result = await signup(email.trim(), password, displayName.trim(), role, role === 'player' ? coachId : undefined);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess('ההרשמה הצליחה! חשבונך ממתין לאישור המאמן.');
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
              {role === 'player' && coaches.length > 0 && (
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
