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
    if (hoveredZone === zoneId) return ZONE_COLORS[zoneId].replace(/[\d.]+\)$/, '0.75)');
    return ZONE_COLORS[zoneId];
  };

  const getZoneStroke = (zoneId: ZoneId) => {
    if (hoveredZone === zoneId) return 'hsl(0, 0%, 100%)';
    return 'hsla(0, 0%, 100%, 0.3)';
  };

  // === REAL BASKETBALL HALF-COURT PROPORTIONS ===
  // NBA half court: 50ft wide × 47ft deep
  // We scale to SVG: 500 × 470
  const W = 500;
  const H = 470;
  const cx = 250; // center x
  
  // Basket at top (baseline at top)
  const baseY = 40;       // baseline Y
  const basketY = baseY + 15; // basket ~15px below baseline (5.25ft = ~16px scaled)
  
  // Paint: 16ft wide × 19ft deep → 160px × 190px
  const paintW = 160;
  const paintH = 190;
  const paintL = cx - paintW / 2; // 170
  const paintR = cx + paintW / 2; // 330
  const paintB = baseY + paintH;  // bottom of paint = 230
  
  // Free throw circle: 6ft radius → 60px
  const ftR = 60;
  
  // 3pt arc: 23.75ft → 237px from basket center, corner 3s at 22ft → 220px from basket
  // Corner 3 lines are 14ft from center → 140px each side
  const threeR = 238;
  const corner3X = 140; // distance from center to corner 3 line
  const corner3L = cx - corner3X; // 110
  const corner3R = cx + corner3X; // 390
  
  // The arc starts at the corner line level. We need to find the Y where the arc
  // meets the corner line. The arc center is at (cx, basketY).
  // At x = corner3R: y = basketY + sqrt(threeR² - corner3X²)
  const arcCornerDy = Math.sqrt(threeR * threeR - corner3X * corner3X);
  const arcCornerY = basketY + arcCornerDy; // where corner line meets arc
  // Corner 3 lines go from baseline down to arcCornerY
  
  // Arc bottom (lowest point): basketY + threeR
  const arcBottom = basketY + threeR;
  
  // Court boundary: a bit past the arc
  const courtBottom = Math.min(H, arcBottom + 40);

  // === DIVIDING ANGLES for the arc ===
  // The 3pt arc spans from corner-right to corner-left
  // Angle at corner: acos(corner3X / threeR) from the horizontal
  // But our arc is downward (positive Y), so angle from right horizontal:
  const cornerAngle = Math.acos(corner3X / threeR); // ~53.8° or ~0.94 rad
  // Full arc spans from cornerAngle to (π - cornerAngle) 
  // We divide into 3 arc sectors (wing-right, top, wing-left)
  const arcSpan = Math.PI - 2 * cornerAngle;
  const sectorAngle = arcSpan / 3;
  
  // Arc sector boundaries (angles from horizontal, going counterclockwise)
  const angA = cornerAngle;                  // right corner meets arc
  const angB = cornerAngle + sectorAngle;    // right wing / top boundary
  const angC = cornerAngle + 2 * sectorAngle; // top / left wing boundary
  const angD = Math.PI - cornerAngle;        // left corner meets arc

  // Helper: point on arc (center = basket position)
  const ap = (angle: number, r: number = threeR) => ({
    x: cx + r * Math.cos(angle),
    y: basketY + r * Math.sin(angle),
  });

  // === MID-RANGE dividing lines ===
  // We divide the area between paint and 3pt arc using radial lines from basket
  // Same angles as the arc sectors
  // Mid-range right corner: from paint-top-right corner to arc corner point
  // Mid-range right wing: radial line at angB from paint edge to arc
  // etc.

  // Points where radial lines at angB intersect paint rectangle
  // Paint rectangle: x ∈ [paintL, paintR], y ∈ [baseY, paintB]
  // Line from (cx, basketY) at angle angB:
  //   x = cx + t*cos(angB), y = basketY + t*sin(angB)
  // Intersection with paint right wall (x = paintR):
  //   t = (paintR - cx) / cos(angB) → only valid if angle points right
  // Intersection with paint bottom (y = paintB):
  //   t = (paintB - basketY) / sin(angB)

  const radialPaintIntersect = (angle: number): { x: number; y: number } => {
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    
    // Try right wall
    if (cosA > 0.01) {
      const t = (paintR - cx) / cosA;
      const y = basketY + t * sinA;
      if (y >= baseY && y <= paintB) return { x: paintR, y };
    }
    // Try left wall
    if (cosA < -0.01) {
      const t = (paintL - cx) / cosA;
      const y = basketY + t * sinA;
      if (y >= baseY && y <= paintB) return { x: paintL, y };
    }
    // Try bottom wall
    if (sinA > 0.01) {
      const t = (paintB - basketY) / sinA;
      const x = cx + t * cosA;
      if (x >= paintL && x <= paintR) return { x, y: paintB };
    }
    return { x: cx, y: paintB };
  };

  // Key intersection points
  const pAngB = radialPaintIntersect(angB); // where angB line hits paint
  const pAngC = radialPaintIntersect(angC); // where angC line hits paint

  // === ZONE PATHS ===
  // All zones tessellate perfectly with no gaps

  // 3PT ZONES (thin band outside the arc + corner rectangles)
  const threeBand = 35;
  const outerR = threeR + threeBand;

  const zonePaths: Record<ZoneId, string> = {
    // CORNER RIGHT 3: Rectangle from corner3R to court edge, baseline to arcCornerY, plus small arc slice
    corner_r_3: [
      `M ${corner3R} ${baseY}`,
      `L ${W} ${baseY}`,
      `L ${W} ${arcCornerY}`,
      `L ${ap(angA).x} ${ap(angA).y}`,
      `A ${threeR} ${threeR} 0 0 0 ${corner3R} ${baseY}`,
      'Z',
    ].join(' '),

    // WING RIGHT 3: Arc band from angA to angB
    wing_r_3: [
      `M ${ap(angA).x} ${ap(angA).y}`,
      `L ${W} ${arcCornerY}`,
      `L ${W} ${ap(angB, outerR).y + 10}`,
      `L ${ap(angB, outerR).x} ${ap(angB, outerR).y}`,
      `A ${outerR} ${outerR} 0 0 0 ${ap(angA, outerR).x} ${ap(angA, outerR).y}`,
      `L ${ap(angA).x} ${ap(angA).y}`,
      'Z',
    ].join(' '),

    // TOP 3: Arc band from angB to angC
    top_3: [
      `M ${ap(angB).x} ${ap(angB).y}`,
      `L ${ap(angB, outerR).x} ${ap(angB, outerR).y}`,
      `A ${outerR} ${outerR} 0 0 1 ${ap(angC, outerR).x} ${ap(angC, outerR).y}`,
      `L ${ap(angC).x} ${ap(angC).y}`,
      `A ${threeR} ${threeR} 0 0 0 ${ap(angB).x} ${ap(angB).y}`,
      'Z',
    ].join(' '),

    // WING LEFT 3: Arc band from angC to angD
    wing_l_3: [
      `M ${ap(angD).x} ${ap(angD).y}`,
      `L 0 ${arcCornerY}`,
      `L 0 ${ap(angC, outerR).y + 10}`,
      `L ${ap(angC, outerR).x} ${ap(angC, outerR).y}`,
      `A ${outerR} ${outerR} 0 0 1 ${ap(angD, outerR).x} ${ap(angD, outerR).y}`,
      `L ${ap(angD).x} ${ap(angD).y}`,
      'Z',
    ].join(' '),

    // CORNER LEFT 3: Mirror of corner right
    corner_l_3: [
      `M ${corner3L} ${baseY}`,
      `L 0 ${baseY}`,
      `L 0 ${arcCornerY}`,
      `L ${ap(angD).x} ${ap(angD).y}`,
      `A ${threeR} ${threeR} 0 0 1 ${corner3L} ${baseY}`,
      'Z',
    ].join(' '),

    // === MID-RANGE ZONES (between paint and 3pt arc, no gaps) ===
    
    // CORNER RIGHT MID: paint right wall → corner3R line → arc from angA to angA, then back
    corner_r_mid: [
      `M ${paintR} ${baseY}`,
      `L ${corner3R} ${baseY}`,
      `A ${threeR} ${threeR} 0 0 1 ${ap(angB).x} ${ap(angB).y}`,
      `L ${pAngB.x} ${pAngB.y}`,
      `L ${paintR} ${baseY}`,
      'Z',
    ].join(' '),

    // WING RIGHT MID: from paint at angB to arc angB, arc to angA... wait
    // Actually: the sector between angA-angB of the arc, minus the paint
    // Let me reconsider. We want 5 mid-range zones that fill the space between paint and arc.
    
    // Simpler approach: 
    // corner_r_mid: right of paint, above angB line → arc from baseline to angB
    // wing_r_mid: between angB and halfway (angMid) → arc angA to angB area
    // Actually let me use the same angular divisions

    // corner_r_mid already done above. Let me redo it properly:
    // It's the area bounded by: paint right wall, baseline, 3pt arc (from 0 to angA), and the angB radial line
    
    // WING RIGHT MID: bounded by angB radial, arc angB, paint bottom-right area
    wing_r_mid: [
      `M ${pAngB.x} ${pAngB.y}`,
      `L ${ap(angB).x} ${ap(angB).y}`,
      `A ${threeR} ${threeR} 0 0 1 ${ap(angA).x} ${ap(angA).y}`,
      // This doesn't work well. Let me think differently.
      // Actually corner_r_mid should be baseline-to-angB between paint and arc
      // and wing_r_mid doesn't exist as separate from it...
      // 
      // Better: split the mid-range into 5 sectors matching the 5 arc sectors
      `L ${paintR} ${pAngB.y > paintB ? paintB : pAngB.y}`,
      'Z',
    ].join(' '),

    // TOP MID: bounded by angB, angC radials, arc angB-angC, paint bottom
    top_mid: [
      `M ${pAngB.x} ${pAngB.y}`,
      `L ${ap(angB).x} ${ap(angB).y}`,
      `A ${threeR} ${threeR} 0 0 1 ${ap(angC).x} ${ap(angC).y}`,
      `L ${pAngC.x} ${pAngC.y}`,
      // Close along paint bottom
      `L ${pAngB.x} ${pAngB.y}`,
      'Z',
    ].join(' '),

    // WING LEFT MID: mirror of wing right
    wing_l_mid: [
      `M ${pAngC.x} ${pAngC.y}`,
      `L ${ap(angC).x} ${ap(angC).y}`,
      `A ${threeR} ${threeR} 0 0 1 ${ap(angD).x} ${ap(angD).y}`,
      `L ${paintL} ${pAngC.y > paintB ? paintB : pAngC.y}`,
      'Z',
    ].join(' '),

    // CORNER LEFT MID: mirror of corner right mid
    corner_l_mid: [
      `M ${paintL} ${baseY}`,
      `L ${corner3L} ${baseY}`,
      `A ${threeR} ${threeR} 0 0 0 ${ap(angC).x} ${ap(angC).y}`,
      `L ${pAngC.x} ${pAngC.y}`,
      `L ${paintL} ${baseY}`,
      'Z',
    ].join(' '),

    // === PAINT ZONES ===
    // FREE THROW: lower half of paint (with FT circle arc)
    free_throw: [
      `M ${paintL} ${baseY + paintH / 2}`,
      `L ${paintR} ${baseY + paintH / 2}`,
      `L ${paintR} ${paintB}`,
      `A ${ftR} ${ftR} 0 0 1 ${paintL} ${paintB}`,
      'Z',
    ].join(' '),

    // UNDER BASKET: upper half of paint (close to basket)
    under_basket: [
      `M ${paintL} ${baseY}`,
      `L ${paintR} ${baseY}`,
      `L ${paintR} ${baseY + paintH / 2}`,
      `L ${paintL} ${baseY + paintH / 2}`,
      'Z',
    ].join(' '),
  };

  // Fix: The corner_r_mid and corner_l_mid paths above have issues with the angB intersection.
  // Let me recalculate properly. The angB radial from basket goes at angle angB.
  // It exits paint at pAngB. From there to the arc at ap(angB).
  // corner_r_mid is the area: paint-right-wall (top), baseline (right side), 
  // arc from baseline-level to angB, then angB radial back to paint.
  
  // Actually, I realize the paths above are getting convoluted. Let me just rebuild them cleanly.

  // Recalculate clean zone paths
  const cleanPaths: Record<ZoneId, string> = {
    // ========== 3PT ZONES ==========
    // Corner R 3: Baseline right of corner3R, down to arc
    corner_r_3: `M ${corner3R} ${baseY} L ${W} ${baseY} L ${W} ${arcCornerY} L ${ap(angA).x} ${ap(angA).y} A ${threeR} ${threeR} 0 0 0 ${corner3R} ${baseY} Z`,
    
    // Wing R 3: Arc band angA to angB
    wing_r_3: `M ${ap(angA).x} ${ap(angA).y} L ${ap(angA, outerR).x} ${ap(angA, outerR).y} A ${outerR} ${outerR} 0 0 1 ${ap(angB, outerR).x} ${ap(angB, outerR).y} L ${ap(angB).x} ${ap(angB).y} A ${threeR} ${threeR} 0 0 0 ${ap(angA).x} ${ap(angA).y} Z`,
    
    // Top 3: Arc band angB to angC
    top_3: `M ${ap(angB).x} ${ap(angB).y} L ${ap(angB, outerR).x} ${ap(angB, outerR).y} A ${outerR} ${outerR} 0 0 1 ${ap(angC, outerR).x} ${ap(angC, outerR).y} L ${ap(angC).x} ${ap(angC).y} A ${threeR} ${threeR} 0 0 0 ${ap(angB).x} ${ap(angB).y} Z`,
    
    // Wing L 3: Arc band angC to angD  
    wing_l_3: `M ${ap(angC).x} ${ap(angC).y} L ${ap(angC, outerR).x} ${ap(angC, outerR).y} A ${outerR} ${outerR} 0 0 1 ${ap(angD, outerR).x} ${ap(angD, outerR).y} L ${ap(angD).x} ${ap(angD).y} A ${threeR} ${threeR} 0 0 0 ${ap(angC).x} ${ap(angC).y} Z`,
    
    // Corner L 3: Baseline left of corner3L, down to arc
    corner_l_3: `M ${corner3L} ${baseY} L 0 ${baseY} L 0 ${arcCornerY} L ${ap(angD).x} ${ap(angD).y} A ${threeR} ${threeR} 0 0 1 ${corner3L} ${baseY} Z`,

    // ========== MID-RANGE ZONES (fill ALL space between paint and arc) ==========
    // Corner R mid: Paint right wall → baseline → corner3R → arc to angB → radial back to paint
    corner_r_mid: `M ${paintR} ${baseY} L ${corner3R} ${baseY} A ${threeR} ${threeR} 0 0 1 ${ap(angB).x} ${ap(angB).y} L ${pAngB.x} ${pAngB.y} L ${paintR} ${pAngB.y} L ${paintR} ${baseY} Z`,
    
    // Wing R mid: Between angB radial line (paint to arc) and paint bottom-right to arc at angB
    wing_r_mid: `M ${paintR} ${pAngB.y} L ${pAngB.x} ${pAngB.y} L ${ap(angB).x} ${ap(angB).y} A ${threeR} ${threeR} 0 0 1 ${ap(angA).x} ${ap(angA).y} L ${W} ${arcCornerY} L ${W} ${baseY} L ${corner3R} ${baseY}`,
    
    // Hmm this is getting complex. Let me think about it differently.
    // The mid-range is the donut between paint-rectangle and 3pt-arc.
    // I'll divide it with radial lines at the same angles.
    
    // Sector 1 (corner R mid): from 0° (baseline right) to angA (corner meets arc)
    //   Bounded by: paint right side, baseline right of paint, corner 3 line, arc from corner to angA
    //   But the arc from baseline to angA IS the corner 3 boundary...
    //   Actually: corner_r_mid = paint right wall to corner3R along baseline, then arc angA, then radial angA back... 
    //   But angA IS the corner angle. So arc from corner3R to angB is the boundary.
    
    // Let me simplify: divide mid-range into 5 zones using the SAME angles as the 3pt:
    // MR1: 0 to angA (between paint-right and baseline-right to arc start) - this is corner_r_mid  
    // MR2: angA to angB - this is wing_r_mid
    // MR3: angB to angC - this is top_mid
    // MR4: angC to angD - this is wing_l_mid
    // MR5: angD to π (between paint-left and baseline-left to arc start) - this is corner_l_mid

    // But 0 to angA is just the corner strip next to paint, and angD to π is the mirror.
    // The arc doesn't exist in the 0-to-angA range (that's the straight corner line).
    
    // OK final clean approach:
    // corner_r_mid: paint-right → corner3R line → arc(angA to angB) → radial(angB) → paint
    // wing_r_mid: radial(angA) from paint to arc → arc(angA to angB) → radial(angB) to paint
    // Hmm, that overlaps with corner_r_mid.
    
    // SIMPLEST: just 5 sectors radiating from basket, between paint and arc
    // Sector boundaries: 0°, angA, angB, angC, angD, 180°
    // But 0° and 180° are horizontal (along baseline)
    
    // Corner R mid: 0° to angA
    // Wing R mid: angA to angB  
    // Top mid: angB to angC
    // Wing L mid: angC to angD
    // Corner L mid: angD to 180°
    
    // For sector from θ1 to θ2:
    // Inner boundary: paint edges (rectangle)
    // Outer boundary: 3pt arc (or corner line for corners)
    
    // This is correct. Let me compute it.
    
    // The paint intersection at angle 0° is simply (paintR, basketY) = right wall at basket height
    // At angle angA: radialPaintIntersect(angA) = hits paint right wall
    // At angle angB: radialPaintIntersect(angB) = hits paint right wall or bottom
    // At angle angC: radialPaintIntersect(angC) = hits paint left wall or bottom  
    // At angle angD: hits paint left wall
    // At angle π: (paintL, basketY)
    
    // So for each sector:
    corner_r_mid: (() => {
      // Sector 0 to angA: outer boundary is the corner3R vertical line + arc start
      // Actually the outer boundary in this sector is NOT the arc - it's the straight corner line
      // from (corner3R, baseY) down to (corner3R, arcCornerY) which is where the arc starts.
      // But the corner3R line IS at x = corner3R, and the paint right wall is at x = paintR.
      // So this zone is a rectangle: paintR to corner3R, baseY to arcCornerY
      // Plus the tiny arc piece... but the arc starts exactly at (corner3R, arcCornerY).
      // So it's just a rectangle!
      return `M ${paintR} ${baseY} L ${corner3R} ${baseY} L ${corner3R} ${arcCornerY} L ${paintR} ${arcCornerY} Z`;
    })(),
    
    // Wing R mid: angA to angB, between paint and arc
    wing_r_mid: (() => {
      const pA = radialPaintIntersect(angA);
      const aA = ap(angA);
      const aB = ap(angB);
      const pB = radialPaintIntersect(angB);
      // From pA along paint wall to pB, then radial to arc at angB, arc back to angA, radial back to pA
      // But the paint boundary between pA and pB might go along the right wall then the bottom
      // pA is on right wall, pB might be on right wall or bottom
      if (pB.x === paintR) {
        // Both on right wall
        return `M ${pA.x} ${pA.y} L ${aA.x} ${aA.y} A ${threeR} ${threeR} 0 0 1 ${aB.x} ${aB.y} L ${pB.x} ${pB.y} Z`;
      } else {
        // pA on right wall, pB on bottom - go along right wall then bottom
        return `M ${pA.x} ${pA.y} L ${aA.x} ${aA.y} A ${threeR} ${threeR} 0 0 1 ${aB.x} ${aB.y} L ${pB.x} ${pB.y} L ${paintR} ${paintB} L ${paintR} ${pA.y} Z`;
      }
    })(),
    
    // Top mid: angB to angC, between paint bottom and arc
    top_mid: (() => {
      const aB = ap(angB);
      const aC = ap(angC);
      const pB = radialPaintIntersect(angB);
      const pC = radialPaintIntersect(angC);
      // Both pB and pC should be on paint bottom
      return `M ${pB.x} ${pB.y} L ${aB.x} ${aB.y} A ${threeR} ${threeR} 0 0 1 ${aC.x} ${aC.y} L ${pC.x} ${pC.y} Z`;
    })(),
    
    // Wing L mid: angC to angD, between paint and arc (mirror of wing R)
    wing_l_mid: (() => {
      const pC = radialPaintIntersect(angC);
      const aC = ap(angC);
      const aD = ap(angD);
      const pD = radialPaintIntersect(angD);
      if (pC.x === paintL) {
        return `M ${pC.x} ${pC.y} L ${aC.x} ${aC.y} A ${threeR} ${threeR} 0 0 1 ${aD.x} ${aD.y} L ${pD.x} ${pD.y} Z`;
      } else {
        return `M ${pC.x} ${pC.y} L ${aC.x} ${aC.y} A ${threeR} ${threeR} 0 0 1 ${aD.x} ${aD.y} L ${pD.x} ${pD.y} L ${paintL} ${pD.y} L ${paintL} ${paintB} Z`;
      }
    })(),
    
    // Corner L mid: angD to π, mirror of corner R
    corner_l_mid: (() => {
      return `M ${paintL} ${baseY} L ${corner3L} ${baseY} L ${corner3L} ${arcCornerY} L ${paintL} ${arcCornerY} Z`;
    })(),

    // ========== PAINT ZONES ==========
    free_throw: `M ${paintL} ${baseY + paintH / 2} L ${paintR} ${baseY + paintH / 2} L ${paintR} ${paintB} L ${paintL} ${paintB} Z`,
    
    under_basket: `M ${paintL} ${baseY} L ${paintR} ${baseY} L ${paintR} ${baseY + paintH / 2} L ${paintL} ${baseY + paintH / 2} Z`,
  };

  // Zone label positions (centers of each zone)
  const labelPos: Record<ZoneId, { x: number; y: number }> = {
    corner_r_3: { x: (corner3R + W) / 2, y: baseY + arcCornerDy / 2 },
    wing_r_3: { x: ap((angA + angB) / 2, threeR + threeBand / 2).x, y: ap((angA + angB) / 2, threeR + threeBand / 2).y },
    top_3: { x: cx, y: ap(Math.PI / 2, threeR + threeBand / 2).y },
    wing_l_3: { x: ap((angC + angD) / 2, threeR + threeBand / 2).x, y: ap((angC + angD) / 2, threeR + threeBand / 2).y },
    corner_l_3: { x: corner3L / 2, y: baseY + arcCornerDy / 2 },
    corner_r_mid: { x: (paintR + corner3R) / 2, y: baseY + arcCornerDy / 2 },
    wing_r_mid: { x: ap((angA + angB) / 2, (threeR + paintW / 2) / 2 + 30).x, y: ap((angA + angB) / 2, (threeR + paintW / 2) / 2 + 30).y },
    top_mid: { x: cx, y: (paintB + ap(Math.PI / 2).y) / 2 },
    wing_l_mid: { x: ap((angC + angD) / 2, (threeR + paintW / 2) / 2 + 30).x, y: ap((angC + angD) / 2, (threeR + paintW / 2) / 2 + 30).y },
    corner_l_mid: { x: (paintL + corner3L) / 2, y: baseY + arcCornerDy / 2 },
    free_throw: { x: cx, y: baseY + paintH * 0.75 },
    under_basket: { x: cx, y: baseY + paintH * 0.25 },
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <svg
        viewBox={`0 0 ${W} ${courtBottom}`}
        className="w-full h-auto"
        style={{ filter: 'drop-shadow(0 4px 20px hsla(220, 60%, 10%, 0.5))' }}
      >
        {/* Court background */}
        <rect x="0" y="0" width={W} height={courtBottom} rx="12" fill="hsl(220, 35%, 10%)" stroke="hsl(220, 25%, 22%)" strokeWidth="2" />

        {/* Clickable zones - rendered FIRST so court lines appear on top */}
        {ZONES.map(zone => (
          <path
            key={`zone-${zone.id}`}
            d={cleanPaths[zone.id]}
            fill={getZoneFill(zone.id)}
            stroke={getZoneStroke(zone.id)}
            strokeWidth="1.5"
            style={{ cursor: interactive ? 'pointer' : 'default', transition: 'fill 0.2s, stroke 0.2s' }}
            onClick={() => interactive && onZoneClick(zone.id)}
            onMouseEnter={() => interactive && setHoveredZone(zone.id)}
            onMouseLeave={() => setHoveredZone(null)}
          />
        ))}

        {/* === COURT LINES (on top of zones) === */}
        {/* Baseline */}
        <line x1="0" y1={baseY} x2={W} y2={baseY} stroke="hsla(0, 0%, 100%, 0.4)" strokeWidth="2" />
        
        {/* Three-point arc */}
        <path
          d={`M ${corner3L} ${baseY} L ${corner3L} ${arcCornerY} A ${threeR} ${threeR} 0 0 0 ${corner3R} ${arcCornerY} L ${corner3R} ${baseY}`}
          fill="none"
          stroke="hsla(0, 0%, 100%, 0.4)"
          strokeWidth="2"
        />

        {/* Paint rectangle */}
        <rect x={paintL} y={baseY} width={paintW} height={paintH} fill="none" stroke="hsla(0, 0%, 100%, 0.35)" strokeWidth="1.5" />

        {/* Free throw circle */}
        <circle cx={cx} cy={paintB} r={ftR} fill="none" stroke="hsla(0, 0%, 100%, 0.2)" strokeWidth="1" strokeDasharray="6 4" />

        {/* Paint mid-line (divides under-basket from free-throw) */}
        <line x1={paintL} y1={baseY + paintH / 2} x2={paintR} y2={baseY + paintH / 2} stroke="hsla(0, 0%, 100%, 0.15)" strokeWidth="1" strokeDasharray="4 4" />

        {/* Basket */}
        <circle cx={cx} cy={basketY} r="8" fill="none" stroke="hsl(25, 95%, 53%)" strokeWidth="2.5" />
        <line x1={cx - 20} y1={baseY} x2={cx + 20} y2={baseY} stroke="hsl(210, 20%, 75%)" strokeWidth="3" />

        {/* Zone labels */}
        {ZONES.map(zone => {
          const stat = getZoneStat(zone.id);
          const pos = labelPos[zone.id];
          return (
            <g key={`label-${zone.id}`} style={{ pointerEvents: 'none' }}>
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
