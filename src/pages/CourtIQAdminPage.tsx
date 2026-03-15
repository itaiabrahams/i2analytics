import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Plus, Trash2, Sparkles, Check, X, ChevronLeft, Clock, Brain, Tag, Lightbulb, Edit, Upload, Power, PowerOff, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { CourtIQCategory } from '@/lib/courtiq-types';

interface QuestionRow {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation: string | null;
  publish_at: string;
  expires_at: string;
  category_id: string | null;
  media_url: string | null;
  media_type: string | null;
  is_ai_generated: boolean;
  status: string;
  created_at: string;
}

interface SuggestionRow {
  id: string;
  player_id: string;
  question_text: string;
  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  option_d: string | null;
  correct_option: string | null;
  category_id: string | null;
  status: string;
  created_at: string;
}

const defaultForm = {
  question_text: '',
  option_a: '',
  option_b: '',
  option_c: '',
  option_d: '',
  correct_option: '' as string,
  explanation: '',
  category_id: '',
  media_url: '',
  media_type: '',
  publish_at: '',
};

const CourtIQAdminPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<CourtIQCategory[]>([]);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionRow[]>([]);
  const [form, setForm] = useState(defaultForm);
  const [creating, setCreating] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#3b82f6');
  const [newCatIcon, setNewCatIcon] = useState('🏀');
  const [questionFilter, setQuestionFilter] = useState('all');
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [autoPublishEnabled, setAutoPublishEnabled] = useState(true);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkImporting, setBulkImporting] = useState(false);
  const [addToPool, setAddToPool] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const [catsRes, qRes, sugRes, settingsRes] = await Promise.all([
      supabase.from('courtiq_categories' as any).select('*').order('created_at'),
      supabase.from('courtiq_questions' as any).select('*').order('publish_at', { ascending: false }),
      supabase.from('courtiq_suggestions' as any).select('*').eq('status', 'pending').order('created_at', { ascending: false }),
      supabase.from('courtiq_settings' as any).select('*').limit(1).single(),
    ]);
    if (catsRes.data) setCategories(catsRes.data as unknown as CourtIQCategory[]);
    if (qRes.data) setQuestions(qRes.data as unknown as QuestionRow[]);
    if (sugRes.data) setSuggestions(sugRes.data as unknown as SuggestionRow[]);
    if (settingsRes.data) setAutoPublishEnabled((settingsRes.data as any).auto_publish_enabled);
  };

  const poolCount = questions.filter(q => q.status === 'pool').length;

  const getStatus = (q: QuestionRow) => {
    if (q.status === 'pool') return 'pool';
    const now = Date.now();
    const pub = new Date(q.publish_at).getTime();
    const exp = new Date(q.expires_at).getTime();
    if (now < pub) return 'scheduled';
    if (now >= pub && now < exp) return 'active';
    return 'expired';
  };

  const handleToggleAutoPublish = async (enabled: boolean) => {
    setAutoPublishEnabled(enabled);
    const { error } = await supabase.from('courtiq_settings' as any)
      .update({ auto_publish_enabled: enabled, updated_at: new Date().toISOString(), updated_by: user!.id })
      .not('id', 'is', null); // update all rows
    if (error) { toast.error(error.message); return; }
    toast.success(enabled ? 'פרסום אוטומטי הופעל ✅' : 'פרסום אוטומטי הופסק ⏸️');
  };

  const handleCreateQuestion = async () => {
    if (!form.question_text || !form.option_a || !form.option_b || !form.option_c || !form.option_d || !form.correct_option) {
      toast.error('מלא את כל השדות הנדרשים');
      return;
    }
    if (!addToPool && !form.publish_at) {
      toast.error('בחר תזמון פרסום או סמן "הוסף למאגר"');
      return;
    }
    setCreating(true);
    const isPool = addToPool;
    const { error } = await supabase.from('courtiq_questions' as any).insert({
      question_text: form.question_text,
      option_a: form.option_a,
      option_b: form.option_b,
      option_c: form.option_c,
      option_d: form.option_d,
      correct_option: form.correct_option,
      explanation: form.explanation || null,
      category_id: form.category_id || null,
      media_url: form.media_url || null,
      media_type: form.media_type || null,
      publish_at: isPool ? '2099-01-01T00:00:00Z' : new Date(form.publish_at).toISOString(),
      status: isPool ? 'pool' : 'scheduled',
      created_by: user!.id,
    });
    setCreating(false);
    if (error) { toast.error(error.message); return; }
    toast.success(isPool ? 'השאלה נוספה למאגר!' : 'השאלה נוצרה בהצלחה!');
    setForm(defaultForm);
    setAddToPool(false);
    fetchAll();
  };

  const handleAIGenerate = async () => {
    setAiLoading(true);
    try {
      const categoryName = categories.find(c => c.id === form.category_id)?.name || '';
      const { data, error } = await supabase.functions.invoke('generate-courtiq-question', {
        body: { category: categoryName },
      });
      if (error) throw error;
      if (data) {
        setForm(prev => ({
          ...prev,
          question_text: data.question_text || '',
          option_a: data.option_a || '',
          option_b: data.option_b || '',
          option_c: data.option_c || '',
          option_d: data.option_d || '',
          correct_option: data.correct_option || '',
          explanation: data.explanation || '',
        }));
        toast.success('שאלה נוצרה ב-AI! ערוך ושמור.');
      }
    } catch (e: any) {
      toast.error(e.message || 'שגיאה ביצירת שאלה');
    }
    setAiLoading(false);
  };

  const handleDeleteQuestion = async (id: string) => {
    await supabase.from('courtiq_questions' as any).delete().eq('id', id);
    fetchAll();
    toast.success('נמחקה');
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    const { error } = await supabase.from('courtiq_categories' as any).insert({
      name: newCatName, color: newCatColor, icon: newCatIcon,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('קטגוריה נוספה!');
    setNewCatName('');
    fetchAll();
  };

  const handleDeleteCategory = async (id: string) => {
    await supabase.from('courtiq_categories' as any).delete().eq('id', id);
    fetchAll();
    toast.success('נמחקה');
  };

  const handleApproveSuggestion = async (sug: SuggestionRow) => {
    if (sug.option_a && sug.option_b && sug.option_c && sug.option_d && sug.correct_option) {
      setForm({
        question_text: sug.question_text,
        option_a: sug.option_a,
        option_b: sug.option_b,
        option_c: sug.option_c,
        option_d: sug.option_d,
        correct_option: sug.correct_option,
        explanation: '',
        category_id: sug.category_id || '',
        media_url: '',
        media_type: '',
        publish_at: '',
      });
      toast.info('ההצעה נטענה לטופס. הגדר תזמון ושמור.');
    }
    await supabase.from('courtiq_suggestions' as any).update({ status: 'approved' }).eq('id', sug.id);
    fetchAll();
  };

  const handleRejectSuggestion = async (id: string) => {
    await supabase.from('courtiq_suggestions' as any).update({ status: 'rejected' }).eq('id', id);
    fetchAll();
    toast.success('נדחתה');
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const parseLinesIntoQuestions = (lines: string[]) => {
    const questionsToInsert: any[] = [];
    let errors = 0;
    for (const line of lines) {
      if (!line.trim()) continue;
      // Try pipe-separated first, then comma-separated
      let parts: string[];
      if (line.includes('|')) {
        parts = line.split('|').map(p => p.trim());
      } else {
        parts = parseCSVLine(line);
      }
      if (parts.length < 6) { errors++; continue; }
      const [questionText, optA, optB, optC, optD, correct, explanation] = parts;
      if (!questionText || !optA || !optB || !optC || !optD || !['a', 'b', 'c', 'd'].includes(correct?.toLowerCase())) {
        errors++;
        continue;
      }
      questionsToInsert.push({
        question_text: questionText,
        option_a: optA,
        option_b: optB,
        option_c: optC,
        option_d: optD,
        correct_option: correct.toLowerCase(),
        explanation: explanation || null,
        category_id: bulkCategory || null,
        publish_at: '2099-01-01T00:00:00Z',
        status: 'pool',
        created_by: user!.id,
      });
    }
    return { questionsToInsert, errors };
  };

  const handleBulkImport = async () => {
    if (!bulkText.trim()) return;
    setBulkImporting(true);
    const lines = bulkText.trim().split('\n').filter(l => l.trim());
    // Skip header row if it looks like one
    const firstLine = lines[0]?.toLowerCase() || '';
    const startIndex = (firstLine.includes('שאלה') || firstLine.includes('question')) ? 1 : 0;
    const { questionsToInsert, errors } = parseLinesIntoQuestions(lines.slice(startIndex));

    if (questionsToInsert.length === 0) {
      toast.error('לא נמצאו שאלות תקינות');
      setBulkImporting(false);
      return;
    }

    for (let i = 0; i < questionsToInsert.length; i += 50) {
      const batch = questionsToInsert.slice(i, i + 50);
      const { error } = await supabase.from('courtiq_questions' as any).insert(batch);
      if (error) { toast.error(error.message); setBulkImporting(false); return; }
    }

    toast.success(`${questionsToInsert.length} שאלות נוספו למאגר!${errors > 0 ? ` (${errors} שורות לא תקינות)` : ''}`);
    setBulkText('');
    setBulkImportOpen(false);
    setBulkImporting(false);
    fetchAll();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setBulkText(text);
    toast.success(`הקובץ "${file.name}" נטען · ${text.trim().split('\n').length} שורות`);
    // Reset input so same file can be re-uploaded
    e.target.value = '';
  };

  const filteredQuestions = questions.filter(q => {
    if (questionFilter === 'all') return true;
    return getStatus(q) === questionFilter;
  });

  return (
    <div className="min-h-screen pb-8">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="h-8 w-8">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Brain className="h-5 w-5 text-accent" /> ניהול COURT IQ
        </h1>
      </div>

      {/* Auto-publish toggle + pool stats */}
      <div className="px-4 mt-4 space-y-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {autoPublishEnabled ? <Power className="h-5 w-5 text-success" /> : <PowerOff className="h-5 w-5 text-muted-foreground" />}
                <div>
                  <p className="font-semibold text-foreground text-sm">פרסום אוטומטי</p>
                  <p className="text-xs text-muted-foreground">שאלה אקראית מהמאגר כל שעה (09:00-22:00)</p>
                </div>
              </div>
              <Switch checked={autoPublishEnabled} onCheckedChange={handleToggleAutoPublish} />
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
              <Database className="h-4 w-4 text-accent" />
              <span className="text-sm text-muted-foreground">
                <span className="font-bold text-foreground">{poolCount}</span> שאלות במאגר
              </span>
              <Dialog open={bulkImportOpen} onOpenChange={setBulkImportOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="mr-auto gap-1.5 text-xs">
                    <Upload className="h-3.5 w-3.5" /> ייבוא מאגר
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>ייבוא שאלות למאגר</DialogTitle></DialogHeader>
                  <div className="space-y-3 mt-2">
                    <div className="text-xs text-muted-foreground bg-secondary rounded-lg p-3 space-y-1">
                      <p className="font-bold text-foreground">פורמט: כל שורה = שאלה אחת</p>
                      <p>מופרד ב-<code className="bg-muted px-1 rounded">|</code> (פייפ) או <code className="bg-muted px-1 rounded">,</code> (CSV)</p>
                      <p className="font-mono text-[10px] mt-1">שאלה | תשובה A | תשובה B | תשובה C | תשובה D | a/b/c/d | הסבר</p>
                      <p className="mt-1">דוגמה:</p>
                      <p className="font-mono text-[10px]">כמה שחקנים יש על המגרש? | 5 | 6 | 7 | 4 | a | כל קבוצה מורכבת מ-5 שחקנים</p>
                    </div>

                    {/* File upload */}
                    <div>
                      <Label className="text-sm font-medium text-foreground mb-1 block">העלה קובץ (כל פורמט טקסט)</Label>
                      <Input
                        type="file"
                        accept="*/*"
                        onChange={handleFileUpload}
                        className="text-sm cursor-pointer"
                      />
                    </div>

                    <div className="relative">
                      <div className="absolute inset-x-0 top-0 flex items-center justify-center">
                        <span className="bg-background px-2 text-xs text-muted-foreground -mt-2">או הדבק טקסט ידנית</span>
                      </div>
                      <div className="border-t border-border mt-1 pt-3" />
                    </div>

                    <Select value={bulkCategory} onValueChange={setBulkCategory}>
                      <SelectTrigger><SelectValue placeholder="קטגוריה (אופציונלי)" /></SelectTrigger>
                      <SelectContent>
                        {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Textarea
                      placeholder="הדבק שאלות כאן או העלה קובץ למעלה..."
                      value={bulkText}
                      onChange={e => setBulkText(e.target.value)}
                      rows={10}
                      className="font-mono text-xs"
                      dir="rtl"
                    />
                    <p className="text-xs text-muted-foreground">{bulkText.trim() ? `${bulkText.trim().split('\n').filter(l => l.trim()).length} שורות` : ''}</p>
                    <Button onClick={handleBulkImport} disabled={bulkImporting || !bulkText.trim()} className="w-full gradient-accent text-accent-foreground">
                      <Upload className="h-4 w-4 ml-2" /> {bulkImporting ? 'מייבא...' : 'ייבא למאגר'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="questions" className="px-4 mt-4">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="questions">שאלות</TabsTrigger>
          <TabsTrigger value="categories">קטגוריות</TabsTrigger>
          <TabsTrigger value="suggestions" className="relative">
            הצעות
            {suggestions.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">{suggestions.length}</span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Questions Tab */}
        <TabsContent value="questions" className="space-y-4 mt-4">
          {/* Create form */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                שאלה חדשה
                <Button size="sm" onClick={handleAIGenerate} disabled={aiLoading} className="gap-1.5 text-xs" variant="outline">
                  <Sparkles className="h-3.5 w-3.5" /> {aiLoading ? 'מייצר...' : 'צור עם AI'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={form.category_id} onValueChange={v => setForm(p => ({ ...p, category_id: v }))}>
                <SelectTrigger><SelectValue placeholder="קטגוריה" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Textarea placeholder="טקסט השאלה *" value={form.question_text} onChange={e => setForm(p => ({ ...p, question_text: e.target.value }))} />
              <Input placeholder="קישור מדיה (אופציונלי)" value={form.media_url} onChange={e => setForm(p => ({ ...p, media_url: e.target.value }))} />
              {form.media_url && (
                <Select value={form.media_type} onValueChange={v => setForm(p => ({ ...p, media_type: v }))}>
                  <SelectTrigger><SelectValue placeholder="סוג מדיה" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">תמונה</SelectItem>
                    <SelectItem value="gif">GIF</SelectItem>
                    <SelectItem value="video">וידאו</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <div className="grid grid-cols-2 gap-2">
                {(['a', 'b', 'c', 'd'] as const).map(k => (
                  <div key={k} className="relative">
                    <Input placeholder={`תשובה ${k.toUpperCase()} *`} value={form[`option_${k}` as keyof typeof form] as string}
                      onChange={e => setForm(p => ({ ...p, [`option_${k}`]: e.target.value }))}
                      className={form.correct_option === k ? 'border-success ring-1 ring-success' : ''}
                    />
                    <button onClick={() => setForm(p => ({ ...p, correct_option: k }))}
                      className={`absolute top-1/2 -translate-y-1/2 left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        form.correct_option === k ? 'border-success bg-success text-success-foreground' : 'border-muted-foreground'
                      }`}>
                      {form.correct_option === k && <Check className="h-3 w-3" />}
                    </button>
                  </div>
                ))}
              </div>
              <Textarea placeholder="הסבר (מוצג אחרי תשובה)" value={form.explanation} onChange={e => setForm(p => ({ ...p, explanation: e.target.value }))} rows={2} />
              
              {/* Add to pool toggle */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
                <Switch checked={addToPool} onCheckedChange={setAddToPool} />
                <div>
                  <p className="text-sm font-medium text-foreground">הוסף למאגר</p>
                  <p className="text-xs text-muted-foreground">השאלה תפורסם אוטומטית בזמן אקראי</p>
                </div>
              </div>

              {!addToPool && (
                <div>
                  <Label className="text-xs text-muted-foreground">תזמון פרסום *</Label>
                  <Input type="datetime-local" value={form.publish_at} onChange={e => setForm(p => ({ ...p, publish_at: e.target.value }))} />
                </div>
              )}
              <Button onClick={handleCreateQuestion} disabled={creating} className="w-full gradient-accent text-accent-foreground">
                <Plus className="h-4 w-4 ml-2" /> {creating ? 'שומר...' : addToPool ? 'הוסף למאגר' : 'צור שאלה'}
              </Button>
            </CardContent>
          </Card>

          {/* Filter */}
          <div className="flex gap-2 flex-wrap">
            {[
              { v: 'all', l: 'הכל' },
              { v: 'pool', l: `מאגר (${poolCount})` },
              { v: 'scheduled', l: 'מתוזמנות' },
              { v: 'active', l: 'פעילות' },
              { v: 'expired', l: 'פג תוקף' },
            ].map(f => (
              <Button key={f.v} size="sm" variant={questionFilter === f.v ? 'default' : 'outline'} onClick={() => setQuestionFilter(f.v)}>
                {f.l}
              </Button>
            ))}
          </div>

          {/* Question list */}
          <div className="space-y-2">
            {filteredQuestions.map(q => {
              const status = getStatus(q);
              const cat = categories.find(c => c.id === q.category_id);
              return (
                <Card key={q.id} className="relative">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant={status === 'active' ? 'default' : status === 'scheduled' ? 'secondary' : status === 'pool' ? 'outline' : 'outline'} className="text-xs">
                            {status === 'active' ? '🟢 פעילה' : status === 'scheduled' ? '🕐 מתוזמנת' : status === 'pool' ? '📦 מאגר' : '⏱️ פג תוקף'}
                          </Badge>
                          {cat && <span className="text-xs" style={{ color: cat.color }}>{cat.icon} {cat.name}</span>}
                          {q.is_ai_generated && <Badge variant="outline" className="text-xs">AI</Badge>}
                        </div>
                        <p className="text-sm text-foreground truncate">{q.question_text}</p>
                        {status !== 'pool' && (
                          <p className="text-xs text-muted-foreground mt-1">
                            <Clock className="h-3 w-3 inline ml-1" />
                            {new Date(q.publish_at).toLocaleString('he-IL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteQuestion(q.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {filteredQuestions.length === 0 && (
              <p className="text-center text-muted-foreground py-8">אין שאלות</p>
            )}
          </div>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">הוסף קטגוריה</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="שם הקטגוריה" value={newCatName} onChange={e => setNewCatName(e.target.value)} />
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">צבע</Label>
                  <Input type="color" value={newCatColor} onChange={e => setNewCatColor(e.target.value)} className="h-10" />
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">אייקון (אימוג'י)</Label>
                  <Input value={newCatIcon} onChange={e => setNewCatIcon(e.target.value)} className="text-center text-xl" />
                </div>
              </div>
              <Button onClick={handleAddCategory} className="w-full"><Plus className="h-4 w-4 ml-2" /> הוסף</Button>
            </CardContent>
          </Card>

          <div className="space-y-2">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                <span className="text-2xl">{cat.icon}</span>
                <div className="flex-1">
                  <span className="font-medium text-foreground">{cat.name}</span>
                  <div className="w-4 h-4 rounded-full inline-block mr-2" style={{ backgroundColor: cat.color }} />
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteCategory(cat.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Suggestions Tab */}
        <TabsContent value="suggestions" className="space-y-2 mt-4">
          {suggestions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">אין הצעות ממתינות</p>
          ) : suggestions.map(sug => (
            <Card key={sug.id}>
              <CardContent className="p-3">
                <p className="text-sm text-foreground mb-2">{sug.question_text}</p>
                {sug.option_a && (
                  <div className="grid grid-cols-2 gap-1 mb-2 text-xs text-muted-foreground">
                    <span className={sug.correct_option === 'a' ? 'text-success font-bold' : ''}>A: {sug.option_a}</span>
                    <span className={sug.correct_option === 'b' ? 'text-success font-bold' : ''}>B: {sug.option_b}</span>
                    <span className={sug.correct_option === 'c' ? 'text-success font-bold' : ''}>C: {sug.option_c}</span>
                    <span className={sug.correct_option === 'd' ? 'text-success font-bold' : ''}>D: {sug.option_d}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleApproveSuggestion(sug)} className="gap-1 flex-1">
                    <Check className="h-3 w-3" /> אשר
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleRejectSuggestion(sug.id)} className="gap-1 flex-1">
                    <X className="h-3 w-3" /> דחה
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CourtIQAdminPage;
