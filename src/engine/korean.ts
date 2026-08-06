const HANGUL_BASE = 0xac00;
const HANGUL_LAST = 0xd7a3;

function hasBatchim(word: string): boolean {
  const trimmed = word.trim();
  if (!trimmed) return false;
  const code = trimmed.charCodeAt(trimmed.length - 1);
  if (code < HANGUL_BASE || code > HANGUL_LAST) return false;
  return (code - HANGUL_BASE) % 28 !== 0;
}

/** Picks the correct Korean topic particle (은/는) for a word ending in Hangul. */
export function eunNeun(word: string): string {
  return hasBatchim(word) ? '은' : '는';
}

/** Picks the correct Korean subject particle (이/가). */
export function iGa(word: string): string {
  return hasBatchim(word) ? '이' : '가';
}

/** Picks the correct Korean object particle (을/를). */
export function eulReul(word: string): string {
  return hasBatchim(word) ? '을' : '를';
}

/**
 * Picks the correct Korean directional/instrumental/role particle (으로/로).
 * Unlike 은/는·이/가·을/를, this one isn't a plain "batchim or not" split — a
 * word ending in ㄹ batchim still takes 로, not 으로 (e.g. "뱃사공"→으로 but
 * "대장장이"→로, both no batchim; "물"→로 despite having a batchim, because
 * it's ㄹ). Also covers "~로서" (as/in the capacity of) via `euroRo(word) + '서'`.
 */
export function euroRo(word: string): string {
  const trimmed = word.trim();
  if (!trimmed) return '으로';
  const code = trimmed.charCodeAt(trimmed.length - 1);
  if (code < HANGUL_BASE || code > HANGUL_LAST) return '으로';
  const batchimIndex = (code - HANGUL_BASE) % 28;
  return batchimIndex === 0 || batchimIndex === 8 ? '로' : '으로';
}
