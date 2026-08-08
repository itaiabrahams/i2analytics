import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getMyProfileTool from "./tools/get-my-profile";
import listShotSessionsTool from "./tools/list-shot-sessions";
import listVideoSessionsTool from "./tools/list-video-sessions";
import listPlayerGoalsTool from "./tools/list-player-goals";
import getCourtIQStatsTool from "./tools/get-courtiq-stats";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "count-my-shots",
  title: "count my shots",
  version: "0.1.0",
  instructions:
    "Tools for the count my shots basketball analytics app. Read the signed-in user's profile, shooting sessions and totals, video analysis sessions, training goals and Court IQ trivia stats. Coaches may pass a player_id to read their players' data; players always see only their own.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    getMyProfileTool,
    listShotSessionsTool,
    listVideoSessionsTool,
    listPlayerGoalsTool,
    getCourtIQStatsTool,
  ],
});
