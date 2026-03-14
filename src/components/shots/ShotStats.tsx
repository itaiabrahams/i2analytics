import { ZoneStats, ZONES, isColdZone, getVerbalRating } from '@/lib/shotZones';
import { AlertTriangle, Target, TrendingUp } from 'lucide-react';

interface Props {
  zoneStats: ZoneStats[];
}

const ShotStats = ({ zoneStats }: Props) => {
  const totalAttempts = zoneStats.reduce((s, z) => s + z.attempts, 0);
  const totalMade = zoneStats.reduce((s, z) => s + z.made, 0);
  const overallPct = totalAttempts > 0 ? Math.round((totalMade / totalAttempts) * 100) : 0;
  const overallVerbal = getVerbalRating(overallPct, totalAttempts);

  const threeStats = zoneStats.filter(z => ZONES.find(zone => zone.id === z.zone)?.type === '3pt');
  const midStats = zoneStats.filter(z => ZONES.find(zone => zone.id === z.zone)?.type === 'mid');
  const paintStats = zoneStats.filter(z => ZONES.find(zone => zone.id === z.zone)?.type === 'paint');

  const calcPct = (stats: ZoneStats[]) => {
    const att = stats.reduce((s, z) => s + z.attempts, 0);
    const md = stats.reduce((s, z) => s + z.made, 0);
    return { att, md, pct: att > 0 ? Math.round((md / att) * 100) : 0 };
  };

  const three = calcPct(threeStats);
  const mid = calcPct(midStats);
  const paint = calcPct(paintStats);

  const coldZones = zoneStats
    .filter(z => isColdZone(z.percentage, z.attempts))
    .map(z => ZONES.find(zone => zone.id === z.zone)!);

  return (
    <div className="space-y-4">
      {/* Overall stats */}
      <div className="gradient-card rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3 justify-end">
          <h3 className="font-semibold text-foreground">סיכום כללי</h3>
          <Target className="h-5 w-5 text-accent" />
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-accent">{overallPct}%</p>
            <p className={`text-xs font-semibold ${overallVerbal.color}`}>{overallVerbal.label}</p>
            <p className="text-[10px] text-muted-foreground">אחוז קליעה</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{totalMade}</p>
            <p className="text-xs text-muted-foreground">קליעות</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{totalAttempts}</p>
            <p className="text-xs text-muted-foreground">זריקות</p>
          </div>
        </div>
      </div>

      {/* Breakdown by area */}
      <div className="gradient-card rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3 justify-end">
          <h3 className="font-semibold text-foreground">לפי אזור</h3>
          <TrendingUp className="h-5 w-5 text-accent" />
        </div>
        <div className="space-y-3">
          {[
            { label: 'שלוש נקודות', ...three, color: 'text-accent' },
            { label: 'Mid Range', ...mid, color: 'text-warning' },
            { label: 'צבע', ...paint, color: 'text-success' },
          ].map(area => {
            const verbal = getVerbalRating(area.pct, area.att);
            return (
              <div key={area.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${area.color}`}>{area.pct}%</span>
                  <span className={`text-xs font-medium ${verbal.color}`}>({verbal.label})</span>
                  <span className="text-xs text-muted-foreground">{area.md}/{area.att}</span>
                </div>
                <span className="text-sm text-foreground">{area.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cold zones */}
      {coldZones.length > 0 && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
          <div className="flex items-center gap-2 mb-2 justify-end">
            <h3 className="font-semibold text-destructive">Cold Zones</h3>
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <p className="text-sm text-muted-foreground text-right mb-2">אזורים שדורשים שיפור:</p>
          <div className="flex flex-wrap gap-2 justify-end">
            {coldZones.map(z => (
              <span key={z.id} className="text-xs px-2 py-1 rounded-full bg-destructive/20 text-destructive font-medium">
                {z.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShotStats;
