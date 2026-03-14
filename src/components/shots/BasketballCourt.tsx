import { useState } from 'react';
import { ZoneId, ZONES, ZoneStats, getHeatColor, ZONE_COLORS } from '@/lib/shotZones';

interface Props {
  zoneStats: ZoneStats[];
  onZoneClick: (zoneId: ZoneId) => void;
  showHeatMap?: boolean;
  interactive?: boolean;
}

// Pre-compute all court geometry
const W = 500;
const cx = 250;
const baseY = 40;
const basketY = baseY + 15;

// Paint: 16ft wide × 15ft deep (compact to stay inside 3pt arc)
const paintW = 140;
const paintH = 155;
const paintL = cx - paintW / 2;
const paintR = cx + paintW / 2;
const paintB = baseY + paintH;
const paintMid = baseY + paintH / 2;

// Free throw circle (at paint bottom, well inside 3pt arc)
const ftR = 55;

// 3pt: arc radius 245px from basket — clearly outside FT circle
// FT circle bottom from basket = paintH + ftR = 210, 3pt = 245, gap = 35px
const threeR = 245;
const corner3X = 140;
const corner3L = cx - corner3X;
const corner3R_x = cx + corner3X;

// Where corner lines meet the arc
const arcCornerDy = Math.sqrt(threeR * threeR - corner3X * corner3X);
const arcCornerY = basketY + arcCornerDy;

// Court height
const courtH = basketY + threeR + 50;

// Angular divisions: 3 equal sectors between corners, perfectly symmetric around π/2
const cornerAngle = Math.acos(corner3X / threeR);
const arcSpan = Math.PI - 2 * cornerAngle;
const sector = arcSpan / 3;
const angA = cornerAngle;            // right corner
const angB = cornerAngle + sector;   // right-center boundary
const angC = cornerAngle + 2 * sector; // left-center boundary (mirror of angB around π/2)
const angD = Math.PI - cornerAngle;  // left corner (mirror of angA)

// 3pt band thickness
const band = 38;
const outerR = threeR + band;

// Helper: point on circle from basket center
function pt(angle: number, r: number = threeR) {
  return { x: cx + r * Math.cos(angle), y: basketY + r * Math.sin(angle) };
}

// Helper: where a radial line from basket at given angle exits the paint rectangle
function paintExit(angle: number) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const candidates: { x: number; y: number; t: number }[] = [];
  
  // Right wall (x = paintR)
  if (c > 0.001) {
    const t = (paintR - cx) / c;
    const y = basketY + t * s;
    if (y >= baseY - 1 && y <= paintB + 1) candidates.push({ x: paintR, y, t });
  }
  // Left wall (x = paintL)
  if (c < -0.001) {
    const t = (paintL - cx) / c;
    const y = basketY + t * s;
    if (y >= baseY - 1 && y <= paintB + 1) candidates.push({ x: paintL, y, t });
  }
  // Bottom wall (y = paintB)
  if (s > 0.001) {
    const t = (paintB - basketY) / s;
    const x = cx + t * c;
    if (x >= paintL - 1 && x <= paintR + 1) candidates.push({ x, y: paintB, t });
  }
  // Return closest exit
  candidates.sort((a, b) => a.t - b.t);
  return candidates[0] || { x: cx, y: paintB };
}

// Pre-compute key intersection points
const exitB = paintExit(angB);
const exitC = paintExit(angC);

// Arc points
const pA = pt(angA);
const pB = pt(angB);
const pC = pt(angC);
const pD = pt(angD);

// Outer arc points
const oA = pt(angA, outerR);
const oB = pt(angB, outerR);
const oC = pt(angC, outerR);
const oD = pt(angD, outerR);

// === BUILD ALL 12 ZONE PATHS ===
const ZONE_PATHS: Record<ZoneId, string> = {
  // ===== 3PT ZONES =====
  // Corner R 3: right side rectangle + arc piece
  corner_r_3: `M ${corner3R_x} ${baseY} L ${W} ${baseY} L ${W} ${arcCornerY} L ${pA.x} ${pA.y} A ${threeR} ${threeR} 0 0 0 ${corner3R_x} ${baseY} Z`,
  
  // Wing R 3: arc band from angA to angB
  wing_r_3: `M ${pA.x} ${pA.y} L ${oA.x} ${oA.y} A ${outerR} ${outerR} 0 0 1 ${oB.x} ${oB.y} L ${pB.x} ${pB.y} A ${threeR} ${threeR} 0 0 0 ${pA.x} ${pA.y} Z`,
  
  // Top 3: arc band from angB to angC
  top_3: `M ${pB.x} ${pB.y} L ${oB.x} ${oB.y} A ${outerR} ${outerR} 0 0 1 ${oC.x} ${oC.y} L ${pC.x} ${pC.y} A ${threeR} ${threeR} 0 0 0 ${pB.x} ${pB.y} Z`,
  
  // Wing L 3: arc band from angC to angD
  wing_l_3: `M ${pC.x} ${pC.y} L ${oC.x} ${oC.y} A ${outerR} ${outerR} 0 0 1 ${oD.x} ${oD.y} L ${pD.x} ${pD.y} A ${threeR} ${threeR} 0 0 0 ${pC.x} ${pC.y} Z`,
  
  // Corner L 3: left side rectangle + arc piece
  corner_l_3: `M ${corner3L} ${baseY} L 0 ${baseY} L 0 ${arcCornerY} L ${pD.x} ${pD.y} A ${threeR} ${threeR} 0 0 1 ${corner3L} ${baseY} Z`,

  // ===== MID-RANGE ZONES (between paint and 3pt arc) =====
  // Corner R mid: rectangle between paint-right and corner-3-line
  corner_r_mid: `M ${paintR} ${baseY} L ${corner3R_x} ${baseY} L ${corner3R_x} ${arcCornerY} L ${pA.x} ${pA.y} L ${exitB.x} ${exitB.y} L ${paintR} ${exitB.y > paintB ? paintB : exitB.y} Z`,
  
  // Wing R mid: from paint exit at angB to arc angA-angB, bounded by paint
  wing_r_mid: (() => {
    // This sector spans from angA to angB between paint and arc
    // Paint boundary: from exitB along paint edge to the corner where paint meets the angA direction
    // exitB is where angB radial exits paint (on right wall or bottom)
    // For angA direction: the exit is at paint right wall
    const exitA = paintExit(angA);
    if (exitB.y <= paintB) {
      // Both exits on right wall
      return `M ${exitA.x} ${exitA.y} L ${pA.x} ${pA.y} A ${threeR} ${threeR} 0 0 1 ${pB.x} ${pB.y} L ${exitB.x} ${exitB.y} Z`;
    } else {
      // exitA on right wall, exitB on bottom
      return `M ${exitA.x} ${exitA.y} L ${pA.x} ${pA.y} A ${threeR} ${threeR} 0 0 1 ${pB.x} ${pB.y} L ${exitB.x} ${exitB.y} L ${paintR} ${paintB} L ${paintR} ${exitA.y} Z`;
    }
  })(),
  
  // Top mid: from paint bottom (exitB to exitC) to arc (angB to angC)
  top_mid: `M ${exitB.x} ${exitB.y} L ${pB.x} ${pB.y} A ${threeR} ${threeR} 0 0 1 ${pC.x} ${pC.y} L ${exitC.x} ${exitC.y} Z`,
  
  // Wing L mid: mirror of wing R (angC to angD)
  wing_l_mid: (() => {
    const exitD = paintExit(angD);
    if (exitC.y <= paintB) {
      return `M ${exitC.x} ${exitC.y} L ${pC.x} ${pC.y} A ${threeR} ${threeR} 0 0 1 ${pD.x} ${pD.y} L ${exitD.x} ${exitD.y} Z`;
    } else {
      return `M ${exitC.x} ${exitC.y} L ${pC.x} ${pC.y} A ${threeR} ${threeR} 0 0 1 ${pD.x} ${pD.y} L ${exitD.x} ${exitD.y} L ${paintL} ${exitD.y} L ${paintL} ${paintB} Z`;
    }
  })(),
  
  // Corner L mid: mirror rectangle
  corner_l_mid: `M ${paintL} ${baseY} L ${corner3L} ${baseY} L ${corner3L} ${arcCornerY} L ${pD.x} ${pD.y} L ${exitC.x} ${exitC.y} L ${paintL} ${exitC.y > paintB ? paintB : exitC.y} Z`,

  // ===== PAINT ZONES =====
  under_basket: `M ${paintL} ${baseY} L ${paintR} ${baseY} L ${paintR} ${paintMid} L ${paintL} ${paintMid} Z`,
  free_throw: `M ${paintL} ${paintMid} L ${paintR} ${paintMid} L ${paintR} ${paintB} L ${paintL} ${paintB} Z`,
};

// Label positions (center of each zone)
const LABEL_POS: Record<ZoneId, { x: number; y: number }> = {
  corner_r_3: { x: (corner3R_x + W) / 2, y: baseY + arcCornerDy * 0.4 },
  wing_r_3: { x: pt((angA + angB) / 2, threeR + band / 2).x, y: pt((angA + angB) / 2, threeR + band / 2).y },
  top_3: { x: cx, y: pt(Math.PI / 2, threeR + band / 2).y },
  wing_l_3: { x: pt((angC + angD) / 2, threeR + band / 2).x, y: pt((angC + angD) / 2, threeR + band / 2).y },
  corner_l_3: { x: corner3L / 2, y: baseY + arcCornerDy * 0.4 },
  corner_r_mid: { x: (paintR + corner3R_x) / 2, y: baseY + arcCornerDy * 0.4 },
  wing_r_mid: { x: pt((angA + angB) / 2, threeR * 0.55).x, y: pt((angA + angB) / 2, threeR * 0.55).y },
  top_mid: { x: cx, y: (paintB + pt(Math.PI / 2).y) / 2 },
  wing_l_mid: { x: pt((angC + angD) / 2, threeR * 0.55).x, y: pt((angC + angD) / 2, threeR * 0.55).y },
  corner_l_mid: { x: (paintL + corner3L) / 2, y: baseY + arcCornerDy * 0.4 },
  free_throw: { x: cx, y: (paintMid + paintB) / 2 },
  under_basket: { x: cx, y: (baseY + paintMid) / 2 },
};

const BasketballCourt = ({ zoneStats, onZoneClick, showHeatMap = false, interactive = true }: Props) => {
  const [hoveredZone, setHoveredZone] = useState<ZoneId | null>(null);

  const getZoneStat = (zoneId: ZoneId): ZoneStats =>
    zoneStats.find(z => z.zone === zoneId) || { zone: zoneId, attempts: 0, made: 0, percentage: 0 };

  const getZoneFill = (zoneId: ZoneId) => {
    const stat = getZoneStat(zoneId);
    if (showHeatMap && stat.attempts > 0) return getHeatColor(stat.percentage, stat.attempts);
    if (hoveredZone === zoneId) return ZONE_COLORS[zoneId].replace(/[\d.]+\)$/, '0.75)');
    return ZONE_COLORS[zoneId];
  };

  const getZoneStroke = (zoneId: ZoneId) =>
    hoveredZone === zoneId ? 'hsl(0, 0%, 100%)' : 'hsla(0, 0%, 100%, 0.3)';

  return (
    <div className="w-full max-w-lg mx-auto">
      <svg viewBox={`0 0 ${W} ${courtH}`} className="w-full h-auto" style={{ filter: 'drop-shadow(0 4px 20px hsla(220, 60%, 10%, 0.5))' }}>
        {/* Background */}
        <rect x="0" y="0" width={W} height={courtH} rx="12" fill="hsl(220, 35%, 10%)" stroke="hsl(220, 25%, 22%)" strokeWidth="2" />

        {/* Zone fills */}
        {ZONES.map(zone => (
          <path
            key={zone.id}
            d={ZONE_PATHS[zone.id]}
            fill={getZoneFill(zone.id)}
            stroke={getZoneStroke(zone.id)}
            strokeWidth="1.5"
            style={{ cursor: interactive ? 'pointer' : 'default', transition: 'fill 0.2s, stroke 0.2s' }}
            onClick={() => interactive && onZoneClick(zone.id)}
            onMouseEnter={() => interactive && setHoveredZone(zone.id)}
            onMouseLeave={() => setHoveredZone(null)}
          />
        ))}

        {/* Court lines */}
        <line x1="0" y1={baseY} x2={W} y2={baseY} stroke="hsla(0, 0%, 100%, 0.4)" strokeWidth="2" />
        
        {/* 3pt line: corner lines + arc */}
        <line x1={corner3L} y1={baseY} x2={corner3L} y2={arcCornerY} stroke="hsla(0, 0%, 100%, 0.4)" strokeWidth="2" />
        <line x1={corner3R_x} y1={baseY} x2={corner3R_x} y2={arcCornerY} stroke="hsla(0, 0%, 100%, 0.4)" strokeWidth="2" />
        <path
          d={`M ${corner3L} ${arcCornerY} A ${threeR} ${threeR} 0 0 0 ${corner3R_x} ${arcCornerY}`}
          fill="none" stroke="hsla(0, 0%, 100%, 0.4)" strokeWidth="2"
        />

        {/* Paint */}
        <rect x={paintL} y={baseY} width={paintW} height={paintH} fill="none" stroke="hsla(0, 0%, 100%, 0.35)" strokeWidth="1.5" />
        <line x1={paintL} y1={paintMid} x2={paintR} y2={paintMid} stroke="hsla(0, 0%, 100%, 0.15)" strokeWidth="1" strokeDasharray="4 4" />

        {/* FT circle */}
        <circle cx={cx} cy={paintB} r={ftR} fill="none" stroke="hsla(0, 0%, 100%, 0.2)" strokeWidth="1" strokeDasharray="6 4" />

        {/* Basket & backboard */}
        <circle cx={cx} cy={basketY} r="8" fill="none" stroke="hsl(25, 95%, 53%)" strokeWidth="2.5" />
        <line x1={cx - 20} y1={baseY} x2={cx + 20} y2={baseY} stroke="hsl(210, 20%, 75%)" strokeWidth="3" />

        {/* Labels */}
        {ZONES.map(zone => {
          const stat = getZoneStat(zone.id);
          const pos = LABEL_POS[zone.id];
          return (
            <g key={`lbl-${zone.id}`} style={{ pointerEvents: 'none' }}>
              {stat.attempts > 0 ? (
                <>
                  <text x={pos.x} y={pos.y - 5} textAnchor="middle" fill="hsl(0, 0%, 100%)" fontSize="13" fontWeight="800" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                    {stat.percentage}%
                  </text>
                  <text x={pos.x} y={pos.y + 10} textAnchor="middle" fill="hsla(0, 0%, 100%, 0.7)" fontSize="9" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
                    {stat.made}/{stat.attempts}
                  </text>
                </>
              ) : (
                <text x={pos.x} y={pos.y + 3} textAnchor="middle" fill="hsla(0, 0%, 100%, 0.5)" fontSize="10" fontWeight="600">
                  {zone.shortLabel}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-1.5 mt-3 px-2">
        {ZONES.map(zone => (
          <div key={zone.id} className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: ZONE_COLORS[zone.id].replace(/[\d.]+\)$/, '1)') }} />
            <span className="text-[9px] text-muted-foreground">{zone.shortLabel}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BasketballCourt;
