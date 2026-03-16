import { SHOOTING_DRILLS } from '@/lib/shootingDrills';

interface ShootingDrillsCardProps {
  monthIndex: number;
  compact?: boolean;
}

const ShootingDrillsCard = ({ monthIndex, compact = false }: ShootingDrillsCardProps) => {
  const drills = SHOOTING_DRILLS[monthIndex];
  if (!drills) return null;

  return (
    <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 space-y-3" dir="rtl">
      <div className="flex items-center gap-2 justify-start">
        <span className="text-lg">🎯</span>
        <h4 className={`font-bold text-accent ${compact ? 'text-sm' : 'text-base'}`}>
          תוכנית קליעה - חודש {monthIndex}
        </h4>
      </div>
      <ul className="space-y-2">
        {drills.map((drill, i) => (
          <li key={i} className={`flex items-start gap-2 ${compact ? 'text-xs' : 'text-sm'} text-foreground`}>
            <span className="text-accent font-bold mt-0.5">{i + 1}.</span>
            <span>{drill}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ShootingDrillsCard;
