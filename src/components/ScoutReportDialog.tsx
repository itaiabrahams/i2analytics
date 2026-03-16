import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2 } from 'lucide-react';
import { generateScoutReportPDF } from '@/lib/scoutReportPdf';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ScoutReportData {
  // Player Info
  playerName: string;
  position: string;
  age: number;
  height: string;
  weight: string;
  attendance: string;
  progressIndex: string;
  status: string;
  category: string;
  avatarUrl?: string;

  // Basketball Metrics
  shooting: string;
  defense: string;
  decisionMaking: string;
  ballHandling: string;
  passing: string;
  rebounds: string;
  gameReading: string;

  // Physical Metrics
  sprint20m: string;
  verticalJump: string;
  agility: string;
  strength: string;
  endurance: string;

  // Mental Metrics
  selfConfidence: string;
  discipline: string;
  teamwork: string;
  pressureHandling: string;
  errorRecovery: string;

  // Nutrition
  nutritionWeight: string;
  bodyFat: string;
  lastMeasured: string;

  // Recommendations
  recommendations: string[];

  // Goals
  goals: { goal: string; status: string; progress: string; targetDate: string }[];

  // Improvement Reports
  improvements: { domain: string; period: string; rating: string; notes: string; coach: string }[];

  // Training Notes
  trainingNotes: { date: string; coach: string; quality: string; notes: string }[];

  // Attendance
  totalSessions: string;
  present: string;
  absent: string;
  attendanceRate: string;
}

interface ScoutReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerName: string;
  playerPosition: string;
  playerAge: number;
  playerTeam: string;
  avatarUrl?: string;
}

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-sm font-bold text-accent mt-4 mb-2 border-b border-border pb-1">{children}</h3>
);

const FieldRow = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-2 gap-3 mb-2">{children}</div>
);

const ScoutReportDialog = ({
  open,
  onOpenChange,
  playerName,
  playerPosition,
  playerAge,
  avatarUrl,
}: ScoutReportDialogProps) => {
  const [generating, setGenerating] = useState(false);

  const [data, setData] = useState<ScoutReportData>({
    playerName,
    position: playerPosition,
    age: playerAge,
    height: '',
    weight: '',
    attendance: '',
    progressIndex: '',
    status: 'Active',
    category: 'Diamond',
    avatarUrl,
    shooting: '',
    defense: '',
    decisionMaking: '',
    ballHandling: '',
    passing: '',
    rebounds: '',
    gameReading: '',
    sprint20m: '',
    verticalJump: '',
    agility: '',
    strength: '',
    endurance: '',
    selfConfidence: '',
    discipline: '',
    teamwork: '',
    pressureHandling: '',
    errorRecovery: '',
    nutritionWeight: '',
    bodyFat: '',
    lastMeasured: '',
    recommendations: ['', '', ''],
    goals: [{ goal: '', status: 'In Progress', progress: '', targetDate: '' }],
    improvements: [{ domain: '', period: '', rating: '', notes: '', coach: '' }],
    trainingNotes: [{ date: '', coach: '', quality: '', notes: '' }],
    totalSessions: '',
    present: '',
    absent: '',
    attendanceRate: '',
  });

  const updateField = (field: keyof ScoutReportData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const updateRecommendation = (index: number, value: string) => {
    const recs = [...data.recommendations];
    recs[index] = value;
    setData(prev => ({ ...prev, recommendations: recs }));
  };

  const addGoal = () => {
    setData(prev => ({ ...prev, goals: [...prev.goals, { goal: '', status: 'In Progress', progress: '', targetDate: '' }] }));
  };
  const removeGoal = (i: number) => {
    setData(prev => ({ ...prev, goals: prev.goals.filter((_, idx) => idx !== i) }));
  };
  const updateGoal = (i: number, field: string, value: string) => {
    const goals = [...data.goals];
    (goals[i] as any)[field] = value;
    setData(prev => ({ ...prev, goals }));
  };

  const addImprovement = () => {
    setData(prev => ({ ...prev, improvements: [...prev.improvements, { domain: '', period: '', rating: '', notes: '', coach: '' }] }));
  };
  const removeImprovement = (i: number) => {
    setData(prev => ({ ...prev, improvements: prev.improvements.filter((_, idx) => idx !== i) }));
  };
  const updateImprovement = (i: number, field: string, value: string) => {
    const improvements = [...data.improvements];
    (improvements[i] as any)[field] = value;
    setData(prev => ({ ...prev, improvements }));
  };

  const addTrainingNote = () => {
    setData(prev => ({ ...prev, trainingNotes: [...prev.trainingNotes, { date: '', coach: '', quality: '', notes: '' }] }));
  };
  const removeTrainingNote = (i: number) => {
    setData(prev => ({ ...prev, trainingNotes: prev.trainingNotes.filter((_, idx) => idx !== i) }));
  };
  const updateTrainingNote = (i: number, field: string, value: string) => {
    const notes = [...data.trainingNotes];
    (notes[i] as any)[field] = value;
    setData(prev => ({ ...prev, trainingNotes: notes }));
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      // Translate Hebrew fields to English
      toast.info('מתרגם לאנגלית...');
      const { data: result, error } = await supabase.functions.invoke('translate-scout-report', {
        body: { data },
      });

      if (error || !result?.translated) {
        console.error('Translation failed, using original data:', error);
        toast.warning('התרגום נכשל, מייצר דוח עם הטקסט המקורי');
        await generateScoutReportPDF(data);
      } else {
        await generateScoutReportPDF(result.translated as ScoutReportData);
      }
      toast.success('הדוח הורד בהצלחה!');
    } catch (err) {
      console.error(err);
      toast.error('שגיאה ביצירת הדוח');
    } finally {
      setGenerating(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="text-right">עריכת דוח סקאוט - {playerName}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[75vh] px-4 pb-4">
          {/* Player Info */}
          <SectionTitle>פרטי שחקן</SectionTitle>
          <FieldRow>
            <div>
              <Label className="text-xs">גובה (ס"מ)</Label>
              <Input value={data.height} onChange={e => updateField('height', e.target.value)} placeholder="183" />
            </div>
            <div>
              <Label className="text-xs">משקל (ק"ג)</Label>
              <Input value={data.weight} onChange={e => updateField('weight', e.target.value)} placeholder="74" />
            </div>
          </FieldRow>
          <FieldRow>
            <div>
              <Label className="text-xs">נוכחות %</Label>
              <Input value={data.attendance} onChange={e => updateField('attendance', e.target.value)} placeholder="92%" />
            </div>
            <div>
              <Label className="text-xs">מדד התקדמות %</Label>
              <Input value={data.progressIndex} onChange={e => updateField('progressIndex', e.target.value)} placeholder="85%" />
            </div>
          </FieldRow>
          <FieldRow>
            <div>
              <Label className="text-xs">סטטוס</Label>
              <Input value={data.status} onChange={e => updateField('status', e.target.value)} placeholder="Active" />
            </div>
            <div>
              <Label className="text-xs">קטגוריה</Label>
              <Input value={data.category} onChange={e => updateField('category', e.target.value)} placeholder="Diamond" />
            </div>
          </FieldRow>

          {/* Basketball Metrics */}
          <SectionTitle>מדדי כדורסל</SectionTitle>
          <FieldRow>
            <div>
              <Label className="text-xs">קליעה</Label>
              <Input value={data.shooting} onChange={e => updateField('shooting', e.target.value)} placeholder="82%" />
            </div>
            <div>
              <Label className="text-xs">הגנה</Label>
              <Input value={data.defense} onChange={e => updateField('defense', e.target.value)} placeholder="75%" />
            </div>
          </FieldRow>
          <FieldRow>
            <div>
              <Label className="text-xs">קבלת החלטות</Label>
              <Input value={data.decisionMaking} onChange={e => updateField('decisionMaking', e.target.value)} placeholder="78%" />
            </div>
            <div>
              <Label className="text-xs">שליטה בכדור</Label>
              <Input value={data.ballHandling} onChange={e => updateField('ballHandling', e.target.value)} placeholder="80%" />
            </div>
          </FieldRow>
          <FieldRow>
            <div>
              <Label className="text-xs">מסירות</Label>
              <Input value={data.passing} onChange={e => updateField('passing', e.target.value)} placeholder="76%" />
            </div>
            <div>
              <Label className="text-xs">ריבאונדים</Label>
              <Input value={data.rebounds} onChange={e => updateField('rebounds', e.target.value)} placeholder="65%" />
            </div>
          </FieldRow>
          <div className="mb-2">
            <Label className="text-xs">קריאת משחק</Label>
            <Input value={data.gameReading} onChange={e => updateField('gameReading', e.target.value)} placeholder="77%" />
          </div>

          {/* Physical Metrics */}
          <SectionTitle>מדדים פיזיים</SectionTitle>
          <FieldRow>
            <div>
              <Label className="text-xs">ספרינט 20 מ'</Label>
              <Input value={data.sprint20m} onChange={e => updateField('sprint20m', e.target.value)} placeholder="3.1s" />
            </div>
            <div>
              <Label className="text-xs">קפיצה אנכית</Label>
              <Input value={data.verticalJump} onChange={e => updateField('verticalJump', e.target.value)} placeholder="62 cm" />
            </div>
          </FieldRow>
          <FieldRow>
            <div>
              <Label className="text-xs">זריזות</Label>
              <Input value={data.agility} onChange={e => updateField('agility', e.target.value)} placeholder="80%" />
            </div>
            <div>
              <Label className="text-xs">כוח</Label>
              <Input value={data.strength} onChange={e => updateField('strength', e.target.value)} placeholder="73%" />
            </div>
          </FieldRow>
          <div className="mb-2">
            <Label className="text-xs">סיבולת</Label>
            <Input value={data.endurance} onChange={e => updateField('endurance', e.target.value)} placeholder="82%" />
          </div>

          {/* Mental Metrics */}
          <SectionTitle>מדדים מנטליים</SectionTitle>
          <FieldRow>
            <div>
              <Label className="text-xs">ביטחון עצמי</Label>
              <Input value={data.selfConfidence} onChange={e => updateField('selfConfidence', e.target.value)} placeholder="78%" />
            </div>
            <div>
              <Label className="text-xs">משמעת</Label>
              <Input value={data.discipline} onChange={e => updateField('discipline', e.target.value)} placeholder="85%" />
            </div>
          </FieldRow>
          <FieldRow>
            <div>
              <Label className="text-xs">עבודת צוות</Label>
              <Input value={data.teamwork} onChange={e => updateField('teamwork', e.target.value)} placeholder="88%" />
            </div>
            <div>
              <Label className="text-xs">התמודדות עם לחץ</Label>
              <Input value={data.pressureHandling} onChange={e => updateField('pressureHandling', e.target.value)} placeholder="72%" />
            </div>
          </FieldRow>
          <div className="mb-2">
            <Label className="text-xs">התאוששות משגיאות</Label>
            <Input value={data.errorRecovery} onChange={e => updateField('errorRecovery', e.target.value)} placeholder="75%" />
          </div>

          {/* Nutrition */}
          <SectionTitle>נתוני תזונה</SectionTitle>
          <FieldRow>
            <div>
              <Label className="text-xs">משקל</Label>
              <Input value={data.nutritionWeight} onChange={e => updateField('nutritionWeight', e.target.value)} placeholder="74 kg" />
            </div>
            <div>
              <Label className="text-xs">אחוז שומן</Label>
              <Input value={data.bodyFat} onChange={e => updateField('bodyFat', e.target.value)} placeholder="12.8%" />
            </div>
          </FieldRow>
          <div className="mb-2">
            <Label className="text-xs">תאריך מדידה אחרון</Label>
            <Input value={data.lastMeasured} onChange={e => updateField('lastMeasured', e.target.value)} placeholder="13/03/2026" />
          </div>

          {/* Recommendations */}
          <SectionTitle>המלצות</SectionTitle>
          {data.recommendations.map((rec, i) => (
            <div key={i} className="mb-2">
              <Label className="text-xs">המלצה {i + 1}</Label>
              <Input value={rec} onChange={e => updateRecommendation(i, e.target.value)} placeholder={`המלצה ${i + 1}`} />
            </div>
          ))}

          {/* Goals */}
          <SectionTitle>יעדים ומטרות</SectionTitle>
          {data.goals.map((goal, i) => (
            <div key={i} className="grid grid-cols-5 gap-2 mb-2 items-end">
              <div>
                <Label className="text-xs">יעד</Label>
                <Input value={goal.goal} onChange={e => updateGoal(i, 'goal', e.target.value)} placeholder="יעד" />
              </div>
              <div>
                <Label className="text-xs">סטטוס</Label>
                <Input value={goal.status} onChange={e => updateGoal(i, 'status', e.target.value)} placeholder="In Progress" />
              </div>
              <div>
                <Label className="text-xs">התקדמות</Label>
                <Input value={goal.progress} onChange={e => updateGoal(i, 'progress', e.target.value)} placeholder="65%" />
              </div>
              <div>
                <Label className="text-xs">תאריך יעד</Label>
                <Input value={goal.targetDate} onChange={e => updateGoal(i, 'targetDate', e.target.value)} placeholder="01/06/2026" />
              </div>
              <Button variant="ghost" size="icon" onClick={() => removeGoal(i)} className="h-9 w-9 text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addGoal} className="mb-2">
            <Plus className="h-3 w-3 mr-1" /> הוסף יעד
          </Button>

          {/* Improvement Reports */}
          <SectionTitle>דוחות שיפור</SectionTitle>
          {data.improvements.map((imp, i) => (
            <div key={i} className="grid grid-cols-6 gap-2 mb-2 items-end">
              <div>
                <Label className="text-xs">תחום</Label>
                <Input value={imp.domain} onChange={e => updateImprovement(i, 'domain', e.target.value)} placeholder="Basketball" />
              </div>
              <div>
                <Label className="text-xs">תקופה</Label>
                <Input value={imp.period} onChange={e => updateImprovement(i, 'period', e.target.value)} placeholder="03/03 - 09/03" />
              </div>
              <div>
                <Label className="text-xs">דירוג</Label>
                <Input value={imp.rating} onChange={e => updateImprovement(i, 'rating', e.target.value)} placeholder="8/10" />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">הערות</Label>
                <Input value={imp.notes} onChange={e => updateImprovement(i, 'notes', e.target.value)} placeholder="הערות" />
              </div>
              <Button variant="ghost" size="icon" onClick={() => removeImprovement(i)} className="h-9 w-9 text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addImprovement} className="mb-2">
            <Plus className="h-3 w-3 mr-1" /> הוסף דוח שיפור
          </Button>

          {/* Training Notes */}
          <SectionTitle>הערות אימון</SectionTitle>
          {data.trainingNotes.map((note, i) => (
            <div key={i} className="grid grid-cols-5 gap-2 mb-2 items-end">
              <div>
                <Label className="text-xs">תאריך</Label>
                <Input value={note.date} onChange={e => updateTrainingNote(i, 'date', e.target.value)} placeholder="11/03/2026" />
              </div>
              <div>
                <Label className="text-xs">מאמן</Label>
                <Input value={note.coach} onChange={e => updateTrainingNote(i, 'coach', e.target.value)} placeholder="Coach" />
              </div>
              <div>
                <Label className="text-xs">איכות</Label>
                <Input value={note.quality} onChange={e => updateTrainingNote(i, 'quality', e.target.value)} placeholder="9/10" />
              </div>
              <div>
                <Label className="text-xs">הערות</Label>
                <Input value={note.notes} onChange={e => updateTrainingNote(i, 'notes', e.target.value)} placeholder="הערות" />
              </div>
              <Button variant="ghost" size="icon" onClick={() => removeTrainingNote(i)} className="h-9 w-9 text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addTrainingNote} className="mb-2">
            <Plus className="h-3 w-3 mr-1" /> הוסף הערת אימון
          </Button>

          {/* Attendance */}
          <SectionTitle>סיכום נוכחות</SectionTitle>
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div>
              <Label className="text-xs">סה"כ אימונים</Label>
              <Input value={data.totalSessions} onChange={e => updateField('totalSessions', e.target.value)} placeholder="15" />
            </div>
            <div>
              <Label className="text-xs">נוכח</Label>
              <Input value={data.present} onChange={e => updateField('present', e.target.value)} placeholder="14" />
            </div>
            <div>
              <Label className="text-xs">חסר</Label>
              <Input value={data.absent} onChange={e => updateField('absent', e.target.value)} placeholder="1" />
            </div>
            <div>
              <Label className="text-xs">אחוז נוכחות</Label>
              <Input value={data.attendanceRate} onChange={e => updateField('attendanceRate', e.target.value)} placeholder="92%" />
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full gradient-accent text-accent-foreground font-bold py-3 mb-4"
          >
            {generating ? 'מייצר דוח...' : 'סיום - הורד דוח סקאוט'}
          </Button>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ScoutReportDialog;
