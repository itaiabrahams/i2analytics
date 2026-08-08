import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_video_sessions",
  title: "List video analysis sessions",
  description:
    "List game / video analysis sessions visible to the signed-in user, including box-score stats and the overall analysis score.",
  inputSchema: {
    player_id: z.string().uuid().optional().describe("Optional player id (coaches only)."),
    limit: z.number().int().min(1).max(100).default(20).describe("Maximum number of sessions to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ player_id, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("sessions")
      .select(
        "id, date, opponent, status, points, assists, rebounds, steals, turnovers, fg_percentage, overall_score, coach_notes, player_id"
      )
      .order("date", { ascending: false })
      .limit(limit ?? 20);
    if (player_id) query = query.eq("player_id", player_id);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { sessions: data ?? [] },
    };
  },
});
