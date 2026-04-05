import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Accessibility, Plus, Minus, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'a11y-settings';

interface A11ySettings {
  fontSize: number; // 0 = normal, 1 = large, 2 = extra large
  highContrast: boolean;
  stopAnimations: boolean;
  highlightLinks: boolean;
}

const defaults: A11ySettings = {
  fontSize: 0,
  highContrast: false,
  stopAnimations: false,
  highlightLinks: false,
};

const AccessibilityWidget = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<A11ySettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    } catch {
      return defaults;
    }
  });

  const applySettings = useCallback((s: A11ySettings) => {
    const root = document.documentElement;

    // Font size
    const sizes = ['100%', '115%', '130%'];
    root.style.fontSize = sizes[s.fontSize] || '100%';

    // High contrast
    root.classList.toggle('a11y-high-contrast', s.highContrast);

    // Stop animations
    root.classList.toggle('a11y-stop-animations', s.stopAnimations);

    // Highlight links
    root.classList.toggle('a11y-highlight-links', s.highlightLinks);
  }, []);

  useEffect(() => {
    applySettings(settings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings, applySettings]);

  const update = (partial: Partial<A11ySettings>) => {
    setSettings(prev => ({ ...prev, ...partial }));
  };

  const reset = () => setSettings(defaults);

  const fontLabel = ['רגיל', 'גדול', 'גדול מאוד'][settings.fontSize];

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        aria-label="תפריט נגישות"
        className="fixed z-[9999] bottom-20 left-3 h-11 w-11 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
      >
        <Accessibility className="h-5 w-5" />
      </button>

      {/* Panel */}
      {open && (
        <>
          <div className="fixed inset-0 z-[9998] bg-black/40" onClick={() => setOpen(false)} />
          <div
            role="dialog"
            aria-label="הגדרות נגישות"
            dir="rtl"
            className="fixed z-[9999] bottom-20 left-3 w-72 bg-background border border-border rounded-2xl shadow-2xl p-4 space-y-3 animate-in slide-in-from-bottom-4 duration-200"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Accessibility className="h-4 w-4" />
                נגישות
              </h2>
              <button onClick={() => setOpen(false)} aria-label="סגור" className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Font size */}
            <div className="bg-muted/50 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">גודל טקסט</span>
                <span className="text-[10px] text-muted-foreground">{fontLabel}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8 text-xs"
                  disabled={settings.fontSize === 0}
                  onClick={() => update({ fontSize: Math.max(0, settings.fontSize - 1) })}
                >
                  <Minus className="h-3 w-3 mr-1" />
                  הקטן
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8 text-xs"
                  disabled={settings.fontSize === 2}
                  onClick={() => update({ fontSize: Math.min(2, settings.fontSize + 1) })}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  הגדל
                </Button>
              </div>
            </div>

            {/* Toggles */}
            {[
              { key: 'highContrast' as const, label: 'ניגודיות גבוהה', desc: 'צבעים בולטים יותר' },
              { key: 'stopAnimations' as const, label: 'עצירת אנימציות', desc: 'מפסיק תנועה אוטומטית' },
              { key: 'highlightLinks' as const, label: 'הדגשת קישורים', desc: 'קו תחתון לכל הקישורים' },
            ].map(({ key, label, desc }) => (
              <button
                key={key}
                onClick={() => update({ [key]: !settings[key] })}
                className={`w-full flex items-center justify-between rounded-xl p-3 text-right transition-colors ${
                  settings[key] ? 'bg-blue-600/20 border border-blue-500/40' : 'bg-muted/50'
                }`}
              >
                <div>
                  <div className="text-xs font-medium text-foreground">{label}</div>
                  <div className="text-[10px] text-muted-foreground">{desc}</div>
                </div>
                <div className={`h-5 w-9 rounded-full transition-colors flex items-center px-0.5 ${
                  settings[key] ? 'bg-blue-600 justify-end' : 'bg-muted-foreground/30 justify-start'
                }`}>
                  <div className="h-4 w-4 rounded-full bg-white shadow-sm transition-all" />
                </div>
              </button>
            ))}

            {/* Reset & Statement */}
            <div className="flex gap-2 pt-1">
              <Button size="sm" variant="ghost" className="flex-1 h-8 text-[10px]" onClick={reset}>
                <RotateCcw className="h-3 w-3 mr-1" />
                איפוס
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="flex-1 h-8 text-[10px]"
                onClick={() => {
                  setOpen(false);
                  navigate('/accessibility');
                }}
              >
                הצהרת נגישות
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default AccessibilityWidget;
