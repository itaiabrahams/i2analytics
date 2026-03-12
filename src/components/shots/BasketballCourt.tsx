import { useState } from 'react';
import { ZoneId, ZONES, ZoneStats, getHeatColor } from '@/lib/shotZones';

interface Props {
  zoneStats: ZoneStats[];
  onZoneClick: (zoneId: ZoneId) => void;
  showHeatMap?: boolean;
  interactive?: boolean;
}

// SVG half-court with 12 shooting zones
const BasketballCourt = ({ zoneStats, onZoneClick, showHeatMap = false, interactive = true }: Props) => {
  const [hoveredZone, setHoveredZone] = useState<ZoneId | null>(null);

  const getZoneStat = (zoneId: ZoneId): ZoneStats => {
    return zoneStats.find(z => z.zone === zoneId) || { zone: zoneId, attempts: 0, made: 0, percentage: 0 };
  };

  const getZoneFill = (zoneId: ZoneId) => {
    const stat = getZoneStat(zoneId);
    if (showHeatMap) return getHeatColor(stat.percentage, stat.attempts);
    if (hoveredZone === zoneId) return 'hsla(25, 95%, 53%, 0.25)';
    return 'hsla(220, 60%, 30%, 0.1)';
  };

  const getZoneStroke = (zoneId: ZoneId) => {
    if (hoveredZone === zoneId) return 'hsl(25, 95%, 53%)';
    return 'hsla(210, 20%, 60%, 0.3)';
  };

  // Court dimensions: 500 x 470 (half court)
  const W = 500;
  const H = 470;
  const cx = W / 2; // center x = 250
  const basketY = 55; // basket position from top
  const threeRadius = 190;
  const paintW = 120;
  const paintH = 160;
  const ftCircleR = 60;

  // Zone path definitions - radial sectors around the basket
  const zonePaths: Record<ZoneId, string> = {
    // 3-point zones (on/outside the arc)
    corner_r_3: `M ${cx + paintW/2 + 40} ${H} L ${cx + paintW/2 + 40} ${basketY + 100} L ${cx + threeRadius * Math.cos(Math.PI * 0.15)} ${basketY + threeRadius * Math.sin(Math.PI * 0.15)} A ${threeRadius} ${threeRadius} 0 0 1 ${cx + threeRadius} ${basketY} L ${W} ${basketY} L ${W} ${H} Z`,
    wing_r_3: `M ${cx + threeRadius * Math.cos(Math.PI * 0.15)} ${basketY + threeRadius * Math.sin(Math.PI * 0.15)} L ${cx + paintW/2 + 40} ${basketY + 100} L ${cx + 50} ${basketY + 200} L ${cx + threeRadius * Math.cos(Math.PI * 0.38)} ${basketY + threeRadius * Math.sin(Math.PI * 0.38)} A ${threeRadius} ${threeRadius} 0 0 1 ${cx + threeRadius * Math.cos(Math.PI * 0.15)} ${basketY + threeRadius * Math.sin(Math.PI * 0.15)} Z`,
    top_3: `M ${cx + threeRadius * Math.cos(Math.PI * 0.38)} ${basketY + threeRadius * Math.sin(Math.PI * 0.38)} L ${cx + 50} ${basketY + 200} L ${cx - 50} ${basketY + 200} L ${cx - threeRadius * Math.cos(Math.PI * 0.38)} ${basketY + threeRadius * Math.sin(Math.PI * 0.38)} A ${threeRadius} ${threeRadius} 0 0 1 ${cx + threeRadius * Math.cos(Math.PI * 0.38)} ${basketY + threeRadius * Math.sin(Math.PI * 0.38)} Z`,
    wing_l_3: `M ${cx - threeRadius * Math.cos(Math.PI * 0.38)} ${basketY + threeRadius * Math.sin(Math.PI * 0.38)} L ${cx - 50} ${basketY + 200} L ${cx - paintW/2 - 40} ${basketY + 100} L ${cx - threeRadius * Math.cos(Math.PI * 0.15)} ${basketY + threeRadius * Math.sin(Math.PI * 0.15)} A ${threeRadius} ${threeRadius} 0 0 1 ${cx - threeRadius * Math.cos(Math.PI * 0.38)} ${basketY + threeRadius * Math.sin(Math.PI * 0.38)} Z`,
    corner_l_3: `M 0 ${H} L 0 ${basketY} L ${cx - threeRadius} ${basketY} A ${threeRadius} ${threeRadius} 0 0 1 ${cx - threeRadius * Math.cos(Math.PI * 0.15)} ${basketY + threeRadius * Math.sin(Math.PI * 0.15)} L ${cx - paintW/2 - 40} ${basketY + 100} L ${cx - paintW/2 - 40} ${H} Z`,

    // Mid-range zones (inside arc, outside paint)
    corner_r_mid: `M ${cx + paintW/2} ${basketY + paintH} L ${cx + paintW/2} ${basketY + 70} L ${cx + paintW/2 + 40} ${basketY + 100} L ${cx + paintW/2 + 40} ${basketY + paintH + 40} Z`,
    wing_r_mid: `M ${cx + paintW/2 + 40} ${basketY + 100} L ${cx + paintW/2} ${basketY + 70} L ${cx + paintW/2} ${basketY + ftCircleR + 10} L ${cx + 50} ${basketY + 200} Z`,
    top_mid: `M ${cx + 50} ${basketY + 200} L ${cx + paintW/2} ${basketY + ftCircleR + 10} L ${cx + ftCircleR} ${basketY + paintH} A ${ftCircleR} ${ftCircleR} 0 0 1 ${cx - ftCircleR} ${basketY + paintH} L ${cx - paintW/2} ${basketY + ftCircleR + 10} L ${cx - 50} ${basketY + 200} Z`,
    wing_l_mid: `M ${cx - 50} ${basketY + 200} L ${cx - paintW/2} ${basketY + ftCircleR + 10} L ${cx - paintW/2} ${basketY + 70} L ${cx - paintW/2 - 40} ${basketY + 100} Z`,
    corner_l_mid: `M ${cx - paintW/2 - 40} ${basketY + paintH + 40} L ${cx - paintW/2 - 40} ${basketY + 100} L ${cx - paintW/2} ${basketY + 70} L ${cx - paintW/2} ${basketY + paintH} Z`,

    // Paint zones
    free_throw: `M ${cx - ftCircleR} ${basketY + paintH} A ${ftCircleR} ${ftCircleR} 0 0 0 ${cx + ftCircleR} ${basketY + paintH} L ${cx + paintW/2} ${basketY + paintH * 0.55} L ${cx - paintW/2} ${basketY + paintH * 0.55} Z`,
    under_basket: `M ${cx - paintW/2} ${basketY + 15} L ${cx + paintW/2} ${basketY + 15} L ${cx + paintW/2} ${basketY + paintH * 0.55} L ${cx - paintW/2} ${basketY + paintH * 0.55} Z`,
  };

  // Zone label positions
  const zoneLabelPos: Record<ZoneId, { x: number; y: number }> = {
    corner_r_3: { x: W - 50, y: H - 60 },
    wing_r_3: { x: cx + 150, y: basketY + 160 },
    top_3: { x: cx, y: basketY + 260 },
    wing_l_3: { x: cx - 150, y: basketY + 160 },
    corner_l_3: { x: 50, y: H - 60 },
    corner_r_mid: { x: cx + 95, y: basketY + 150 },
    wing_r_mid: { x: cx + 100, y: basketY + 120 },
    top_mid: { x: cx, y: basketY + 200 },
    wing_l_mid: { x: cx - 100, y: basketY + 120 },
    corner_l_mid: { x: cx - 95, y: basketY + 150 },
    free_throw: { x: cx, y: basketY + 155 },
    under_basket: { x: cx, y: basketY + 50 },
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        style={{ filter: 'drop-shadow(0 4px 20px hsla(220, 60%, 10%, 0.5))' }}
      >
        {/* Court background */}
        <rect x="0" y="0" width={W} height={H} rx="8" fill="hsl(220, 35%, 12%)" stroke="hsl(220, 25%, 25%)" strokeWidth="2" />

        {/* Court lines */}
        {/* Baseline */}
        <line x1="0" y1={basketY} x2={W} y2={basketY} stroke="hsla(210, 20%, 60%, 0.3)" strokeWidth="1.5" />

        {/* Three-point arc */}
        <path
          d={`M ${cx - threeRadius} ${basketY} A ${threeRadius} ${threeRadius} 0 0 0 ${cx + threeRadius} ${basketY}`}
          fill="none"
          stroke="hsla(210, 20%, 60%, 0.4)"
          strokeWidth="1.5"
        />
        {/* Three-point lines to baseline */}
        <line x1={cx - threeRadius} y1={basketY} x2={cx - threeRadius} y2={basketY - 10} stroke="hsla(210, 20%, 60%, 0.4)" strokeWidth="1.5" />
        <line x1={cx + threeRadius} y1={basketY} x2={cx + threeRadius} y2={basketY - 10} stroke="hsla(210, 20%, 60%, 0.4)" strokeWidth="1.5" />

        {/* Paint / key */}
        <rect
          x={cx - paintW / 2}
          y={basketY}
          width={paintW}
          height={paintH}
          fill="none"
          stroke="hsla(210, 20%, 60%, 0.4)"
          strokeWidth="1.5"
        />

        {/* Free throw circle */}
        <circle
          cx={cx}
          cy={basketY + paintH}
          r={ftCircleR}
          fill="none"
          stroke="hsla(210, 20%, 60%, 0.3)"
          strokeWidth="1"
          strokeDasharray="6 4"
        />

        {/* Basket */}
        <circle cx={cx} cy={basketY + 8} r="8" fill="none" stroke="hsl(25, 95%, 53%)" strokeWidth="2" />
        {/* Backboard */}
        <line x1={cx - 18} y1={basketY} x2={cx + 18} y2={basketY} stroke="hsl(210, 20%, 70%)" strokeWidth="2.5" />

        {/* Clickable zones */}
        {ZONES.map(zone => (
          <g key={zone.id}>
            <path
              d={zonePaths[zone.id]}
              fill={getZoneFill(zone.id)}
              stroke={getZoneStroke(zone.id)}
              strokeWidth="1"
              style={{
                cursor: interactive ? 'pointer' : 'default',
                transition: 'fill 0.2s, stroke 0.2s',
              }}
              onClick={() => interactive && onZoneClick(zone.id)}
              onMouseEnter={() => interactive && setHoveredZone(zone.id)}
              onMouseLeave={() => setHoveredZone(null)}
            />
            {/* Zone stats label */}
            {(() => {
              const stat = getZoneStat(zone.id);
              const pos = zoneLabelPos[zone.id];
              return (
                <g
                  style={{ pointerEvents: 'none' }}
                >
                  {stat.attempts > 0 ? (
                    <>
                      <text
                        x={pos.x}
                        y={pos.y - 6}
                        textAnchor="middle"
                        fill="hsl(210, 20%, 92%)"
                        fontSize="13"
                        fontWeight="700"
                      >
                        {stat.percentage}%
                      </text>
                      <text
                        x={pos.x}
                        y={pos.y + 10}
                        textAnchor="middle"
                        fill="hsla(210, 20%, 70%, 0.8)"
                        fontSize="10"
                      >
                        {stat.made}/{stat.attempts}
                      </text>
                    </>
                  ) : (
                    <text
                      x={pos.x}
                      y={pos.y}
                      textAnchor="middle"
                      fill="hsla(210, 20%, 55%, 0.5)"
                      fontSize="10"
                    >
                      {zone.shortLabel}
                    </text>
                  )}
                </g>
              );
            })()}
          </g>
        ))}

        {/* Half court line */}
        <line x1="0" y1={H - 1} x2={W} y2={H - 1} stroke="hsla(210, 20%, 60%, 0.3)" strokeWidth="1.5" />
      </svg>
    </div>
  );
};

export default BasketballCourt;
