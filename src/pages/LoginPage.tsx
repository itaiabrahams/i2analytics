import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { store } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const LoginPage = () => {
  const { login } = useAuth();
  const [mode, setMode] = useState<'select' | 'coach' | 'player'>('select');
  const [password, setPassword] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [error, setError] = useState('');

  const players = store.getPlayers();

  const handleCoachLogin = () => {
    if (store.authenticateCoach(password)) {
      login('coach');
    } else {
      setError('סיסמה שגויה');
    }
  };

  const handlePlayerLogin = () => {
    if (!selectedPlayer) {
      setError('בחר שחקן');
      return;
    }
    if (store.authenticatePlayer(selectedPlayer, password)) {
      login('player', selectedPlayer);
    } else {
      setError('סיסמה שגויה');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo area */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl gradient-accent">
            <span className="text-3xl font-black text-accent-foreground">I&I</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">I&I Analytics & Video</h1>
          <p className="mt-2 text-muted-foreground">ניתוח וידאו מקצועי לשחקני כדורסל</p>
        </div>

        <div className="gradient-card rounded-xl p-6">
          {mode === 'select' && (
            <div className="space-y-4">
              <h2 className="text-center text-xl font-semibold text-foreground">כניסה למערכת</h2>
              <Button
                onClick={() => { setMode('coach'); setError(''); }}
                className="w-full gradient-primary text-primary-foreground hover:opacity-90 h-12 text-lg"
              >
                כניסה כמאמן
              </Button>
              <Button
                onClick={() => { setMode('player'); setError(''); }}
                variant="outline"
                className="w-full border-accent text-accent hover:bg-accent hover:text-accent-foreground h-12 text-lg"
              >
                כניסה כשחקן
              </Button>
            </div>
          )}

          {mode === 'coach' && (
            <div className="space-y-4">
              <h2 className="text-center text-xl font-semibold text-foreground">כניסת מאמן</h2>
              <Input
                type="password"
                placeholder="סיסמת מאמן"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                className="h-12 bg-secondary border-border text-foreground"
                onKeyDown={(e) => e.key === 'Enter' && handleCoachLogin()}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button onClick={handleCoachLogin} className="w-full gradient-accent text-accent-foreground h-12 text-lg font-semibold">
                כניסה
              </Button>
              <Button variant="ghost" onClick={() => { setMode('select'); setError(''); setPassword(''); }} className="w-full text-muted-foreground">
                חזרה
              </Button>
              <p className="text-center text-xs text-muted-foreground">סיסמה לדוגמה: coach123</p>
            </div>
          )}

          {mode === 'player' && (
            <div className="space-y-4">
              <h2 className="text-center text-xl font-semibold text-foreground">כניסת שחקן</h2>
              <Select value={selectedPlayer} onValueChange={(v) => { setSelectedPlayer(v); setError(''); }}>
                <SelectTrigger className="h-12 bg-secondary border-border text-foreground">
                  <SelectValue placeholder="בחר שחקן" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {players.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="password"
                placeholder="סיסמה"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                className="h-12 bg-secondary border-border text-foreground"
                onKeyDown={(e) => e.key === 'Enter' && handlePlayerLogin()}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button onClick={handlePlayerLogin} className="w-full gradient-accent text-accent-foreground h-12 text-lg font-semibold">
                כניסה
              </Button>
              <Button variant="ghost" onClick={() => { setMode('select'); setError(''); setPassword(''); }} className="w-full text-muted-foreground">
                חזרה
              </Button>
              <p className="text-center text-xs text-muted-foreground">סיסמה לדוגמה: 1234</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
