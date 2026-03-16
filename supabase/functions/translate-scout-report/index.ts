import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { data } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing API key" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `You are a professional translator. Your task is to translate ALL Hebrew text in the following JSON object to English.

CRITICAL RULES:
1. Translate EVERY string value that contains Hebrew characters to English - this includes names, positions, statuses, notes, goals, recommendations, domains, and ALL other text fields.
2. For Hebrew names (people names), transliterate them to English (e.g., "יואב כהן" → "Yoav Cohen", "איתי אברהמס" → "Itai Abrahams").
3. For Hebrew positions like "פויינט גארד" → "Point Guard", "סנטר" → "Center", "שוטינג גארד" → "Shooting Guard", "סמול פורוורד" → "Small Forward", "פאוור פורוורד" → "Power Forward".
4. For status values like "פעיל" → "Active", "בתהליך" → "In Progress", "הושלם" → "Completed", "לא התחיל" → "Not Started".
5. Keep numbers, percentages (like "82%"), dates (like "01/06/2026"), measurements (like "3.1s", "62 cm"), and ratings (like "8/10") EXACTLY as they are.
6. Keep all JSON keys exactly the same - only translate values.
7. If a value is already in English, keep it unchanged.
8. Translate domain names like "כדורסל" → "Basketball", "פיזי" → "Physical", "תזונה" → "Nutrition".

Return ONLY the translated JSON object. No markdown, no code blocks, no extra text.

${JSON.stringify(data)}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
      }),
    });

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "";

    // Extract JSON from response (may be wrapped in ```json blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const translated = JSON.parse(jsonStr.trim());

    return new Response(JSON.stringify({ translated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Translation error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
