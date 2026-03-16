export const SHOOTING_DRILLS: Record<number, string[]> = {
  1: ['קליעה מעמידה - 5 עמדות × 10 זריקות', 'Catch & Shoot מהכנף - 3 סטים × 8', 'זריקות חופשיות - 20 רצוף'],
  2: ['מכניקת קליעה - תרגול יד מובילה × 50', 'קליעה אחרי דריבל פול-אפ - 4 סטים × 6', 'זריקות מהפינות - 3 סטים × 10'],
  3: ['קליעה מדריבל - Crossover Pull-up × 30', 'Catch & Shoot מהטופ - 3 סטים × 10', 'זריקות חופשיות תחת לחץ - 2/1/1'],
  4: ['קליעה בתנועה - Curl Cuts × 24', 'Step-back Jumper - 4 סטים × 6', 'קליעה מהכנף אחרי מסך - 3 סטים × 8'],
  5: ['קליעה מ-3 נקודות - סיבוב 5 עמדות × 3', 'Off-the-Dribble Mid-Range × 30', 'זריקות חופשיות - 30 רצוף'],
  6: ['Quick Release Shooting - 4 סטים × 8', 'קליעה אחרי Hesitation - 3 סטים × 6', 'Spot-up Shooting - 5 עמדות × 8'],
  7: ['קליעה בעומס - Sprint & Shoot × 20', 'Pick & Pop Shooting - 3 סטים × 8', 'זריקות חופשיות - 25 רצוף'],
  8: ['Floater Training - 4 סטים × 6', 'קליעה מ-Mid Range - 5 עמדות × 6', 'Catch & Shoot מהירות - 3 סטים × 10'],
  9: ['תרגול מכניקה - One Hand Form × 50', 'קליעה אחרי Cut - 3 סטים × 8', 'Game Shots - סימולציה × 20'],
  10: ['קליעה מ-3 תחת לחץ זמן - 4 סטים × 6', 'Pull-up Mid-Range - 4 סטים × 6', 'זריקות חופשיות - 2 סטים × 15'],
  11: ['קליעה מעמידה מתקדמת - 5 עמדות × 12', 'Step-back 3PT - 3 סטים × 6', 'Off-Screen Shooting - 3 סטים × 8'],
  12: ['Contested Shooting - 4 סטים × 6', 'קליעה בריצה - Transition 3s × 20', 'זריקות חופשיות - 30 רצוף'],
  13: ['Relocate & Shoot - 4 סטים × 8', 'קליעה אחרי Behind-the-back - 3 סטים × 6', 'Spot-up מהירות - 5 עמדות × 10'],
  14: ['קליעה בתנועה רציפה - 3 סטים × 10', 'Deep 3-Point Shooting × 20', 'זריקות חופשיות תחרותיות - 20'],
  15: ['Power Move + Finish - 4 סטים × 6', 'קליעה תחת עייפות - Sprint × Shoot × 15', 'Mid-Range Game Spots × 30'],
  16: ['Advanced Catch & Shoot - 4 סטים × 10', 'Dribble Combo into Shot × 24', 'זריקות חופשיות - 35 רצוף'],
  17: ['Step-back + Side-step 3s - 3 סטים × 8', 'קליעה מ-Handoff - 4 סטים × 6', 'Pin-Down Shooting × 20'],
  18: ['Movement Shooting Circuit × 30', 'Curl + Flare Shooting - 3 סטים × 8', 'זריקות חופשיות - 25 רצוף'],
  19: ['Touch & Shoot - 5 עמדות × 8', 'Triple Threat Shot - 3 סטים × 8', 'Off-Dribble Deep Range × 20'],
  20: ['Shooting in Motion - Full Court × 20', 'DHO Shooting - 4 סטים × 6', 'זריקות חופשיות - 30 רצוף'],
  21: ['Catch & Shoot - Quick Feet × 30', 'Coming off Screens - 4 סטים × 8', 'Contested 3s × 20'],
  22: ['Pro Shot Routine - 5 עמדות × 10', 'Pick & Pop Advanced × 24', 'זריקות חופשיות - 40 רצוף'],
  23: ['Combo Moves + Finish × 30', 'Transition Pull-up × 20', 'Deep Range + Mid-Range Circuit × 24'],
  24: ['Elite Shooting Circuit × 40', 'Game-Speed Catch & Shoot × 30', 'זריקות חופשיות - 50 רצוף'],
  25: ['Full Court Shooting Drill × 30', 'Contested Step-back × 20', 'Off-Screen Complex × 24'],
  26: ['Power Shooting - Heavy Ball × 20', 'Sprint & Shoot Endurance × 30', 'זריקות חופשיות - 40 רצוף'],
  27: ['Complete Shooting Review × 40', 'All Zones Game Simulation × 30', 'Final Free Throw Challenge - 50 רצוף'],
};

/** Returns true if the month's title indicates it's NOT a shooting-only plan (i.e., it's combined) */
export function isCombinedWorkout(title: string): boolean {
  const shootingOnlyKeywords = ['תוכנית קליעה'];
  return !shootingOnlyKeywords.includes(title);
}
