import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Pencil, Check } from 'lucide-react';
import { generateScoutReportPDF } from '@/lib/scoutReportPdf';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MetricField {
  label: string;
  value: string;
}

export interface ScoutReportData {
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

  basketballMetrics: MetricField[];
  physicalMetrics: MetricField[];
  mentalMetrics: MetricField[];
  nutritionMetrics: MetricField[];

  // Keep old fields for backward compat with PDF
  shooting: string; defense: string; decisionMaking: string; ballHandling: string;
  passing: string; rebounds: string; gameReading: string;
  sprint20m: string; verticalJump: string; agility: string; strength: string; endurance: string;
  selfConfidence: string; discipline: string; teamwork: string; pressureHandling: string; errorRecovery: string;
  nutritionWeight: string;
  bodyFat: string;
  lastMeasured: string;
  recommendations: string[];
  goals: { goal: string; status: string; progress: string; targetDate: string }[];
  improvements: { domain: string; period: string; rating: string; notes: string; coach: string }[];
  trainingNotes: { date: string; coach: string; quality: string; notes: string }[];
  totalSessions: string;
  present: string;
  absent: string;
  attendanceRate: string;
}

interface ScoutReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerId: string;
  playerName: string;
  playerPosition: string;
  playerAge: number;
  playerTeam: string;
  avatarUrl?: string;
}

const DEFAULT_BASKETBALL_METRICS: MetricField[] = [
  { label: 'קליעה', value: '' },
  { label: 'הגנה', value: '' },
  { label: 'קבלת החלטות', value: '' },
  { label: 'שליטה בכדור', value: '' },
  { label: 'מסירות', value: '' },
  { label: 'ריבאונדים', value: '' },
  { label: 'קריאת משחק', value: '' },
];

const DEFAULT_PHYSICAL_METRICS: MetricField[] = [
  { label: 'ספרינט 20 מ\'', value: '' },
  { label: 'קפיצה אנכית', value: '' },
  { label: 'זריזות', value: '' },
  { label: 'כוח', value: '' },
  { label: 'סיבולת', value: '' },
];

const DEFAULT_MENTAL_METRICS: MetricField[] = [
  { label: 'ביטחון עצמי', value: '' },
  { label: 'משמעת', value: '' },
  { label: 'עבודת צוות', value: '' },
  { label: 'התמודדות עם לחץ', value: '' },
  { label: 'התאוששות משגיאות', value: '' },
];

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-sm font-bold text-accent mt-4 mb-2 border-b border-border pb-1">{children}</h3>
);

const FieldRow = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-2 gap-3 mb-2">{children}</div>
);

// Editable metric row component
const EditableMetricRow = ({
  metric,
  onLabelChange,
  onValueChange,
  onRemove,
  placeholder,
}: {
  metric: MetricField;
  onLabelChange: (label: string) => void;
  onValueChange: (value: string) => void;
  onRemove: () => void;
  placeholder: string;
}) => {
  const [editingLabel, setEditingLabel] = useState(false);
  const [tempLabel, setTempLabel] = useState(metric.label);

  return (
    <div className="flex items-center gap-2 mb-2">
      <div className="flex-1 min-w-0">
        {editingLabel ? (
          <div className="flex items-center gap-1">
            <Input
              value={tempLabel}
              onChange={e => setTempLabel(e.target.value)}
              className="h-7 text-xs"
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  onLabelChange(tempLabel);
                  setEditingLabel(false);
                }
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => { onLabelChange(tempLabel); setEditingLabel(false); }}
            >
              <Check className="h-3 w-3 text-green-500" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <Label className="text-xs truncate">{metric.label}</Label>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 shrink-0 opacity-50 hover:opacity-100"
              onClick={() => { setTempLabel(metric.label); setEditingLabel(true); }}
            >
              <Pencil className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
      <Input
        value={metric.value}
        onChange={e => onValueChange(e.target.value)}
        placeholder={placeholder}
        className="w-24 shrink-0"
      />
      <Button variant="ghost" size="icon" onClick={onRemove} className="h-8 w-8 shrink-0 text-destructive opacity-50 hover:opacity-100">
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};

function syncLegacyFields(data: ScoutReportData): ScoutReportData {
  // Map dynamic arrays back to legacy fields for PDF backward compat
  const findVal = (metrics: MetricField[], label: string) =>
    metrics.find(m => m.label === label)?.value || '';
  return {
    ...data,
    shooting: findVal(data.basketballMetrics, 'קליעה') || data.shooting,
    defense: findVal(data.basketballMetrics, 'הגנה') || data.defense,
    decisionMaking: findVal(data.basketballMetrics, 'קבלת החלטות') || data.decisionMaking,
    ballHandling: findVal(data.basketballMetrics, 'שליטה בכדור') || data.ballHandling,
    passing: findVal(data.basketballMetrics, 'מסירות') || data.passing,
    rebounds: findVal(data.basketballMetrics, 'ריבאונדים') || data.rebounds,
    gameReading: findVal(data.basketballMetrics, 'קריאת משחק') || data.gameReading,
    sprint20m: findVal(data.physicalMetrics, 'ספרינט 20 מ\'') || data.sprint20m,
    verticalJump: findVal(data.physicalMetrics, 'קפיצה אנכית') || data.verticalJump,
    agility: findVal(data.physicalMetrics, 'זריזות') || data.agility,
    strength: findVal(data.physicalMetrics, 'כוח') || data.strength,
    endurance: findVal(data.physicalMetrics, 'סיבולת') || data.endurance,
    selfConfidence: findVal(data.mentalMetrics, 'ביטחון עצמי') || data.selfConfidence,
    discipline: findVal(data.mentalMetrics, 'משמעת') || data.discipline,
    teamwork: findVal(data.mentalMetrics, 'עבודת צוות') || data.teamwork,
    pressureHandling: findVal(data.mentalMetrics, 'התמודדות עם לחץ') || data.pressureHandling,
    errorRecovery: findVal(data.mentalMetrics, 'התאוששות משגיאות') || data.errorRecovery,
  };
}

function createEmptyData(playerName: string, playerPosition: string, playerAge: number, avatarUrl?: string): ScoutReportData {
  return {
    playerName, position: playerPosition, age: playerAge, avatarUrl,
    height: '', weight: '', attendance: '', progressIndex: '',
    status: 'Active', category: 'Diamond',
    basketballMetrics: DEFAULT_BASKETBALL_METRICS.map(m => ({ ...m })),
    physicalMetrics: DEFAULT_PHYSICAL_METRICS.map(m => ({ ...m })),
    mentalMetrics: DEFAULT_MENTAL_METRICS.map(m => ({ ...m })),
    nutritionMetrics: DEFAULT_NUTRITION_METRICS.map(m => ({ ...m })),
    shooting: '', defense: '', decisionMaking: '', ballHandling: '',
    passing: '', rebounds: '', gameReading: '',
    sprint20m: '', verticalJump: '', agility: '', strength: '', endurance: '',
    selfConfidence: '', discipline: '', teamwork: '', pressureHandling: '', errorRecovery: '',
    nutritionWeight: '', bodyFat: '', lastMeasured: '',
    recommendations: ['', '', ''],
    goals: [{ goal: '', status: 'In Progress', progress: '', targetDate: '' }],
    improvements: [{ domain: '', period: '', rating: '', notes: '', coach: '' }],
    trainingNotes: [{ date: '', coach: '', quality: '', notes: '' }],
    totalSessions: '', present: '', absent: '', attendanceRate: '',
  };
}

const ScoutReportDialog = ({
  open, onOpenChange, playerId, playerName, playerPosition, playerAge, avatarUrl,
}: ScoutReportDialogProps) => {
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ScoutReportData>(createEmptyData(playerName, playerPosition, playerAge, avatarUrl));

  useEffect(() => {
    if (!open || !playerId) return;

    const fetchExistingData = async () => {
      setLoading(true);
      try {
        const [
          { data: goals },
          { data: ratings },
          { data: sessions },
          { data: shotSessions },
          { data: courtiqStats },
        ] = await Promise.all([
          supabase.from('player_goals').select('*').eq('player_id', playerId).order('created_at', { ascending: false }),
          supabase.from('player_ratings').select('*').eq('player_id', playerId).order('period_end', { ascending: false }).limit(1),
          supabase.from('sessions').select('*').eq('player_id', playerId),
          supabase.from('shot_sessions').select('id, date').eq('player_id', playerId),
          supabase.from('courtiq_player_stats').select('*').eq('player_id', playerId).maybeSingle(),
        ]);

        let totalAttempts = 0, totalMade = 0;
        if (shotSessions && shotSessions.length > 0) {
          const { data: shots } = await supabase.from('shots').select('attempts, made').in('session_id', shotSessions.map(s => s.id));
          if (shots) {
            totalAttempts = shots.reduce((s, sh) => s + sh.attempts, 0);
            totalMade = shots.reduce((s, sh) => s + sh.made, 0);
          }
        }

        const shootingPct = totalAttempts > 0 ? Math.round((totalMade / totalAttempts) * 100) : 0;
        const totalSessionCount = sessions?.length || 0;
        const latestRating = ratings?.[0];

        const mappedGoals = goals && goals.length > 0
          ? goals.map(g => ({
              goal: g.title,
              status: g.status === 'active' ? 'In Progress' : g.status === 'completed' ? 'Completed' : g.status,
              progress: `${g.progress}%`,
              targetDate: g.target_date ? new Date(g.target_date).toLocaleDateString('he-IL') : '',
            }))
          : [{ goal: '', status: 'In Progress', progress: '', targetDate: '' }];

        // Build dynamic metrics with pre-filled values
        const bbMetrics: MetricField[] = [
          { label: 'קליעה', value: shootingPct > 0 ? `${shootingPct}%` : (latestRating ? `${latestRating.offense_rating}/10` : '') },
          { label: 'הגנה', value: latestRating ? `${latestRating.defense_rating}/10` : '' },
          { label: 'קבלת החלטות', value: '' },
          { label: 'שליטה בכדור', value: '' },
          { label: 'מסירות', value: '' },
          { label: 'ריבאונדים', value: '' },
          { label: 'קריאת משחק', value: '' },
        ];

        const physMetrics: MetricField[] = DEFAULT_PHYSICAL_METRICS.map(m => ({ ...m }));

        const menMetrics: MetricField[] = [
          { label: 'ביטחון עצמי', value: '' },
          { label: 'משמעת', value: '' },
          { label: 'עבודת צוות', value: latestRating ? `${latestRating.teamwork_rating}/10` : '' },
          { label: 'התמודדות עם לחץ', value: '' },
          { label: 'התאוששות משגיאות', value: '' },
        ];

        const recs = ['', '', ''];
        if (courtiqStats) {
          const accuracy = courtiqStats.total_answered ? Math.round((courtiqStats.total_correct! / courtiqStats.total_answered) * 100) : 0;
          recs[0] = `Court IQ: ${courtiqStats.total_points} pts, ${accuracy}% accuracy, streak ${courtiqStats.current_streak}`;
        }
        if (totalAttempts > 0) {
          recs[1] = `Shot Tracker: ${totalAttempts} attempts, ${totalMade} made (${shootingPct}%)`;
        }

        const prefilled = createEmptyData(playerName, playerPosition, playerAge, avatarUrl);
        prefilled.basketballMetrics = bbMetrics;
        prefilled.physicalMetrics = physMetrics;
        prefilled.mentalMetrics = menMetrics;
        prefilled.goals = mappedGoals;
        prefilled.recommendations = recs;
        prefilled.totalSessions = totalSessionCount > 0 ? String(totalSessionCount) : '';
        prefilled.present = totalSessionCount > 0 ? String(totalSessionCount) : '';
        prefilled.absent = '0';
        prefilled.attendanceRate = totalSessionCount > 0 ? '100%' : '';
        prefilled.attendance = totalSessionCount > 0 ? `${totalSessionCount} sessions` : '';

        if (latestRating) {
          prefilled.progressIndex = `${latestRating.effort_rating}/10`;
          prefilled.improvements = [{
            domain: 'Overall',
            period: `${new Date(latestRating.period_start).toLocaleDateString('he-IL')} - ${new Date(latestRating.period_end).toLocaleDateString('he-IL')}`,
            rating: `${latestRating.overall_rating}/10`,
            notes: latestRating.notes || '',
            coach: '',
          }];
        }

        setData(prefilled);
      } catch (err) {
        console.error('Error fetching player data for scout report:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchExistingData();
  }, [open, playerId, playerName, playerPosition, playerAge, avatarUrl]);

  const updateField = (field: keyof ScoutReportData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const updateMetric = (section: 'basketballMetrics' | 'physicalMetrics' | 'mentalMetrics', index: number, field: 'label' | 'value', val: string) => {
    setData(prev => {
      const arr = [...prev[section]];
      arr[index] = { ...arr[index], [field]: val };
      return { ...prev, [section]: arr };
    });
  };
  const removeMetric = (section: 'basketballMetrics' | 'physicalMetrics' | 'mentalMetrics', index: number) => {
    setData(prev => ({ ...prev, [section]: prev[section].filter((_, i) => i !== index) }));
  };
  const addMetric = (section: 'basketballMetrics' | 'physicalMetrics' | 'mentalMetrics') => {
    setData(prev => ({ ...prev, [section]: [...prev[section], { label: 'מדד חדש', value: '' }] }));
  };

  const updateRecommendation = (index: number, value: string) => {
    const recs = [...data.recommendations];
    recs[index] = value;
    setData(prev => ({ ...prev, recommendations: recs }));
  };

  const addGoal = () => setData(prev => ({ ...prev, goals: [...prev.goals, { goal: '', status: 'In Progress', progress: '', targetDate: '' }] }));
  const removeGoal = (i: number) => setData(prev => ({ ...prev, goals: prev.goals.filter((_, idx) => idx !== i) }));
  const updateGoal = (i: number, field: string, value: string) => {
    const goals = [...data.goals];
    (goals[i] as any)[field] = value;
    setData(prev => ({ ...prev, goals }));
  };

  const addImprovement = () => setData(prev => ({ ...prev, improvements: [...prev.improvements, { domain: '', period: '', rating: '', notes: '', coach: '' }] }));
  const removeImprovement = (i: number) => setData(prev => ({ ...prev, improvements: prev.improvements.filter((_, idx) => idx !== i) }));
  const updateImprovement = (i: number, field: string, value: string) => {
    const improvements = [...data.improvements];
    (improvements[i] as any)[field] = value;
    setData(prev => ({ ...prev, improvements }));
  };

  const addTrainingNote = () => setData(prev => ({ ...prev, trainingNotes: [...prev.trainingNotes, { date: '', coach: '', quality: '', notes: '' }] }));
  const removeTrainingNote = (i: number) => setData(prev => ({ ...prev, trainingNotes: prev.trainingNotes.filter((_, idx) => idx !== i) }));
  const updateTrainingNote = (i: number, field: string, value: string) => {
    const notes = [...data.trainingNotes];
    (notes[i] as any)[field] = value;
    setData(prev => ({ ...prev, trainingNotes: notes }));
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const synced = syncLegacyFields(data);
      toast.info('מתרגם לאנגלית...');
      const { data: result, error } = await supabase.functions.invoke('translate-scout-report', {
        body: { data: synced },
      });

      if (error || !result?.translated) {
        console.error('Translation failed, using original data:', error);
        toast.warning('התרגום נכשל, מייצר דוח עם הטקסט המקורי');
        await generateScoutReportPDF(synced);
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

  const renderMetricsSection = (
    title: string,
    section: 'basketballMetrics' | 'physicalMetrics' | 'mentalMetrics',
    placeholder: string,
  ) => (
    <>
      <SectionTitle>{title}</SectionTitle>
      {data[section].map((metric, i) => (
        <EditableMetricRow
          key={`${section}-${i}`}
          metric={metric}
          onLabelChange={label => updateMetric(section, i, 'label', label)}
          onValueChange={value => updateMetric(section, i, 'value', value)}
          onRemove={() => removeMetric(section, i)}
          placeholder={placeholder}
        />
      ))}
      <Button variant="outline" size="sm" onClick={() => addMetric(section)} className="mb-2">
        <Plus className="h-3 w-3 mr-1" /> הוסף מדד
      </Button>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="text-right">עריכת דוח סקאוט - {playerName}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-muted-foreground">טוען נתונים...</p>
          </div>
        ) : (
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

          {/* Dynamic Metric Sections */}
          {renderMetricsSection('מדדי כדורסל', 'basketballMetrics', '82%')}
          {renderMetricsSection('מדדים פיזיים', 'physicalMetrics', '80%')}
          {renderMetricsSection('מדדים מנטליים', 'mentalMetrics', '78%')}

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
              <div><Label className="text-xs">יעד</Label><Input value={goal.goal} onChange={e => updateGoal(i, 'goal', e.target.value)} placeholder="יעד" /></div>
              <div><Label className="text-xs">סטטוס</Label><Input value={goal.status} onChange={e => updateGoal(i, 'status', e.target.value)} placeholder="In Progress" /></div>
              <div><Label className="text-xs">התקדמות</Label><Input value={goal.progress} onChange={e => updateGoal(i, 'progress', e.target.value)} placeholder="65%" /></div>
              <div><Label className="text-xs">תאריך יעד</Label><Input value={goal.targetDate} onChange={e => updateGoal(i, 'targetDate', e.target.value)} placeholder="01/06/2026" /></div>
              <Button variant="ghost" size="icon" onClick={() => removeGoal(i)} className="h-9 w-9 text-destructive"><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addGoal} className="mb-2"><Plus className="h-3 w-3 mr-1" /> הוסף יעד</Button>

          {/* Improvement Reports */}
          <SectionTitle>דוחות שיפור</SectionTitle>
          {data.improvements.map((imp, i) => (
            <div key={i} className="grid grid-cols-6 gap-2 mb-2 items-end">
              <div><Label className="text-xs">תחום</Label><Input value={imp.domain} onChange={e => updateImprovement(i, 'domain', e.target.value)} placeholder="Basketball" /></div>
              <div><Label className="text-xs">תקופה</Label><Input value={imp.period} onChange={e => updateImprovement(i, 'period', e.target.value)} placeholder="03/03 - 09/03" /></div>
              <div><Label className="text-xs">דירוג</Label><Input value={imp.rating} onChange={e => updateImprovement(i, 'rating', e.target.value)} placeholder="8/10" /></div>
              <div className="col-span-2"><Label className="text-xs">הערות</Label><Input value={imp.notes} onChange={e => updateImprovement(i, 'notes', e.target.value)} placeholder="הערות" /></div>
              <Button variant="ghost" size="icon" onClick={() => removeImprovement(i)} className="h-9 w-9 text-destructive"><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addImprovement} className="mb-2"><Plus className="h-3 w-3 mr-1" /> הוסף דוח שיפור</Button>

          {/* Training Notes */}
          <SectionTitle>הערות אימון</SectionTitle>
          {data.trainingNotes.map((note, i) => (
            <div key={i} className="grid grid-cols-5 gap-2 mb-2 items-end">
              <div><Label className="text-xs">תאריך</Label><Input value={note.date} onChange={e => updateTrainingNote(i, 'date', e.target.value)} placeholder="11/03/2026" /></div>
              <div><Label className="text-xs">מאמן</Label><Input value={note.coach} onChange={e => updateTrainingNote(i, 'coach', e.target.value)} placeholder="Coach" /></div>
              <div><Label className="text-xs">איכות</Label><Input value={note.quality} onChange={e => updateTrainingNote(i, 'quality', e.target.value)} placeholder="9/10" /></div>
              <div><Label className="text-xs">הערות</Label><Input value={note.notes} onChange={e => updateTrainingNote(i, 'notes', e.target.value)} placeholder="הערות" /></div>
              <Button variant="ghost" size="icon" onClick={() => removeTrainingNote(i)} className="h-9 w-9 text-destructive"><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addTrainingNote} className="mb-2"><Plus className="h-3 w-3 mr-1" /> הוסף הערת אימון</Button>

          {/* Attendance */}
          <SectionTitle>סיכום נוכחות</SectionTitle>
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div><Label className="text-xs">סה"כ אימונים</Label><Input value={data.totalSessions} onChange={e => updateField('totalSessions', e.target.value)} placeholder="15" /></div>
            <div><Label className="text-xs">נוכח</Label><Input value={data.present} onChange={e => updateField('present', e.target.value)} placeholder="14" /></div>
            <div><Label className="text-xs">חסר</Label><Input value={data.absent} onChange={e => updateField('absent', e.target.value)} placeholder="1" /></div>
            <div><Label className="text-xs">אחוז נוכחות</Label><Input value={data.attendanceRate} onChange={e => updateField('attendanceRate', e.target.value)} placeholder="92%" /></div>
          </div>

          <Button onClick={handleGenerate} disabled={generating} className="w-full gradient-accent text-accent-foreground font-bold py-3 mb-4">
            {generating ? 'מייצר דוח...' : 'סיום - הורד דוח סקאוט'}
          </Button>
        </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ScoutReportDialog;
