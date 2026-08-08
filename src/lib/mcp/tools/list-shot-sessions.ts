import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_shot_sessions",
  title: "List shooting sessions",
  description:
    "List shooting (Shot Tracker) sessions visible to the signed-in user, with makes, attempts and shooting percentage per session.",
  inputSchema: {
    player_id: z
      .string()
      .uuid()
      .optional()
      .describe("Optional player id. Coaches can pass a player id; players see only their own sessions."),
    limit: z.number().int().min(1).max(100).default(20).describe("Maximum number of sessions to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ player_id, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("shot_sessions")
      .select("id, title, date, notes, player_id, shots(zone, shot_type, made, attempts)")
      .order("date", { ascending: false })
      .limit(limit ?? 20);
    if (player_id) query = query.eq("player_id", player_id);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const sessions = (data ?? []).map((session) => {
      const shots = (session.shots ?? []) as { made: number; attempts: number; zone: string; shot_type: string }[];
      const made = shots.reduce((sum, s) => sum + (s.made ?? 0), 0);
      const attempts = shots.reduce((sum, s) => sum + (s.attempts ?? 0), 0);
      return {
        id: session.id,
        title: session.title,
        date: session.date,
        notes: session.notes,
        player_id: session.player_id,
        made,
        attempts,
        percentage: attempts > 0 ? Math.round((made / attempts) * 100) : 0,
        by_zone: shots,
      };
    });

    return {
      content: [{ type: "text", text: JSON.stringify(sessions) }],
      structuredContent: { sessions },
    };
  },
});
