import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const POSITIONS = ['פלייגארד', 'שוטינג גארד', 'סמול פורוורד', 'פאוור פורוורד', 'סנטר'];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const AddPlayerDialog = ({ open, onOpenChange, onSaved }: Props) => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [team, setTeam] = useState('');
  const [position, setPosition] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!displayName.trim() || !email.trim() || !password) {
      setError('יש למלא שם, אימייל וסיסמה');
      return;
    }
    if (password.length < 6) {
      setError('סיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }

    setIsLoading(true);
    setError('');

    const { data, error: fnError } = await supabase.functions.invoke('create-player', {
      body: {
        email: email.trim(),
        password,
        displayName: displayName.trim(),
        team: team.trim() || null,
        position: position || null,
        age: age || null,
      },
    });

    if (fnError || data?.error) {
      setError(data?.error || fnError?.message || 'שגיאה ביצירת השחקן');
      setIsLoading(false);
      return;
    }

    toast.success('השחקן נוסף בהצלחה!');
    setDisplayName('');
    setEmail('');
    setPassword('');
    setAge('');
    setTeam('');
    setPosition('');
    onOpenChange(false);
    onSaved();
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">הוספת שחקן חדש</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>שם מלא</Label>
            <Input value={displayName} onChange={e => setDisplayName(e.target.value)} maxLength={100} placeholder="שם השחקן" />
          </div>
          <div className="space-y-2">
            <Label>אימייל</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="player@email.com" dir="ltr" />
          </div>
          <div className="space-y-2">
            <Label>סיסמה</Label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="לפחות 6 תווים" maxLength={72} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>גיל</Label>
              <Input type="number" value={age} onChange={e => setAge(e.target.value)} min={5} max={25} placeholder="16" />
            </div>
            <div className="space-y-2">
              <Label>עמדה</Label>
              <Select value={position} onValueChange={setPosition}>
                <SelectTrigger><SelectValue placeholder="בחר עמדה" /></SelectTrigger>
                <SelectContent>
                  {POSITIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>קבוצה</Label>
            <Input value={team} onChange={e => setTeam(e.target.value)} maxLength={100} placeholder="שם הקבוצה" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={handleSubmit} disabled={isLoading} className="w-full gradient-accent text-accent-foreground">
            {isLoading ? 'מוסיף...' : 'הוסף שחקן'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddPlayerDialog;
