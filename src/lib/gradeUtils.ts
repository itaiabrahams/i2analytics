/**
 * Convert an overall session score (-1 to +1) to a letter grade.
 * Scale: A+ (best) → F (worst)
 */
export function getLetterGrade(score: number): string {
  if (score >= 0.8) return 'A+';
  if (score >= 0.6) return 'A';
  if (score >= 0.4) return 'A-';
  if (score >= 0.2) return 'B+';
  if (score >= 0.0) return 'B';
  if (score >= -0.2) return 'B-';
  if (score >= -0.4) return 'C+';
  if (score >= -0.6) return 'C';
  if (score >= -0.8) return 'D';
  return 'F';
}

/**
 * Get a CSS color class for a letter grade.
 */
export function getGradeColor(grade: string): string {
  if (grade.startsWith('A')) return 'text-success';
  if (grade.startsWith('B')) return 'text-accent';
  if (grade.startsWith('C')) return 'text-yellow-500';
  if (grade === 'D') return 'text-orange-500';
  return 'text-destructive';
}

/**
 * Get player tier based on monthly shot attempts.
 * I2: 0-1999, I2 PRO: 2000-3999, I2 ELITE: 4000+
 */
export function getPlayerTier(monthlyAttempts: number): { tier: string; label: string; color: string } {
  if (monthlyAttempts >= 4000) {
    return { tier: 'elite', label: 'I2 ELITE', color: 'text-yellow-400' };
  }
  if (monthlyAttempts >= 2000) {
    return { tier: 'pro', label: 'I2 PRO', color: 'text-accent' };
  }
  return { tier: 'basic', label: 'I2', color: 'text-muted-foreground' };
}

/**
 * Get tier badge styling
 */
export function getTierBadgeStyle(tier: string): string {
  switch (tier) {
    case 'elite':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'pro':
      return 'bg-accent/20 text-accent border-accent/30';
    default:
      return 'bg-secondary text-muted-foreground border-border';
  }
}
