export const PERSONALITIES: string[] = [
  '신중한',
  '대담한',
  '냉소적인',
  '다정한',
  '계산적인',
  '고집스러운',
  '소심한',
  '낙천적인',
  '예민한',
  '무뚝뚝한',
  '호기심 많은',
  '과묵한',
];

export function randomPersonality(): string {
  return PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)];
}
