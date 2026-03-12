// Zone definitions for the basketball half-court
export const ZONES = [
  { id: 'corner_r_3', label: 'Corner R 3', shortLabel: 'CR3', type: '3pt' },
  { id: 'wing_r_3', label: 'Wing R 3', shortLabel: 'WR3', type: '3pt' },
  { id: 'top_3', label: 'Top of Key 3', shortLabel: 'TK3', type: '3pt' },
  { id: 'wing_l_3', label: 'Wing L 3', shortLabel: 'WL3', type: '3pt' },
  { id: 'corner_l_3', label: 'Corner L 3', shortLabel: 'CL3', type: '3pt' },
  { id: 'corner_r_mid', label: 'Corner R Mid', shortLabel: 'CRM', type: 'mid' },
  { id: 'wing_r_mid', label: 'Wing R Mid', shortLabel: 'WRM', type: 'mid' },
  { id: 'top_mid', label: 'Top of Key Mid', shortLabel: 'TKM', type: 'mid' },
  { id: 'wing_l_mid', label: 'Wing L Mid', shortLabel: 'WLM', type: 'mid' },
  { id: 'corner_l_mid', label: 'Corner L Mid', shortLabel: 'CLM', type: 'mid' },
  { id: 'free_throw', label: 'Free Throw', shortLabel: 'FT', type: 'paint' },
  { id: 'under_basket', label: 'Under Basket', shortLabel: 'UB', type: 'paint' },
] as const;

export type ZoneId = typeof ZONES[number]['id'];

export interface ZoneStats {
  zone: ZoneId;
  attempts: number;
  made: number;
  percentage: number;
}

export type ShotType = 'catch_and_shoot' | 'attack_off_dribble';
export type Element = 'jab_step' | 'shot_fake' | 'jab_cross';
export type FinishType = 'jump_shot' | 'layup' | 'eurostep' | 'floater' | 'power_finish';

export const SHOT_TYPE_LABELS: Record<ShotType, string> = {
  catch_and_shoot: 'Catch & Shoot',
  attack_off_dribble: 'Attack Off Dribble',
};

export const ELEMENT_LABELS: Record<Element, string> = {
  jab_step: 'Jab Step',
  shot_fake: 'Shot Fake',
  jab_cross: 'Jab Cross',
};

export const FINISH_TYPE_LABELS: Record<FinishType, string> = {
  jump_shot: 'Jump Shot',
  layup: 'Layup',
  eurostep: 'Eurostep',
  floater: 'Floater',
  power_finish: 'Power Finish',
};

// Get heat color based on shooting percentage
export function getHeatColor(percentage: number, attempts: number): string {
  if (attempts === 0) return 'hsla(220, 60%, 30%, 0.15)';
  if (percentage >= 60) return 'hsla(142, 71%, 45%, 0.5)';
  if (percentage >= 45) return 'hsla(80, 60%, 50%, 0.45)';
  if (percentage >= 35) return 'hsla(38, 92%, 50%, 0.4)';
  if (percentage >= 20) return 'hsla(15, 90%, 50%, 0.4)';
  return 'hsla(0, 72%, 51%, 0.45)';
}

export function isColdZone(percentage: number, attempts: number): boolean {
  return attempts >= 3 && percentage < 30;
}
