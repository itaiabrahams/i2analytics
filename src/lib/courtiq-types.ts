export interface ActiveQuestion {
  id: string;
  category_id: string | null;
  question_text: string;
  media_url: string | null;
  media_type: string | null;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  publish_at: string;
  expires_at: string;
  created_at: string;
  already_answered: boolean;
  is_peak: boolean;
  category_name: string | null;
  category_color: string | null;
  category_icon: string | null;
}

export interface CourtIQStats {
  player_id: string;
  total_points: number;
  current_streak: number;
  longest_streak: number;
  total_correct: number;
  total_answered: number;
  questions_today: number;
  correct_streak: number;
  last_active_date: string | null;
}

export interface AnswerResult {
  is_correct: boolean;
  correct_option: string;
  points_earned: number;
  bonus_points: number;
  explanation: string | null;
  total_answers: number;
  correct_answers: number;
  correct_percentage: number;
  correct_streak: number;
  daily_streak: number;
  is_peak?: boolean;
  multiplier?: number;
  error?: string;
}

export interface LeaderboardEntry {
  player_id: string;
  display_name: string;
  total_points: number;
  current_streak: number;
  accuracy: number;
}

export interface CourtIQCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
  created_at: string;
}

export type OptionKey = 'a' | 'b' | 'c' | 'd';

export const OPTION_LABELS: Record<OptionKey, string> = {
  a: 'A',
  b: 'B',
  c: 'C',
  d: 'D',
};
