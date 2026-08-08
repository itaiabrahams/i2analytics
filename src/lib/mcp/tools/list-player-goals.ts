import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_player_goals",
  title: "List player goals",
  description: "List training goals visible to the signed-in user, with progress percentage and status.",
  inputSchema: {
    player_id: z.string().uuid().optional().describe("Optional player id (coaches only)."),
    status: z.enum(["active", "completed"]).optional().describe("Filter by goal status."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ player_id, status }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("player_goals")
      .select("id, title, description, category, progress, status, target_date, progress_notes, player_id")
      .order("created_at", { ascending: false });
    if (player_id) query = query.eq("player_id", player_id);
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { goals: data ?? [] },
    };
  },
});
