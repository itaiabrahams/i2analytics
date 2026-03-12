import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PlayerProfile {
  id: string;
  user_id: string;
  display_name: string;
  role: string;
  team: string | null;
  position: string | null;
  age: number | null;
  is_approved: boolean;
}

export interface SessionData {
  id: string;
  player_id: string;
  coach_id: string;
  date: string;
  opponent: string;
  video_url: string;
  meeting_url: string;
  coach_notes: string;
  points: number;
  assists: number;
  rebounds: number;
  steals: number;
  turnovers: number;
  fg_percentage: number;
  overall_score: number;
  created_at: string;
}

export interface GameActionData {
  id: string;
  session_id: string;
  quarter: number;
  minute: number;
  score: number;
  description: string;
  type: string;
}

// Get all players (profiles with role=player) for coach view
export function usePlayers() {
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'player')
      .eq('is_approved', true)
      .order('display_name');
    if (data) setPlayers(data as unknown as PlayerProfile[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { players, loading, refetch: fetch };
}

// Get a single player profile
export function usePlayer(userId: string | undefined) {
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
      .then(({ data }) => {
        if (data) setPlayer(data as unknown as PlayerProfile);
        setLoading(false);
      });
  }, [userId]);

  return { player, loading };
}

// Get sessions for a player
export function usePlayerSessions(playerId: string | undefined) {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!playerId) { setLoading(false); return; }
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('player_id', playerId)
      .order('date', { ascending: true });
    if (data) setSessions(data as unknown as SessionData[]);
    setLoading(false);
  }, [playerId]);

  useEffect(() => { fetch(); }, [fetch]);
  return { sessions, loading, refetch: fetch };
}

// Get a single session with actions
export function useSession(sessionId: string | undefined) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [actions, setActions] = useState<GameActionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) { setLoading(false); return; }
    Promise.all([
      supabase.from('sessions').select('*').eq('id', sessionId).single(),
      supabase.from('game_actions').select('*').eq('session_id', sessionId).order('quarter').order('minute'),
    ]).then(([sessRes, actRes]) => {
      if (sessRes.data) setSession(sessRes.data as unknown as SessionData);
      if (actRes.data) setActions(actRes.data as unknown as GameActionData[]);
      setLoading(false);
    });
  }, [sessionId]);

  return { session, actions, loading };
}

// Get player average score
export function usePlayerAvgScore(playerId: string | undefined) {
  const [avg, setAvg] = useState(0);

  useEffect(() => {
    if (!playerId) return;
    supabase
      .from('sessions')
      .select('overall_score')
      .eq('player_id', playerId)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const sum = data.reduce((s, d) => s + Number(d.overall_score), 0);
          setAvg(parseFloat((sum / data.length).toFixed(2)));
        }
      });
  }, [playerId]);

  return avg;
}

// Get session counts per player (for coach dashboard)
export function usePlayerSessionCounts() {
  const [counts, setCounts] = useState<Record<string, { count: number; avgScore: number; latestScores: number[] }>>({});

  useEffect(() => {
    supabase
      .from('sessions')
      .select('player_id, overall_score, date')
      .order('date', { ascending: false })
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, { count: number; totalScore: number; latestScores: number[] }> = {};
        for (const s of data) {
          if (!map[s.player_id]) map[s.player_id] = { count: 0, totalScore: 0, latestScores: [] };
          map[s.player_id].count++;
          map[s.player_id].totalScore += Number(s.overall_score);
          if (map[s.player_id].latestScores.length < 2) map[s.player_id].latestScores.push(Number(s.overall_score));
        }
        const result: Record<string, { count: number; avgScore: number; latestScores: number[] }> = {};
        for (const [k, v] of Object.entries(map)) {
          result[k] = { count: v.count, avgScore: v.count > 0 ? parseFloat((v.totalScore / v.count).toFixed(2)) : 0, latestScores: v.latestScores };
        }
        setCounts(result);
      });
  }, []);

  return counts;
}
