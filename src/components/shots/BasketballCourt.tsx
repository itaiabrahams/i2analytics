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
    return 'hsla(0, 0%, 100%, 0.3)';
  };

  // Court dimensions
  const W = 500;
  const H = 470;
  const cx = W / 2; // 250
  const basketY = 60;  // basket from top
  
  // Real court proportions
  const threeR = 190;  // 3pt arc radius
  const cornerThreeX = 60; // distance from sideline to corner 3
  const paintW = 120;
  const paintH = 160;
  const ftR = 60; // free throw circle radius
  
  // 3pt corner lines extend from baseline
  const cornerLineLeft = cx - threeR;
  const cornerLineRight = cx + threeR;
  
  // The arc starts where the corner lines end
  // Arc boundary (thin strip outside arc for 3pt zones)
  const arcBand = 35; // how far outside the arc the 3pt zone extends
  const outerR = threeR + arcBand;
  
  // Angles for dividing the arc into 3 sectors (corners are separate rectangles)
  // The arc goes from ~0 to ~π (bottom half)
  // Corner zones are the straight vertical parts on the sides
  // Arc zones: divide the semicircle into 3 equal parts
  const arcStart = Math.asin((0) / threeR); // where arc starts (at corner line level)
  const a1 = Math.PI * 0.2;  // boundary between corner-wing
  const a2 = Math.PI * 0.4;  // boundary between wing-top
  const a3 = Math.PI * 0.6;  // boundary between top-wing (left side)
  const a4 = Math.PI * 0.8;  // boundary between wing-corner (left side)

  // Helper: point on arc from basket center
  const arcPt = (r: number, angle: number) => ({
    x: cx + r * Math.cos(angle),
    y: basketY + r * Math.sin(angle),
  });

  // ====== ZONE PATHS ======
  // All zones are contained between baseline and just past the 3pt arc

  // Corner 3pt zones - rectangular areas on each side
  const cornerHeight = threeR * Math.sin(a1);
  
  const zonePaths: Record<ZoneId, string> = {
    // RIGHT CORNER 3 - rectangle on right side, from baseline down to arc start
    corner_r_3: (() => {
      const p1 = { x: cornerLineRight, y: basketY };  // top-left (at arc)
      const p2 = { x: W, y: basketY };                 // top-right (court edge)
      const p3 = { x: W, y: basketY + cornerHeight };  // bottom-right
      const ap = arcPt(threeR, a1);                     // arc point
      return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y} L ${ap.x} ${ap.y} A ${threeR} ${threeR} 0 0 0 ${p1.x} ${p1.y} Z`;
    })(),

    // RIGHT WING 3
    wing_r_3: (() => {
      const inner1 = arcPt(threeR, a1);
      const inner2 = arcPt(threeR, a2);
      const outer1 = arcPt(outerR, a1);
      const outer2 = arcPt(outerR, a2);
      return `M ${inner1.x} ${inner1.y} L ${outer1.x} ${outer1.y} A ${outerR} ${outerR} 0 0 1 ${outer2.x} ${outer2.y} L ${inner2.x} ${inner2.y} A ${threeR} ${threeR} 0 0 0 ${inner1.x} ${inner1.y} Z`;
    })(),

    // TOP 3
    top_3: (() => {
      const inner1 = arcPt(threeR, a2);
      const inner2 = arcPt(threeR, a3);
      const outer1 = arcPt(outerR, a2);
      const outer2 = arcPt(outerR, a3);
      return `M ${inner1.x} ${inner1.y} L ${outer1.x} ${outer1.y} A ${outerR} ${outerR} 0 0 1 ${outer2.x} ${outer2.y} L ${inner2.x} ${inner2.y} A ${threeR} ${threeR} 0 0 0 ${inner1.x} ${inner1.y} Z`;
    })(),

    // LEFT WING 3
    wing_l_3: (() => {
      const inner1 = arcPt(threeR, a3);
      const inner2 = arcPt(threeR, a4);
      const outer1 = arcPt(outerR, a3);
      const outer2 = arcPt(outerR, a4);
      return `M ${inner1.x} ${inner1.y} L ${outer1.x} ${outer1.y} A ${outerR} ${outerR} 0 0 1 ${outer2.x} ${outer2.y} L ${inner2.x} ${inner2.y} A ${threeR} ${threeR} 0 0 0 ${inner1.x} ${inner1.y} Z`;
    })(),

    // LEFT CORNER 3
    corner_l_3: (() => {
      const p1 = { x: cx - threeR, y: basketY };
      const p2 = { x: 0, y: basketY };
      const p3 = { x: 0, y: basketY + cornerHeight };
      const ap = arcPt(threeR, a4);
      return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y} L ${ap.x} ${ap.y} A ${threeR} ${threeR} 0 0 1 ${p1.x} ${p1.y} Z`;
    })(),

    // ====== MID-RANGE ZONES (between paint and 3pt arc) ======
    // RIGHT CORNER MID
    corner_r_mid: (() => {
      const p1 = { x: cx + paintW / 2, y: basketY };
      const p2 = { x: cornerLineRight, y: basketY };
      const ap = arcPt(threeR, a1);
      const p3 = { x: cx + paintW / 2, y: basketY + paintH * 0.5 };
      return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} A ${threeR} ${threeR} 0 0 1 ${ap.x} ${ap.y} L ${p3.x} ${p3.y} Z`;
    })(),

    // RIGHT WING MID
    wing_r_mid: (() => {
      const ap1 = arcPt(threeR, a1);
      const ap2 = arcPt(threeR, a2);
      const p1 = { x: cx + paintW / 2, y: basketY + paintH * 0.5 };
      const p2 = { x: cx + ftR, y: basketY + paintH };
      return `M ${p1.x} ${p1.y} L ${ap1.x} ${ap1.y} A ${threeR} ${threeR} 0 0 1 ${ap2.x} ${ap2.y} L ${p2.x} ${p2.y} Z`;
    })(),

    // TOP MID
    top_mid: (() => {
      const ap1 = arcPt(threeR, a2);
      const ap2 = arcPt(threeR, a3);
      const p1 = { x: cx + ftR, y: basketY + paintH };
      const p2 = { x: cx - ftR, y: basketY + paintH };
      return `M ${p1.x} ${p1.y} L ${ap1.x} ${ap1.y} A ${threeR} ${threeR} 0 0 1 ${ap2.x} ${ap2.y} L ${p2.x} ${p2.y} A ${ftR} ${ftR} 0 0 0 ${p1.x} ${p1.y} Z`;
    })(),

    // LEFT WING MID
    wing_l_mid: (() => {
      const ap1 = arcPt(threeR, a3);
      const ap2 = arcPt(threeR, a4);
      const p1 = { x: cx - ftR, y: basketY + paintH };
      const p2 = { x: cx - paintW / 2, y: basketY + paintH * 0.5 };
      return `M ${p1.x} ${p1.y} L ${ap1.x} ${ap1.y} A ${threeR} ${threeR} 0 0 1 ${ap2.x} ${ap2.y} L ${p2.x} ${p2.y} Z`;
    })(),

    // LEFT CORNER MID
    corner_l_mid: (() => {
      const p1 = { x: cx - paintW / 2, y: basketY };
      const p2 = { x: cornerLineLeft, y: basketY };
      const ap = arcPt(threeR, a4);
      const p3 = { x: cx - paintW / 2, y: basketY + paintH * 0.5 };
      return `M ${p2.x} ${p2.y} L ${p1.x} ${p1.y} L ${p3.x} ${p3.y} L ${ap.x} ${ap.y} A ${threeR} ${threeR} 0 0 0 ${p2.x} ${p2.y} Z`;
    })(),

    // ====== PAINT ZONES ======
    // FREE THROW - upper paint area (from mid-paint to FT line)
    free_throw: `M ${cx - paintW / 2} ${basketY + paintH * 0.5} L ${cx + paintW / 2} ${basketY + paintH * 0.5} L ${cx + ftR} ${basketY + paintH} A ${ftR} ${ftR} 0 0 1 ${cx - ftR} ${basketY + paintH} Z`,

    // UNDER BASKET - close to basket
    under_basket: `M ${cx - paintW / 2} ${basketY + 10} L ${cx + paintW / 2} ${basketY + 10} L ${cx + paintW / 2} ${basketY + paintH * 0.5} L ${cx - paintW / 2} ${basketY + paintH * 0.5} Z`,
  };

  // Zone label positions
  const zoneLabelPos: Record<ZoneId, { x: number; y: number }> = {
    corner_r_3: { x: cx + threeR + 25, y: basketY + 45 },
    wing_r_3: { x: arcPt(threeR + arcBand / 2, (a1 + a2) / 2).x, y: arcPt(threeR + arcBand / 2, (a1 + a2) / 2).y },
    top_3: { x: cx, y: arcPt(threeR + arcBand / 2, Math.PI / 2).y },
    wing_l_3: { x: arcPt(threeR + arcBand / 2, (a3 + a4) / 2).x, y: arcPt(threeR + arcBand / 2, (a3 + a4) / 2).y },
    corner_l_3: { x: cx - threeR - 25, y: basketY + 45 },
    corner_r_mid: { x: cx + paintW / 2 + 35, y: basketY + 50 },
    wing_r_mid: { x: cx + 100, y: basketY + 130 },
    top_mid: { x: cx, y: basketY + 195 },
    wing_l_mid: { x: cx - 100, y: basketY + 130 },
    corner_l_mid: { x: cx - paintW / 2 - 35, y: basketY + 50 },
    free_throw: { x: cx, y: basketY + 145 },
    under_basket: { x: cx, y: basketY + 50 },
  };

  // Outer boundary of the court (just past the arc)
  const courtBottom = basketY + outerR + 15;

  return (
    <div className="w-full max-w-lg mx-auto">
      <svg
        viewBox={`0 0 ${W} ${Math.min(H, courtBottom + 10)}`}
        className="w-full h-auto"
        style={{ filter: 'drop-shadow(0 4px 20px hsla(220, 60%, 10%, 0.5))' }}
      >
        {/* Court background */}
        <rect x="0" y="0" width={W} height={Math.min(H, courtBottom + 10)} rx="12" fill="hsl(220, 35%, 10%)" stroke="hsl(220, 25%, 22%)" strokeWidth="2" />

        {/* Baseline */}
        <line x1="0" y1={basketY} x2={W} y2={basketY} stroke="hsla(210, 20%, 60%, 0.25)" strokeWidth="1.5" />

        {/* Three-point arc */}
        <path
          d={`M ${cornerLineLeft} ${basketY} A ${threeR} ${threeR} 0 0 0 ${cornerLineRight} ${basketY}`}
          fill="none"
          stroke="hsla(210, 20%, 60%, 0.35)"
          strokeWidth="1.5"
        />
        {/* Corner 3pt lines */}
        <line x1={cornerLineLeft} y1={basketY} x2={cornerLineLeft} y2={basketY - 8} stroke="hsla(210, 20%, 60%, 0.35)" strokeWidth="1.5" />
        <line x1={cornerLineRight} y1={basketY} x2={cornerLineRight} y2={basketY - 8} stroke="hsla(210, 20%, 60%, 0.35)" strokeWidth="1.5" />

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
          r={ftR}
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
                        fontSize="12"
                        fontWeight="800"
                        style={{ textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}
                      >
                        {stat.percentage}%
                      </text>
                      <text
                        x={pos.x}
                        y={pos.y + 9}
                        textAnchor="middle"
                        fill="hsla(0, 0%, 100%, 0.7)"
                        fontSize="9"
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
