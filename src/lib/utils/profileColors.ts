/** Stable avatar gradient per student profile, by its position on the account. */
export const PROFILE_GRADIENTS: [string, string][] = [
  ['#8E1437', '#C2185B'],
  ['#1E5AA8', '#4F8FE0'],
  ['#0F7A52', '#3DB385'],
  ['#B8860B', '#E0B23C'],
];

export function gradientFor(index: number): [string, string] {
  return PROFILE_GRADIENTS[Math.max(0, index) % PROFILE_GRADIENTS.length];
}
