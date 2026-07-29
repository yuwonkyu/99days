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
