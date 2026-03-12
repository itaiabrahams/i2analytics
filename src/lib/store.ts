import { Player, Session, GameAction } from './types';

const initialPlayers: Player[] = [
  { id: '1', name: 'אור כהן', age: 16, team: 'מכבי תל אביב נוער', position: 'פלייגארד', password: '1234' },
  { id: '2', name: 'יונתן לוי', age: 17, team: 'מכבי תל אביב נוער', position: 'שוטינג גארד', password: '1234' },
  { id: '3', name: 'דניאל אברהם', age: 15, team: 'מכבי תל אביב נוער', position: 'סנטר', password: '1234' },
  { id: '4', name: 'עידן מזרחי', age: 16, team: 'מכבי תל אביב נוער', position: 'סמול פורוורד', password: '1234' },
];

const generateActions = (count: number): GameAction[] => {
  const types = ['הגנה', 'התקפה', 'ריבאונד', 'מסירה', 'זריקה', 'טורנובר', 'חסימה', 'גניבה'];
  const descriptions: Record<string, string[]> = {
    'הגנה': ['הגנה טובה 1 על 1', 'עזרה הגנתית מצוינת', 'הגנה חלשה על כדור'],
    'התקפה': ['חדירה מוצלחת לסל', 'תנועה טובה ללא כדור', 'החלטה שגויה בהתקפה'],
    'ריבאונד': ['ריבאונד התקפי', 'ריבאונד הגנתי חזק', 'פספוס ריבאונד'],
    'מסירה': ['מסירה מדויקת לאסיסט', 'מסירה יצירתית', 'מסירה רשלנית'],
    'זריקה': ['קליעת שלוש', 'זריקת ביניים מדויקת', 'החטאה מתחת לסל'],
    'טורנובר': ['איבוד כדור ברשלנות', 'מסירה שנחטפה', 'עבירת צעדים'],
    'חסימה': ['חסימה מרשימה', 'ניסיון חסימה טוב'],
    'גניבה': ['גניבת כדור מצוינת', 'יירוט מסירה'],
  };
  const scores: (1 | 0 | -1)[] = [1, 0, -1];
  
  return Array.from({ length: count }, (_, i) => {
    const type = types[Math.floor(Math.random() * types.length)];
    const descs = descriptions[type] || ['פעולה'];
    const score = scores[Math.floor(Math.random() * 3)];
    return {
      id: `action-${i}`,
      quarter: Math.floor(Math.random() * 4) + 1,
      minute: Math.floor(Math.random() * 10) + 1,
      score,
      description: descs[Math.floor(Math.random() * descs.length)],
      type,
    };
  }).sort((a, b) => a.quarter - b.quarter || a.minute - b.minute);
};

const calcOverall = (actions: GameAction[]) => {
  if (actions.length === 0) return 0;
  return actions.reduce((sum, a) => sum + a.score, 0) / actions.length;
};

const createSession = (id: string, playerId: string, date: string, opponent: string, actionCount: number): Session => {
  const actions = generateActions(actionCount);
  return {
    id,
    playerId,
    date,
    opponent,
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    coachNotes: 'ביצועים טובים באופן כללי. צריך לשפר הגנה 1 על 1.',
    actions,
    gameStats: {
      points: Math.floor(Math.random() * 20) + 5,
      assists: Math.floor(Math.random() * 8),
      rebounds: Math.floor(Math.random() * 10),
      steals: Math.floor(Math.random() * 5),
      turnovers: Math.floor(Math.random() * 6),
      fgPercentage: Math.floor(Math.random() * 40) + 30,
    },
    overallScore: parseFloat(calcOverall(actions).toFixed(2)),
  };
};

const initialSessions: Session[] = [
  createSession('s1', '1', '2025-03-01', 'הפועל ירושלים', 15),
  createSession('s2', '1', '2025-03-08', 'מכבי חיפה', 18),
  createSession('s3', '1', '2025-03-15', 'הפועל תל אביב', 20),
  createSession('s4', '2', '2025-03-02', 'הפועל ירושלים', 14),
  createSession('s5', '2', '2025-03-10', 'בני הרצליה', 16),
  createSession('s6', '3', '2025-03-05', 'מכבי ראשון', 12),
  createSession('s7', '3', '2025-03-12', 'הפועל חולון', 19),
  createSession('s8', '4', '2025-03-03', 'עירוני נהריה', 17),
];

// Simple in-memory store
let players = [...initialPlayers];
let sessions = [...initialSessions];

export const store = {
  getPlayers: () => players,
  getPlayer: (id: string) => players.find(p => p.id === id),
  
  getSessions: () => sessions,
  getPlayerSessions: (playerId: string) => sessions.filter(s => s.playerId === playerId),
  getSession: (id: string) => sessions.find(s => s.id === id),
  
  addSession: (session: Session) => {
    sessions = [session, ...sessions];
  },
  
  getPlayerAvgScore: (playerId: string) => {
    const ps = sessions.filter(s => s.playerId === playerId);
    if (ps.length === 0) return 0;
    return parseFloat((ps.reduce((sum, s) => sum + s.overallScore, 0) / ps.length).toFixed(2));
  },

  addPlayer: (player: Player) => {
    players = [...players, player];
  },

  updatePlayer: (id: string, data: Partial<Omit<Player, 'id'>>) => {
    players = players.map(p => p.id === id ? { ...p, ...data } : p);
  },

  authenticateCoach: (password: string) => password === 'coach123',
  authenticatePlayer: (playerId: string, password: string) => {
    const player = players.find(p => p.id === playerId);
    return player?.password === password;
  },
};
