/** Value = (enjoyment + preference) - difficulty, per the pattern scoring rubric. */
export function patternValue(difficulty: number, enjoyment: number, preference: number): number {
  return enjoyment + preference - difficulty;
}
