import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import LoginPage from "./LoginPage";

type AuthClient = {
  auth: {
    oauth: {
      getAuthorizationDetails: (id: string) => Promise<{ data: any; error: { message: string } | null }>;
      approveAuthorization: (id: string) => Promise<{ data: any; error: { message: string } | null }>;
      denyAuthorization: (id: string) => Promise<{ data: any; error: { message: string } | null }>;
    };
  };
};

const oauthClient = supabase as unknown as AuthClient;

const OAuthConsent = () => {
  const [params] = useSearchParams();
  const { user, loading } = useAuth();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (loading || !user) return;
      if (!authorizationId) {
        setError("חסר מזהה בקשת הרשאה (authorization_id)");
        return;
      }
      const { data, error } = await oauthClient.auth.oauth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) {
        setError(error.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId, user, loading]);

  const decide = async (approve: boolean) => {
    setBusy(true);
    const { data, error } = approve
      ? await oauthClient.auth.oauth.approveAuthorization(authorizationId)
      : await oauthClient.auth.oauth.denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("שרת ההרשאות לא החזיר כתובת חזרה");
      return;
    }
    window.location.href = target;
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <p className="text-muted-foreground">טוען...</p>
      </main>
    );
  }

  // Not signed in — show the app's normal login screen at this exact URL,
  // so approval continues here right after sign-in.
  if (!user) return <LoginPage />;

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6" dir="rtl">
        <div className="glass-card w-full max-w-md rounded-2xl p-6 text-center">
          <h1 className="mb-2 text-xl font-bold text-foreground">לא ניתן לטעון את בקשת ההרשאה</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </main>
    );
  }

  if (!details) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <p className="text-muted-foreground">טוען בקשת הרשאה...</p>
      </main>
    );
  }

  const clientName = details.client?.name ?? "אפליקציה חיצונית";

  return (
    <main className="flex min-h-screen items-center justify-center p-6" dir="rtl">
      <div className="glass-card w-full max-w-md rounded-2xl p-6">
        <h1 className="mb-3 text-2xl font-bold text-foreground">חיבור {clientName} לחשבון שלך</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          אישור החיבור יאפשר ל{clientName} לקרוא את הנתונים שלך באפליקציה · פרופיל, אימוני זריקות, סשני וידאו,
          יעדים ונתוני Court IQ · בשמך בלבד ובהתאם להרשאות שלך.
        </p>
        <div className="flex gap-3">
          <Button disabled={busy} onClick={() => decide(true)} className="flex-1 gradient-accent font-semibold">
            אישור
          </Button>
          <Button disabled={busy} variant="outline" onClick={() => decide(false)} className="flex-1">
            דחייה
          </Button>
        </div>
      </div>
    </main>
  );
};

export default OAuthConsent;
