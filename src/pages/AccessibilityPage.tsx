const AccessibilityPage = () => {
  return (
    <div dir="rtl" className="min-h-screen bg-background p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">הצהרת נגישות</h1>

      <div className="space-y-5 text-sm text-foreground/90 leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold mb-2">כללי</h2>
          <p>
            אנו ב-I2 Analytics משקיעים מאמצים רבים על מנת לספק חוויית שימוש שוויונית ונגישה 
            לכלל המשתמשים, לרבות אנשים עם מוגבלויות, וזאת בהתאם לחוק שוויון זכויות לאנשים 
            עם מוגבלות, התשנ״ח-1998, ותקנות הנגישות הנלוות.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">התאמות הנגישות באפליקציה</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>שינוי גודל טקסט (הגדלה והקטנה)</li>
            <li>מצב ניגודיות גבוהה</li>
            <li>עצירת אנימציות</li>
            <li>הדגשת קישורים</li>
            <li>תמיכה בניווט מקלדת</li>
            <li>שימוש בתגיות ARIA</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">יצירת קשר בנושא נגישות</h2>
          <p>
            אם נתקלתם בבעיית נגישות באפליקציה, אנא פנו אלינו ואנו נעשה כמיטב יכולתנו לטפל 
            בנושא בהקדם:
          </p>
          <ul className="list-none space-y-1 mt-2">
            <li>📧 דוא״ל: <a href="mailto:contact@i2analytics.co.il" className="text-accent underline">contact@i2analytics.co.il</a></li>
            <li>📱 ווטסאפ: <a href="https://wa.me/972526124759" className="text-accent underline">052-6124759</a></li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">תאריך עדכון</h2>
          <p>הצהרת נגישות זו עודכנה לאחרונה בתאריך: אפריל 2026</p>
        </section>
      </div>
    </div>
  );
};

export default AccessibilityPage;
