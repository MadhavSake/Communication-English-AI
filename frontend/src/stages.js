// Mirrors backend/content/syllabus.json (names only) so the UI renders instantly.
export const STAGES = [
  { n: 1, name: 'Absolute Beginner' },
  { n: 2, name: 'Foundation English' },
  { n: 3, name: 'Elementary' },
  { n: 4, name: 'Pre-Intermediate' },
  { n: 5, name: 'Intermediate' },
  { n: 6, name: 'Upper-Intermediate' },
  { n: 7, name: 'IELTS: Listening & Reading' },
  { n: 8, name: 'IELTS: Writing & Speaking' },
  { n: 9, name: 'Business English' },
  { n: 10, name: 'Professional Communication' },
  { n: 11, name: 'Public Speaking', optional: true },
  { n: 12, name: 'Leadership & Debate', optional: true },
];
export const CORE_STAGES = 10;
export const MAX_STAGE = STAGES.length;

export const stageName = (n) => STAGES.find((s) => s.n === n)?.name || '';

// Older accounts stored levels 1–15; clamp to the 12-stage range.
export function currentStage() {
  const v = parseInt(localStorage.getItem('userLevel') || '1', 10);
  return Math.min(Math.max(Number.isFinite(v) ? v : 1, 1), MAX_STAGE);
}
