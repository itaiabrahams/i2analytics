import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface SessionShotData {
  title: string;
  date: string;
  attempts: number;
  made: number;
  percentage: number;
}

interface ShotProgressChartProps {
  sessions: { id: string; title: string; date: string }[];
  allShots: { session_id: string; attempts: number; made: number }[];
}

const ShotProgressChart = ({ sessions, allShots }: ShotProgressChartProps) => {
  const chartData = useMemo(() => {
    return sessions.map(s => {
      const sessionShots = allShots.filter(sh => sh.session_id === s.id);
      const attempts = sessionShots.reduce((sum, sh) => sum + sh.attempts, 0);
      const made = sessionShots.reduce((sum, sh) => sum + sh.made, 0);
      return {
        title: s.title || new Date(s.date).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' }),
        attempts,
        made,
        percentage: attempts > 0 ? Math.round((made / attempts) * 100) : 0,
      };
    });
  }, [sessions, allShots]);

  if (chartData.length < 2) return null;

  return (
    <div className="gradient-card rounded-xl p-4">
      <h3 className="mb-4 text-right font-semibold text-foreground">התקדמות אחוזי קליעה</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,25%,20%)" />
          <XAxis dataKey="title" tick={{ fill: 'hsl(215,15%,55%)', fontSize: 11 }} />
          <YAxis tick={{ fill: 'hsl(215,15%,55%)', fontSize: 12 }} domain={[0, 100]} unit="%" />
          <Tooltip
            contentStyle={{ background: 'hsl(220,35%,12%)', border: '1px solid hsl(220,25%,20%)', borderRadius: 8, color: 'hsl(210,20%,92%)' }}
            formatter={(value: number) => [`${value}%`, 'אחוז קליעה']}
          />
          <Line type="monotone" dataKey="percentage" stroke="hsl(25,95%,53%)" strokeWidth={3} dot={{ fill: 'hsl(25,95%,53%)', r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex justify-around mt-2 text-xs text-muted-foreground">
        {chartData.length > 0 && (
          <>
            <span>ממוצע: {Math.round(chartData.reduce((s, d) => s + d.percentage, 0) / chartData.length)}%</span>
            <span>סה"כ ניסיונות: {chartData.reduce((s, d) => s + d.attempts, 0)}</span>
            <span>סה"כ קלועות: {chartData.reduce((s, d) => s + d.made, 0)}</span>
          </>
        )}
      </div>
    </div>
  );
};

export default ShotProgressChart;
