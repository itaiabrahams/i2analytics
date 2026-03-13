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
    const { category } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `צור שאלת טריוויה חדשה ומקורית על כדורסל בעברית.
${category ? `הקטגוריה: ${category}.` : ""}
דרישות:
- השאלה צריכה להיות מאתגרת ומעניינת
- 4 תשובות אפשריות, אחת נכונה ו-3 מסיחים אמינים
- הסבר קצר (1-2 משפטים) למה התשובה הנכונה היא הנכונה
- השאלה יכולה להיות על חוקים, טקטיקה, היסטוריה, שחקנים, סיטואציות משחק, או ידע כללי בכדורסל`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content:
                "אתה מומחה כדורסל שיוצר שאלות טריוויה מעולות. כל השאלות והתשובות בעברית.",
            },
            { role: "user", content: prompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "create_question",
                description: "Create a basketball trivia question in Hebrew",
                parameters: {
                  type: "object",
                  properties: {
                    question_text: {
                      type: "string",
                      description: "The question text in Hebrew",
                    },
                    option_a: {
                      type: "string",
                      description: "First answer option",
                    },
                    option_b: {
                      type: "string",
                      description: "Second answer option",
                    },
                    option_c: {
                      type: "string",
                      description: "Third answer option",
                    },
                    option_d: {
                      type: "string",
                      description: "Fourth answer option",
                    },
                    correct_option: {
                      type: "string",
                      enum: ["a", "b", "c", "d"],
                      description: "The correct answer letter",
                    },
                    explanation: {
                      type: "string",
                      description: "Brief explanation in Hebrew (1-2 sentences)",
                    },
                  },
                  required: [
                    "question_text",
                    "option_a",
                    "option_b",
                    "option_c",
                    "option_d",
                    "correct_option",
                    "explanation",
                  ],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "create_question" },
          },
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "הגעת למגבלת בקשות. נסה שוב בעוד דקה." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "נדרש חידוש קרדיטים." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const question = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(question), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-courtiq-question error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
