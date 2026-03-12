import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check if demo user already exists
    const { data: existing } = await adminClient
      .from("profiles")
      .select("id")
      .eq("is_demo", true)
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ message: "Demo player already exists" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create demo auth user
    const { data: demoUser, error: createError } = await adminClient.auth.admin.createUser({
      email: "demo-player@i2analytics.app",
      password: "demo-player-2025!",
      email_confirm: true,
      user_metadata: {
        display_name: "יואב כהן (דמו)",
        role: "player",
      },
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const demoUserId = demoUser.user.id;

    // Update profile to be demo + approved with details
    await adminClient
      .from("profiles")
      .update({
        is_demo: true,
        is_approved: true,
        team: "הפועל תל אביב U18",
        position: "שוטינג גארד",
        age: 17,
      })
      .eq("user_id", demoUserId);

    // Insert demo sessions
    const sessions = [
      { player_id: demoUserId, coach_id: demoUserId, date: "2025-12-01", opponent: "מכבי חיפה", overall_score: 0.45, points: 18, assists: 5, rebounds: 3, steals: 2, turnovers: 3, fg_percentage: 42, coach_notes: "משחק טוב, שיפור בהגנה" },
      { player_id: demoUserId, coach_id: demoUserId, date: "2025-12-08", opponent: "הפועל ירושלים", overall_score: 0.62, points: 22, assists: 7, rebounds: 5, steals: 3, turnovers: 2, fg_percentage: 48, coach_notes: "ביצועים מצוינים, תנועה ללא כדור נהדרת" },
      { player_id: demoUserId, coach_id: demoUserId, date: "2025-12-15", opponent: "בני הרצליה", overall_score: -0.15, points: 12, assists: 3, rebounds: 4, steals: 1, turnovers: 5, fg_percentage: 35, coach_notes: "יום חלש, יותר מדי טורנוברים" },
      { player_id: demoUserId, coach_id: demoUserId, date: "2025-12-22", opponent: "מכבי תל אביב", overall_score: 0.72, points: 25, assists: 6, rebounds: 6, steals: 4, turnovers: 2, fg_percentage: 52, coach_notes: "משחק מעולה! הביצועים הטובים ביותר העונה" },
      { player_id: demoUserId, coach_id: demoUserId, date: "2026-01-05", opponent: "אליצור נתניה", overall_score: 0.38, points: 16, assists: 8, rebounds: 3, steals: 2, turnovers: 3, fg_percentage: 40, coach_notes: "מסירות טובות, צריך לשפר קליעה מרחוק" },
    ];

    const { data: insertedSessions } = await adminClient.from("sessions").insert(sessions).select("id");

    // Insert demo game actions for each session
    if (insertedSessions) {
      const actions = insertedSessions.flatMap((s: any, si: number) => [
        { session_id: s.id, quarter: 1, minute: 3, score: 1, type: "זריקה", description: "קליעת שתיים מהצבע" },
        { session_id: s.id, quarter: 1, minute: 7, score: 1, type: "הגנה", description: "הגנה אישית מצוינת" },
        { session_id: s.id, quarter: 2, minute: 2, score: -1, type: "טורנובר", description: "מסירה לא מדויקת" },
        { session_id: s.id, quarter: 2, minute: 8, score: 1, type: "מסירה", description: "אסיסט לקליעת שלוש" },
        { session_id: s.id, quarter: 3, minute: 5, score: 1, type: "ריבאונד", description: "ריבאונד התקפי" },
        { session_id: s.id, quarter: 4, minute: 1, score: 0, type: "תנועה ללא כדור", description: "תנועה טובה בהתקפה" },
      ]);
      await adminClient.from("game_actions").insert(actions);
    }

    return new Response(JSON.stringify({ success: true, demoUserId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
