import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BarChart3, Video, Target, Users, TrendingUp, Shield, ChevronDown, Check, Star, Zap, Crown } from 'lucide-react';
import LoginPage from './LoginPage';

const LandingPage = () => {
  const [showLogin, setShowLogin] = useState(false);

  if (showLogin) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden" dir="rtl">
      {/* Hero Section */}
      <header className="relative min-h-screen flex flex-col">
        {/* Nav */}
        <nav className="flex items-center justify-between px-6 py-4 md:px-12">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
              <span className="text-lg font-black text-accent-foreground">I²</span>
            </div>
            <span className="text-xl font-bold tracking-tight">I² Analytics</span>
          </div>
          <Button
            onClick={() => setShowLogin(true)}
            variant="outline"
            className="border-accent text-accent hover:bg-accent hover:text-accent-foreground transition-all"
          >
            התחברות
          </Button>
        </nav>

        {/* Hero Content */}
        <div className="flex-1 flex items-center justify-center px-6 md:px-12">
          <div className="max-w-4xl text-center space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-accent" />
              פלטפורמת ניתוח ביצועים לכדורסל
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-tight">
              קח את המשחק שלך
              <br />
              <span className="text-accent">לרמה הבאה</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              I² Analytics היא פלטפורמה מקצועית לניתוח משחקי כדורסל, מעקב ביצועים והגדרת יעדים — 
              מותאמת במיוחד לשחקנים צעירים ומאמנים שרוצים להתפתח.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => setShowLogin(true)}
                className="bg-accent text-accent-foreground hover:bg-accent/90 text-lg px-8 py-6 font-bold shadow-lg shadow-accent/25"
              >
                התחל עכשיו
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="border-border text-foreground hover:bg-secondary text-lg px-8 py-6"
              >
                גלה עוד
                <ChevronDown className="h-5 w-5 mr-2" />
              </Button>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-6 w-6 text-muted-foreground" />
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-black">הכל במקום אחד</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              כלים מקצועיים שעוזרים למאמנים ולשחקנים להתקדם ביחד
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Video,
                title: 'ניתוח משחקים',
                desc: 'תיעוד פעולות בזמן אמת — נקודות, ריבאונדים, אסיסטים, חטיפות ועוד. כל משחק מתועד בפירוט מלא.',
              },
              {
                icon: BarChart3,
                title: 'סטטיסטיקות מתקדמות',
                desc: 'גרפים ותרשימים שמציגים את ההתפתחות לאורך זמן — אחוזי קליעה, מגמות ביצועים וניקוד כולל.',
              },
              {
                icon: Target,
                title: 'יעדים אישיים',
                desc: 'הגדרת מטרות בקטגוריות שונות — התקפה, הגנה, כושר גופני — עם מעקב התקדמות בזמן אמת.',
              },
              {
                icon: Users,
                title: 'ניהול שחקנים',
                desc: 'פאנל ניהול מלא למאמנים — צפייה בכל השחקנים, אישור משתמשים חדשים ומעקב צוותי.',
              },
              {
                icon: TrendingUp,
                title: 'דירוגים תקופתיים',
                desc: 'דירוג שחקנים בקטגוריות שונות — התקפה, הגנה, מאמץ ועבודת צוות — עם הערות מאמן.',
              },
              {
                icon: Shield,
                title: 'פגישות וידאו',
                desc: 'תיאום פגישות וידאו בין מאמנים לשחקנים ישירות מהאפליקציה — לתחקור, משוב ותכנון.',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group rounded-2xl border border-border bg-card p-6 space-y-4 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 md:px-12 bg-secondary/30">
        <div className="max-w-4xl mx-auto text-center space-y-16">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-black">איך זה עובד?</h2>
            <p className="text-muted-foreground text-lg">שלושה צעדים פשוטים להתחלה</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'הירשם', desc: 'צור חשבון תוך שניות — לאחר ההרשמה תעבור אישור מהמאמן שלך' },
              { step: '02', title: 'קבל ליווי אישי', desc: 'מאמן אמיתי מלווה אותך לאורך כל הדרך — ניתוח משחקים, משוב ויעדים' },
              { step: '03', title: 'התקדם', desc: 'עקוב אחרי ההתפתחות שלך עם סטטיסטיקות, דירוגים ותוכנית אימון מותאמת' },
            ].map((item, i) => (
              <div key={i} className="space-y-4">
                <span className="text-5xl font-black text-accent/20">{item.step}</span>
                <h3 className="text-xl font-bold">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-sm text-accent font-medium">
              <Star className="h-4 w-4" />
              מחירון
            </div>
            <h2 className="text-3xl md:text-4xl font-black">בחר את המסלול שמתאים לך</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              כל מסלול כולל ליווי מאמן מקצועי — ההבדל הוא בעומק הניתוח והתדירות
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {/* Single Session */}
            <div className="relative rounded-2xl border border-border bg-card p-8 flex flex-col hover:border-muted-foreground/30 transition-all duration-300 group">
              <div className="space-y-4 mb-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary-foreground">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold">סשן בודד</h3>
                <p className="text-muted-foreground text-sm">מושלם לטעימה ראשונה או ניתוח ממוקד של משחק ספציפי</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-foreground">₪149</span>
                  <span className="text-muted-foreground text-sm">/ סשן</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {[
                  'ניתוח משחק אחד מלא',
                  'סטטיסטיקות מפורטות של המשחק',
                  'פגישת וידאו אישית עם מאמן (30 דק׳)',
                  'דו"ח ביצועים מסכם',
                  'המלצות לשיפור ממוקדות',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <Check className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => setShowLogin(true)}
                variant="outline"
                className="w-full border-border hover:border-accent hover:text-accent py-5 text-base font-semibold transition-all"
              >
                נסה סשן אחד
              </Button>
            </div>

            {/* Monthly - Featured */}
            <div className="relative rounded-2xl border-2 border-accent bg-card p-8 flex flex-col shadow-2xl shadow-accent/10 scale-[1.02] md:scale-105">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-sm font-bold px-5 py-1.5 rounded-full shadow-lg">
                הכי פופולרי ⭐
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20 text-accent">
                  <Star className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold">מנוי חודשי</h3>
                <p className="text-muted-foreground text-sm">ליווי שוטף שמביא לתוצאות — המסלול שהכי מקדם שחקנים</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-accent">₪349</span>
                  <span className="text-muted-foreground text-sm">/ חודש</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {[
                  'ניתוח של עד 4 משחקים בחודש',
                  'סטטיסטיקות מתקדמות + גרפי התקדמות',
                  'פגישות וידאו שבועיות עם מאמן (45 דק׳)',
                  'הגדרת יעדים אישיים + מעקב התקדמות',
                  'דירוגים תקופתיים מפורטים',
                  'תוכנית אימון מותאמת אישית',
                  'גישה מלאה לכל הכלים באפליקציה',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <Check className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => setShowLogin(true)}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 py-5 text-base font-bold shadow-lg shadow-accent/25 transition-all"
              >
                התחל מנוי חודשי
              </Button>
            </div>

            {/* Premium */}
            <div className="relative rounded-2xl border border-border bg-gradient-to-b from-card to-secondary/30 p-8 flex flex-col hover:border-muted-foreground/30 transition-all duration-300 group">
              <div className="space-y-4 mb-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/20 text-warning">
                  <Crown className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold">פרימיום</h3>
                <p className="text-muted-foreground text-sm">חבילה אינטנסיבית לשחקנים שרוצים להגיע לרמה הגבוהה ביותר</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-foreground">₪599</span>
                  <span className="text-muted-foreground text-sm">/ חודש</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {[
                  'ניתוח ללא הגבלה של משחקים',
                  'סטטיסטיקות מתקדמות + השוואה עונתית',
                  'פגישות וידאו ללא הגבלה עם מאמן',
                  'יעדים + תוכנית פיתוח רבעונית',
                  'דירוגים שבועיים מפורטים',
                  'ניתוח וידאו מתקדם עם סימון פעולות',
                  'עדיפות בתמיכה ובתזמון פגישות',
                  'דוחות התקדמות חודשיים להורים',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <Check className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => setShowLogin(true)}
                variant="outline"
                className="w-full border-warning/50 text-warning hover:bg-warning hover:text-warning-foreground py-5 text-base font-semibold transition-all"
              >
                הצטרף לפרימיום
              </Button>
            </div>
          </div>

          {/* Trust note */}
          <p className="text-center text-muted-foreground text-sm mt-10">
            ✦ ניתן לבטל מנוי בכל עת ללא התחייבות &nbsp;·&nbsp; ✦ תשלום מאובטח &nbsp;·&nbsp; ✦ החזר כספי מלא ב-7 הימים הראשונים
          </p>
        </div>
      </section>

      <section className="py-24 px-6 md:px-12">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-5xl font-black">
            מוכן להתחיל?
          </h2>
          <p className="text-muted-foreground text-lg">
            הצטרף לפלטפורמה ותתחיל לעקוב אחרי הביצועים שלך כבר היום.
          </p>
          <Button
            size="lg"
            onClick={() => setShowLogin(true)}
            className="bg-accent text-accent-foreground hover:bg-accent/90 text-lg px-10 py-6 font-bold shadow-lg shadow-accent/25"
          >
            הצטרף עכשיו
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6 md:px-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
              <span className="text-sm font-black text-accent-foreground">I²</span>
            </div>
            <span className="font-bold">I² Analytics</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 I² Analytics. כל הזכויות שמורות.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
