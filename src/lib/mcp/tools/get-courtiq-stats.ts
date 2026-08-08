import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_courtiq_stats",
  title: "Get Court IQ stats",
  description: "Get Court IQ trivia stats (points, streaks, correct answers) for the signed-in user or a given player.",
  inputSchema: {
    player_id: z.string().uuid().optional().describe("Optional player id (coaches only). Defaults to the signed-in user."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ player_id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("courtiq_player_stats")
      .select("*")
      .eq("player_id", player_id ?? ctx.getUserId()!)
      .maybeSingle();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: "No Court IQ stats yet." }] };

    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { stats: data },
    };
  },
});
