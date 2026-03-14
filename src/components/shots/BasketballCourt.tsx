import { useState } from 'react';
import { ZoneId, ZONES, ZoneStats, getHeatColor, ZONE_COLORS } from '@/lib/shotZones';

interface Props {
  zoneStats: ZoneStats[];
  onZoneClick: (zoneId: ZoneId) => void;
  showHeatMap?: boolean;
  interactive?: boolean;
}

const BasketballCourt = ({ zoneStats, onZoneClick, showHeatMap = false, interactive = true }: Props) => {
  const [hoveredZone, setHoveredZone] = useState<ZoneId | null>(null);

  const getZoneStat = (zoneId: ZoneId): ZoneStats => {
    return zoneStats.find(z => z.zone === zoneId) || { zone: zoneId, attempts: 0, made: 0, percentage: 0 };
  };

  const getZoneFill = (zoneId: ZoneId) => {
    const stat = getZoneStat(zoneId);
    if (showHeatMap && stat.attempts > 0) return getHeatColor(stat.percentage, stat.attempts);
    if (hoveredZone === zoneId) {
      return ZONE_COLORS[zoneId].replace(/[\d.]+\)$/, '0.75)');
    }
    return ZONE_COLORS[zoneId];
  };

  const getZoneStroke = (zoneId: ZoneId) => {
    if (hoveredZone === zoneId) return 'hsl(0, 0%, 100%)';
    return 'hsla(0, 0%, 100%, 0.25)';
  };

  // Court dimensions - compact, zones stay near basket
  const W = 500;
  const H = 400;
  const cx = W / 2;
  const basketY = 50;
  const threeRadius = 175;
  const paintW = 120;
  const paintH = 150;
  const ftCircleR = 55;

  // Mid-range boundary (inside 3pt arc, outside paint)
  const midR = 120; // mid-range outer radius from basket

  // Zone paths - all zones compact near basket
  const zonePaths: Record<ZoneId, string> = {
    // 3-point zones - on/outside the arc, but capped at H
    corner_r_3: `M ${cx + threeRadius} ${basketY} L ${W - 10} ${basketY} L ${W - 10} ${basketY + threeRadius + 30} L ${cx + threeRadius * Math.cos(Math.PI * 0.1)} ${basketY + threeRadius * Math.sin(Math.PI * 0.1)} A ${threeRadius} ${threeRadius} 0 0 0 ${cx + threeRadius} ${basketY} Z`,
    wing_r_3: `M ${cx + threeRadius * Math.cos(Math.PI * 0.1)} ${basketY + threeRadius * Math.sin(Math.PI * 0.1)} L ${W - 10} ${basketY + threeRadius + 30} L ${cx + 80} ${H - 10} L ${cx + threeRadius * Math.cos(Math.PI * 0.35)} ${basketY + threeRadius * Math.sin(Math.PI * 0.35)} A ${threeRadius} ${threeRadius} 0 0 0 ${cx + threeRadius * Math.cos(Math.PI * 0.1)} ${basketY + threeRadius * Math.sin(Math.PI * 0.1)} Z`,
    top_3: `M ${cx + threeRadius * Math.cos(Math.PI * 0.35)} ${basketY + threeRadius * Math.sin(Math.PI * 0.35)} L ${cx + 80} ${H - 10} L ${cx - 80} ${H - 10} L ${cx - threeRadius * Math.cos(Math.PI * 0.35)} ${basketY + threeRadius * Math.sin(Math.PI * 0.35)} A ${threeRadius} ${threeRadius} 0 0 0 ${cx + threeRadius * Math.cos(Math.PI * 0.35)} ${basketY + threeRadius * Math.sin(Math.PI * 0.35)} Z`,
    wing_l_3: `M ${cx - threeRadius * Math.cos(Math.PI * 0.1)} ${basketY + threeRadius * Math.sin(Math.PI * 0.1)} L ${cx - threeRadius * Math.cos(Math.PI * 0.35)} ${basketY + threeRadius * Math.sin(Math.PI * 0.35)} A ${threeRadius} ${threeRadius} 0 0 0 ${cx - threeRadius * Math.cos(Math.PI * 0.1)} ${basketY + threeRadius * Math.sin(Math.PI * 0.1)} L 10 ${basketY + threeRadius + 30} L ${cx - 80} ${H - 10} Z`,
    corner_l_3: `M 10 ${basketY} L ${cx - threeRadius} ${basketY} A ${threeRadius} ${threeRadius} 0 0 0 ${cx - threeRadius * Math.cos(Math.PI * 0.1)} ${basketY + threeRadius * Math.sin(Math.PI * 0.1)} L 10 ${basketY + threeRadius + 30} Z`,

    // Mid-range zones - between paint and 3pt arc
    corner_r_mid: `M ${cx + paintW / 2} ${basketY + 30} L ${cx + midR * Math.cos(Math.PI * 0.1)} ${basketY + midR * Math.sin(Math.PI * 0.1)} L ${cx + threeRadius * Math.cos(Math.PI * 0.1)} ${basketY + threeRadius * Math.sin(Math.PI * 0.1)} A ${threeRadius} ${threeRadius} 0 0 0 ${cx + threeRadius} ${basketY} L ${cx + paintW / 2} ${basketY} Z`,
    wing_r_mid: `M ${cx + midR * Math.cos(Math.PI * 0.1)} ${basketY + midR * Math.sin(Math.PI * 0.1)} L ${cx + midR * Math.cos(Math.PI * 0.35)} ${basketY + midR * Math.sin(Math.PI * 0.35)} L ${cx + threeRadius * Math.cos(Math.PI * 0.35)} ${basketY + threeRadius * Math.sin(Math.PI * 0.35)} A ${threeRadius} ${threeRadius} 0 0 0 ${cx + threeRadius * Math.cos(Math.PI * 0.1)} ${basketY + threeRadius * Math.sin(Math.PI * 0.1)} Z`,
    top_mid: `M ${cx + midR * Math.cos(Math.PI * 0.35)} ${basketY + midR * Math.sin(Math.PI * 0.35)} L ${cx + ftCircleR} ${basketY + paintH} A ${ftCircleR} ${ftCircleR} 0 0 1 ${cx - ftCircleR} ${basketY + paintH} L ${cx - midR * Math.cos(Math.PI * 0.35)} ${basketY + midR * Math.sin(Math.PI * 0.35)} L ${cx - threeRadius * Math.cos(Math.PI * 0.35)} ${basketY + threeRadius * Math.sin(Math.PI * 0.35)} A ${threeRadius} ${threeRadius} 0 0 0 ${cx + threeRadius * Math.cos(Math.PI * 0.35)} ${basketY + threeRadius * Math.sin(Math.PI * 0.35)} Z`,
    wing_l_mid: `M ${cx - midR * Math.cos(Math.PI * 0.35)} ${basketY + midR * Math.sin(Math.PI * 0.35)} L ${cx - midR * Math.cos(Math.PI * 0.1)} ${basketY + midR * Math.sin(Math.PI * 0.1)} L ${cx - threeRadius * Math.cos(Math.PI * 0.1)} ${basketY + threeRadius * Math.sin(Math.PI * 0.1)} A ${threeRadius} ${threeRadius} 0 0 0 ${cx - threeRadius * Math.cos(Math.PI * 0.35)} ${basketY + threeRadius * Math.sin(Math.PI * 0.35)} Z`,
    corner_l_mid: `M ${cx - paintW / 2} ${basketY} L ${cx - threeRadius} ${basketY} A ${threeRadius} ${threeRadius} 0 0 0 ${cx - threeRadius * Math.cos(Math.PI * 0.1)} ${basketY + threeRadius * Math.sin(Math.PI * 0.1)} L ${cx - midR * Math.cos(Math.PI * 0.1)} ${basketY + midR * Math.sin(Math.PI * 0.1)} L ${cx - paintW / 2} ${basketY + 30} Z`,

    // Paint zones
    free_throw: `M ${cx - ftCircleR} ${basketY + paintH} A ${ftCircleR} ${ftCircleR} 0 0 0 ${cx + ftCircleR} ${basketY + paintH} L ${cx + paintW / 2} ${basketY + paintH * 0.5} L ${cx - paintW / 2} ${basketY + paintH * 0.5} Z`,
    under_basket: `M ${cx - paintW / 2} ${basketY + 10} L ${cx + paintW / 2} ${basketY + 10} L ${cx + paintW / 2} ${basketY + paintH * 0.5} L ${cx - paintW / 2} ${basketY + paintH * 0.5} Z`,
  };

  // Zone label positions - compact
  const zoneLabelPos: Record<ZoneId, { x: number; y: number }> = {
    corner_r_3: { x: W - 55, y: basketY + 80 },
    wing_r_3: { x: cx + 155, y: basketY + 170 },
    top_3: { x: cx, y: H - 40 },
    wing_l_3: { x: cx - 155, y: basketY + 170 },
    corner_l_3: { x: 55, y: basketY + 80 },
    corner_r_mid: { x: cx + 100, y: basketY + 45 },
    wing_r_mid: { x: cx + 115, y: basketY + 115 },
    top_mid: { x: cx, y: basketY + 185 },
    wing_l_mid: { x: cx - 115, y: basketY + 115 },
    corner_l_mid: { x: cx - 100, y: basketY + 45 },
    free_throw: { x: cx, y: basketY + 140 },
    under_basket: { x: cx, y: basketY + 45 },
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        style={{ filter: 'drop-shadow(0 4px 20px hsla(220, 60%, 10%, 0.5))' }}
      >
        {/* Court background */}
        <rect x="0" y="0" width={W} height={H} rx="12" fill="hsl(220, 35%, 10%)" stroke="hsl(220, 25%, 22%)" strokeWidth="2" />

        {/* Court lines */}
        <line x1="0" y1={basketY} x2={W} y2={basketY} stroke="hsla(210, 20%, 60%, 0.2)" strokeWidth="1" />

        {/* Three-point arc */}
        <path
          d={`M ${cx - threeRadius} ${basketY} A ${threeRadius} ${threeRadius} 0 0 0 ${cx + threeRadius} ${basketY}`}
          fill="none"
          stroke="hsla(210, 20%, 60%, 0.3)"
          strokeWidth="1.5"
        />
        <line x1={cx - threeRadius} y1={basketY} x2={cx - threeRadius} y2={basketY - 8} stroke="hsla(210, 20%, 60%, 0.3)" strokeWidth="1.5" />
        <line x1={cx + threeRadius} y1={basketY} x2={cx + threeRadius} y2={basketY - 8} stroke="hsla(210, 20%, 60%, 0.3)" strokeWidth="1.5" />

        {/* Paint */}
        <rect
          x={cx - paintW / 2}
          y={basketY}
          width={paintW}
          height={paintH}
          fill="none"
          stroke="hsla(210, 20%, 60%, 0.3)"
          strokeWidth="1.5"
        />

        {/* Free throw circle */}
        <circle
          cx={cx}
          cy={basketY + paintH}
          r={ftCircleR}
          fill="none"
          stroke="hsla(210, 20%, 60%, 0.2)"
          strokeWidth="1"
          strokeDasharray="6 4"
        />

        {/* Basket */}
        <circle cx={cx} cy={basketY + 8} r="8" fill="none" stroke="hsl(25, 95%, 53%)" strokeWidth="2" />
        <line x1={cx - 18} y1={basketY} x2={cx + 18} y2={basketY} stroke="hsl(210, 20%, 70%)" strokeWidth="2.5" />

        {/* Clickable zones */}
        {ZONES.map(zone => (
          <g key={zone.id}>
            <path
              d={zonePaths[zone.id]}
              fill={getZoneFill(zone.id)}
              stroke={getZoneStroke(zone.id)}
              strokeWidth="1.5"
              style={{
                cursor: interactive ? 'pointer' : 'default',
                transition: 'fill 0.2s, stroke 0.2s',
              }}
              onClick={() => interactive && onZoneClick(zone.id)}
              onMouseEnter={() => interactive && setHoveredZone(zone.id)}
              onMouseLeave={() => setHoveredZone(null)}
            />
            {(() => {
              const stat = getZoneStat(zone.id);
              const pos = zoneLabelPos[zone.id];
              return (
                <g style={{ pointerEvents: 'none' }}>
                  {stat.attempts > 0 ? (
                    <>
                      <text
                        x={pos.x}
                        y={pos.y - 6}
                        textAnchor="middle"
                        fill="hsl(0, 0%, 100%)"
                        fontSize="13"
                        fontWeight="800"
                        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}
                      >
                        {stat.percentage}%
                      </text>
                      <text
                        x={pos.x}
                        y={pos.y + 10}
                        textAnchor="middle"
                        fill="hsla(0, 0%, 100%, 0.75)"
                        fontSize="10"
                        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                      >
                        {stat.made}/{stat.attempts}
                      </text>
                    </>
                  ) : (
                    <text
                      x={pos.x}
                      y={pos.y}
                      textAnchor="middle"
                      fill="hsla(0, 0%, 100%, 0.5)"
                      fontSize="10"
                      fontWeight="600"
                    >
                      {zone.shortLabel}
                    </text>
                  )}
                </g>
              );
            })()}
          </g>
        ))}

        {/* Bottom line */}
        <line x1="0" y1={H - 1} x2={W} y2={H - 1} stroke="hsla(210, 20%, 60%, 0.2)" strokeWidth="1" />
      </svg>

      {/* Zone color legend */}
      <div className="flex flex-wrap justify-center gap-1.5 mt-3 px-2">
        {ZONES.map(zone => (
          <div key={zone.id} className="flex items-center gap-1">
            <div
              className="w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: ZONE_COLORS[zone.id].replace(/[\d.]+\)$/, '1)') }}
            />
            <span className="text-[9px] text-muted-foreground">{zone.shortLabel}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BasketballCourt;
