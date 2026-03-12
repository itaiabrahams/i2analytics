import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { store } from '@/lib/store';
import { Player } from '@/lib/types';

const POSITIONS = ['פלייגארד', 'שוטינג גארד', 'סמול פורוורד', 'פאוור פורוורד', 'סנטר'];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  player?: Player | null; // null = add mode
  onSaved: () => void;
}

const PlayerFormDialog = ({ open, onOpenChange, player, onSaved }: Props) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [team, setTeam] = useState('');
  const [position, setPosition] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (player) {
      setName(player.name);
      setAge(String(player.age));
      setTeam(player.team);
      setPosition(player.position);
      setPassword(player.password);
    } else {
      setName('');
      setAge('');
      setTeam('');
      setPosition('');
      setPassword('');
    }
    setError('');
  }, [player, open]);

  const handleSubmit = () => {
    const trimmedName = name.trim();
    const trimmedTeam = team.trim();
    const trimmedPassword = password.trim();
    const ageNum = parseInt(age);

    if (!trimmedName || trimmedName.length > 100) {
      setError('שם חייב להיות בין 1 ל-100 תווים');
      return;
    }
    if (isNaN(ageNum) || ageNum < 5 || ageNum > 25) {
      setError('גיל חייב להיות בין 5 ל-25');
      return;
    }
    if (!trimmedTeam || trimmedTeam.length > 100) {
      setError('קבוצה חייבת להיות בין 1 ל-100 תווים');
      return;
    }
    if (!position) {
      setError('יש לבחור עמדה');
      return;
    }
    if (!trimmedPassword || trimmedPassword.length < 4 || trimmedPassword.length > 20) {
      setError('סיסמה חייבת להיות בין 4 ל-20 תווים');
      return;
    }

    if (player) {
      store.updatePlayer(player.id, { name: trimmedName, age: ageNum, team: trimmedTeam, position, password: trimmedPassword });
    } else {
      const newPlayer: Player = {
        id: `p-${Date.now()}`,
        name: trimmedName,
        age: ageNum,
        team: trimmedTeam,
        position,
        password: trimmedPassword,
      };
      store.addPlayer(newPlayer);
    }

    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">{player ? 'עריכת שחקן' : 'הוספת שחקן חדש'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>שם מלא</Label>
            <Input value={name} onChange={e => setName(e.target.value)} maxLength={100} placeholder="שם השחקן" />
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
          <div className="space-y-2">
            <Label>סיסמה</Label>
            <Input value={password} onChange={e => setPassword(e.target.value)} maxLength={20} placeholder="סיסמת כניסה לשחקן" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={handleSubmit} className="w-full gradient-accent text-accent-foreground">
            {player ? 'שמור שינויים' : 'הוסף שחקן'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlayerFormDialog;
