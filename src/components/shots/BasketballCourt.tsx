import { useState } from 'react';
import { ZoneId, ZONES, ZoneStats, getHeatColor, ZONE_COLORS } from '@/lib/shotZones';

interface Props {
  zoneStats: ZoneStats[];
  onZoneClick: (zoneId: ZoneId) => void;
  showHeatMap?: boolean;
  interactive?: boolean;
}

// Court dimensions
const W = 560;
const H = 310;
const cx = W / 2;
const baseY = 30;
const basketY = baseY + 18;

// Paint
const paintW = 160;
const paintH = 170;
const paintL = cx - paintW / 2;
const paintR = cx + paintW / 2;
const paintB = baseY + paintH;

// Free throw circle
const ftR = paintW / 2;

// 3pt arc
const threeR = 218;
const corner3L = 125;
const corner3R_x = W - 125;

// Corner/arc intersection
const arcCornerDx = corner3R_x - cx;
const arcCornerDy = Math.sqrt(threeR * threeR - arcCornerDx * arcCornerDx);
const arcCornerY = basketY + arcCornerDy;

// Angular divisions
const cornerAngle = Math.acos(arcCornerDx / threeR);
const arcSpan = Math.PI - 2 * cornerAngle;
const sector = arcSpan / 3;
const angA = cornerAngle;
const angB = cornerAngle + sector;
const angC = cornerAngle + 2 * sector;
const angD = Math.PI - cornerAngle;

// Paint mid-line
const paintMidY = baseY + paintH * 0.45;

function pt(angle: number, r: number = threeR) {
  return { x: cx + r * Math.cos(angle), y: basketY + r * Math.sin(angle) };
}

function paintExit(angle: number) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const candidates: { x: number; y: number; t: number }[] = [];
  if (c > 0.001) { const t = (paintR - cx) / c; const y = basketY + t * s; if (y >= baseY - 1 && y <= paintB + 1) candidates.push({ x: paintR, y, t }); }
  if (c < -0.001) { const t = (paintL - cx) / c; const y = basketY + t * s; if (y >= baseY - 1 && y <= paintB + 1) candidates.push({ x: paintL, y, t }); }
  if (s > 0.001) { const t = (paintB - basketY) / s; const x = cx + t * c; if (x >= paintL - 1 && x <= paintR + 1) candidates.push({ x, y: paintB, t }); }
  candidates.sort((a, b) => a.t - b.t);
  return candidates[0] || { x: cx, y: paintB };
}

const exitB = paintExit(angB);
const exitC = paintExit(angC);

const pA = pt(angA);
const pB = pt(angB);
const pC = pt(angC);
const pD = pt(angD);

// Extend 3pt zone dividers to court edges
function extendToEdge(angle: number): { x: number; y: number } {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const candidates: { x: number; y: number; t: number }[] = [];
  // Right wall
  if (c > 0.001) { const t = (W - cx) / c; candidates.push({ x: W, y: basketY + t * s, t }); }
  // Left wall
  if (c < -0.001) { const t = (0 - cx) / c; candidates.push({ x: 0, y: basketY + t * s, t }); }
  // Bottom wall
  if (s > 0.001) { const t = (H - basketY) / s; candidates.push({ x: cx + t * c, y: H, t }); }
  candidates.sort((a, b) => a.t - b.t);
  return candidates[0] || { x: cx, y: H };
}

const eB = extendToEdge(angB);
const eC = extendToEdge(angC);

// Sweeping arc from angle1 to angle2 at radius r
function arcPath(a1: number, a2: number, r: number, sweep = 1) {
  const p1 = pt(a1, r);
  const p2 = pt(a2, r);
  const largeArc = Math.abs(a2 - a1) > Math.PI ? 1 : 0;
  return `A ${r} ${r} 0 ${largeArc} ${sweep} ${p2.x} ${p2.y}`;
}

// === ZONE PATHS ===
const ZONE_PATHS: Record<ZoneId, string> = {
  // 3PT ZONES - extend to court boundaries
  corner_r_3: `M ${corner3R_x} ${baseY} L ${W} ${baseY} L ${W} ${H} L ${eB.x > cx ? eB.x : W} ${H} L ${pA.x} ${pA.y} L ${corner3R_x} ${baseY} Z`,
  wing_r_3: `M ${pA.x} ${pA.y} L ${eB.x > cx ? eB.x : W} ${H} L ${eB.x} ${eB.y > H ? H : eB.y} L ${pB.x} ${pB.y} A ${threeR} ${threeR} 0 0 0 ${pA.x} ${pA.y} Z`,
  top_3: `M ${pB.x} ${pB.y} L ${eB.x} ${eB.y > H ? H : eB.y} L ${eC.x} ${eC.y > H ? H : eC.y} L ${pC.x} ${pC.y} A ${threeR} ${threeR} 0 0 0 ${pB.x} ${pB.y} Z`,
  wing_l_3: `M ${pC.x} ${pC.y} L ${eC.x} ${eC.y > H ? H : eC.y} L ${eC.x < cx ? 0 : eC.x} ${H} L ${pD.x} ${pD.y} A ${threeR} ${threeR} 0 0 0 ${pC.x} ${pC.y} Z`,
  corner_l_3: `M ${corner3L} ${baseY} L 0 ${baseY} L 0 ${H} L ${eC.x < cx ? 0 : eC.x} ${H} L ${pD.x} ${pD.y} L ${corner3L} ${baseY} Z`,

  // MID-RANGE ZONES
  corner_r_mid: `M ${paintR} ${baseY} L ${corner3R_x} ${baseY} L ${corner3R_x} ${arcCornerY} L ${pA.x} ${pA.y} L ${exitB.x} ${exitB.y} L ${paintR} ${exitB.y > paintB ? paintB : exitB.y} Z`,
  wing_r_mid: (() => {
    const exitA = paintExit(angA);
    if (exitB.y <= paintB) {
      return `M ${exitA.x} ${exitA.y} L ${pA.x} ${pA.y} A ${threeR} ${threeR} 0 0 1 ${pB.x} ${pB.y} L ${exitB.x} ${exitB.y} Z`;
    }
    return `M ${exitA.x} ${exitA.y} L ${pA.x} ${pA.y} A ${threeR} ${threeR} 0 0 1 ${pB.x} ${pB.y} L ${exitB.x} ${exitB.y} L ${paintR} ${paintB} L ${paintR} ${exitA.y} Z`;
  })(),
  top_mid: `M ${exitB.x} ${exitB.y} L ${pB.x} ${pB.y} A ${threeR} ${threeR} 0 0 1 ${pC.x} ${pC.y} L ${exitC.x} ${exitC.y} Z`,
  wing_l_mid: (() => {
    const exitD = paintExit(angD);
    if (exitC.y <= paintB) {
      return `M ${exitC.x} ${exitC.y} L ${pC.x} ${pC.y} A ${threeR} ${threeR} 0 0 1 ${pD.x} ${pD.y} L ${exitD.x} ${exitD.y} Z`;
    }
    return `M ${exitC.x} ${exitC.y} L ${pC.x} ${pC.y} A ${threeR} ${threeR} 0 0 1 ${pD.x} ${pD.y} L ${exitD.x} ${exitD.y} L ${paintL} ${exitD.y} L ${paintL} ${paintB} Z`;
  })(),
  corner_l_mid: `M ${paintL} ${baseY} L ${corner3L} ${baseY} L ${corner3L} ${arcCornerY} L ${pD.x} ${pD.y} L ${exitC.x} ${exitC.y} L ${paintL} ${exitC.y > paintB ? paintB : exitC.y} Z`,

  // PAINT ZONES
  under_basket: `M ${paintL} ${baseY} L ${paintR} ${baseY} L ${paintR} ${paintMidY} L ${paintL} ${paintMidY} Z`,
  free_throw: `M ${paintL} ${paintMidY} L ${paintR} ${paintMidY} L ${paintR} ${paintB} L ${paintL} ${paintB} Z`,
};

const ZONE_NUMBERS: Record<ZoneId, number> = {
  corner_r_3: 1, wing_r_3: 2, top_3: 3, wing_l_3: 4, corner_l_3: 5,
  corner_l_mid: 6, wing_l_mid: 7, top_mid: 8, wing_r_mid: 9, corner_r_mid: 10,
  free_throw: 11, under_basket: 12,
};

// Label positions (adjusted for full-court zones)
const LABEL_POS: Record<ZoneId, { x: number; y: number }> = {
  corner_r_3: { x: (corner3R_x + W) / 2, y: baseY + 80 },
  wing_r_3: { x: pt((angA + angB) / 2, threeR + 50).x, y: pt((angA + angB) / 2, threeR + 50).y },
  top_3: { x: cx, y: pt(Math.PI / 2, threeR + 50).y },
  wing_l_3: { x: pt((angC + angD) / 2, threeR + 50).x, y: pt((angC + angD) / 2, threeR + 50).y },
  corner_l_3: { x: corner3L / 2, y: baseY + 80 },
  corner_r_mid: { x: (paintR + corner3R_x) / 2, y: baseY + arcCornerDy * 0.35 },
  wing_r_mid: { x: pt((angA + angB) / 2, threeR * 0.55).x, y: pt((angA + angB) / 2, threeR * 0.55).y },
  top_mid: { x: cx, y: (paintB + pt(Math.PI / 2).y) / 2 },
  wing_l_mid: { x: pt((angC + angD) / 2, threeR * 0.55).x, y: pt((angC + angD) / 2, threeR * 0.55).y },
  corner_l_mid: { x: (paintL + corner3L) / 2, y: baseY + arcCornerDy * 0.35 },
  free_throw: { x: cx, y: (paintMidY + paintB) / 2 },
  under_basket: { x: cx, y: (baseY + paintMidY) / 2 },
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
    hoveredZone === zoneId ? 'hsl(0, 0%, 100%)' : 'hsla(0, 0%, 100%, 0.25)';

  return (
    <div className="w-full max-w-xl mx-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ filter: 'drop-shadow(0 4px 20px hsla(220, 60%, 10%, 0.5))' }}>
        {/* Court background */}
        <rect x="0" y="0" width={W} height={H} rx="8" fill="hsl(30, 20%, 92%)" />
        <rect x="4" y="4" width={W - 8} height={H - 8} rx="6" fill="hsl(30, 15%, 96%)" stroke="hsl(220, 20%, 30%)" strokeWidth="3" />

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
        <line x1="4" y1={baseY} x2={W - 4} y2={baseY} stroke="hsl(220, 20%, 20%)" strokeWidth="3" />

        {/* 3pt corner lines */}
        <line x1={corner3L} y1={baseY} x2={corner3L} y2={arcCornerY} stroke="hsl(220, 20%, 20%)" strokeWidth="2.5" />
        <line x1={corner3R_x} y1={baseY} x2={corner3R_x} y2={arcCornerY} stroke="hsl(220, 20%, 20%)" strokeWidth="2.5" />
        
        {/* 3pt arc */}
        <path
          d={`M ${corner3L} ${arcCornerY} A ${threeR} ${threeR} 0 0 0 ${corner3R_x} ${arcCornerY}`}
          fill="none" stroke="hsl(220, 20%, 20%)" strokeWidth="2.5"
        />

        {/* Paint */}
        <rect x={paintL} y={baseY} width={paintW} height={paintH} fill="none" stroke="hsl(220, 20%, 20%)" strokeWidth="2.5" />
        
        {/* Paint mid-line */}
        <line x1={paintL} y1={paintMidY} x2={paintR} y2={paintMidY} stroke="hsl(220, 20%, 20%)" strokeWidth="1.5" strokeDasharray="6 4" />

        {/* Free throw circle */}
        <circle cx={cx} cy={paintB} r={ftR} fill="none" stroke="hsl(220, 20%, 20%)" strokeWidth="1.5" strokeDasharray="6 4" />

        {/* Restricted area */}
        <path d={`M ${cx - 30} ${baseY} A 30 30 0 0 0 ${cx + 30} ${baseY}`} fill="none" stroke="hsl(220, 20%, 25%)" strokeWidth="1.5" />

        {/* Backboard */}
        <line x1={cx - 25} y1={baseY} x2={cx + 25} y2={baseY} stroke="hsl(220, 15%, 35%)" strokeWidth="4" />
        
        {/* Rim */}
        <circle cx={cx} cy={basketY} r="9" fill="none" stroke="hsl(25, 90%, 50%)" strokeWidth="3" />

        {/* Radial dividers - mid range */}
        {[angB, angC].map((ang, i) => {
          const exit = i === 0 ? exitB : exitC;
          const arcPt = pt(ang);
          return <line key={`div-${i}`} x1={exit.x} y1={exit.y} x2={arcPt.x} y2={arcPt.y} stroke="hsl(220, 20%, 20%)" strokeWidth="2" />;
        })}

        {/* Radial dividers - through 3pt to court edge */}
        {[angB, angC].map((ang, i) => {
          const inner = pt(ang);
          const edge = i === 0 ? eB : eC;
          return <line key={`ext-${i}`} x1={inner.x} y1={inner.y} x2={edge.x} y2={edge.y > H ? H : edge.y} stroke="hsl(220, 20%, 20%)" strokeWidth="2" />;
        })}

        {/* Labels */}
        {ZONES.map(zone => {
          const stat = getZoneStat(zone.id);
          const pos = LABEL_POS[zone.id];
          const num = ZONE_NUMBERS[zone.id];
          
          return (
            <g key={`lbl-${zone.id}`} style={{ pointerEvents: 'none' }}>
              <circle cx={pos.x} cy={pos.y - 14} r="10" fill="hsla(220, 30%, 15%, 0.85)" stroke="hsla(0, 0%, 100%, 0.3)" strokeWidth="1" />
              <text x={pos.x} y={pos.y - 10} textAnchor="middle" fill="hsl(0, 0%, 100%)" fontSize="10" fontWeight="800">
                {num}
              </text>

              {stat.attempts > 0 ? (
                <>
                  <text x={pos.x} y={pos.y + 6} textAnchor="middle" fill="hsl(220, 20%, 15%)" fontSize="14" fontWeight="900" style={{ textShadow: '0 0 4px hsla(0, 0%, 100%, 0.8)' }}>
                    {stat.percentage}%
                  </text>
                  <text x={pos.x} y={pos.y + 19} textAnchor="middle" fill="hsla(220, 20%, 30%, 0.8)" fontSize="9" fontWeight="600">
                    {stat.made}/{stat.attempts}
                  </text>
                </>
              ) : (
                <text x={pos.x} y={pos.y + 6} textAnchor="middle" fill="hsla(220, 20%, 40%, 0.6)" fontSize="9" fontWeight="600">
                  {zone.shortLabel}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-3 px-2">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsla(0, 70%, 60%, 0.6)' }} />
          <span className="text-[10px] text-muted-foreground font-medium">שלשות</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsla(45, 80%, 55%, 0.6)' }} />
          <span className="text-[10px] text-muted-foreground font-medium">מיד-ריינג׳</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsla(220, 70%, 60%, 0.6)' }} />
          <span className="text-[10px] text-muted-foreground font-medium">צבע</span>
        </div>
      </div>
    </div>
  );
};

export default BasketballCourt;
