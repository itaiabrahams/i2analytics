export interface Player {
  id: string;
  name: string;
  age: number;
  team: string;
  position: string;
  password: string;
}

export interface GameAction {
  id: string;
  quarter: number;
  minute: number;
  score: 1 | 0 | -1;
  description: string;
  type: string;
}

export interface GameStats {
  points: number;
  assists: number;
  rebounds: number;
  steals: number;
  turnovers: number;
  fgPercentage: number;
}

export interface Session {
  id: string;
  playerId: string;
  date: string;
  opponent: string;
  videoUrl: string;
  coachNotes: string;
  actions: GameAction[];
  gameStats: GameStats;
  overallScore: number; // computed average
}

export type UserRole = 'coach' | 'player';

export interface AuthState {
  role: UserRole | null;
  playerId: string | null;
}

export const ACTION_TYPES = [
  'הגנה',
  'התקפה',
  'ריבאונד',
  'מסירה',
  'זריקה',
  'טורנובר',
  'חסימה',
  'גניבה',
  'תנועה ללא כדור',
  'אחר',
] as const;
