/** Small display helpers shared by several pages. */

export function initials(name: string | null | undefined): string {
  const words = (name ?? '').replace(/[^\p{L}\p{N} ]/gu, ' ').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  return (words[0][0] + (words[1]?.[0] ?? '')).toUpperCase();
}

const AVATAR_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

/** Same company always gets the same colour. */
export function avatarColor(name: string | null | undefined): string {
  let hash = 0;
  for (const ch of name ?? '') hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function scoreClass(score: number | null | undefined): string {
  if (score == null) return '';
  return score >= 70 ? 'high' : score >= 50 ? 'mid' : 'low';
}

export function todayIso(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((Date.parse(toIso.slice(0, 10)) - Date.parse(fromIso.slice(0, 10))) / 86400000);
}
