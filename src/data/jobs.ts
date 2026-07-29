export type JobCategory = 'labor' | 'combat' | 'scholar' | 'merchant' | 'other';

export interface JobDef {
  id: string;
  label: string;
  category: JobCategory;
}

// Rough job pool referenced by RegionDef.jobIds in origins.ts.
export const JOBS: JobDef[] = [
  { id: 'hunter', label: '사냥꾼', category: 'labor' },
  { id: 'herder', label: '목동', category: 'labor' },
  { id: 'blacksmith', label: '대장장이', category: 'labor' },
  { id: 'soldier', label: '병사', category: 'combat' },
  { id: 'porter', label: '짐꾼', category: 'labor' },
  { id: 'tracker', label: '추적자', category: 'combat' },
  { id: 'trapper', label: '덫사냥꾼', category: 'labor' },
  { id: 'herbalist', label: '약초꾼', category: 'other' },
  { id: 'scout', label: '정찰병', category: 'combat' },
  { id: 'weaver', label: '길쌈장이', category: 'labor' },
  { id: 'merchant', label: '상인', category: 'merchant' },
  { id: 'boatman', label: '뱃사공', category: 'labor' },
  { id: 'gambler', label: '도박꾼', category: 'merchant' },
  { id: 'clerk', label: '서기', category: 'scholar' },
  { id: 'moneylender', label: '전당업자', category: 'merchant' },
  { id: 'scholar', label: '학자', category: 'scholar' },
  { id: 'scribe', label: '필경사', category: 'scholar' },
  { id: 'physician', label: '의원', category: 'scholar' },
  { id: 'guard', label: '경비병', category: 'combat' },
  { id: 'farmer', label: '농부', category: 'labor' },
  { id: 'squire', label: '종자', category: 'combat' },
  { id: 'farmhand', label: '농노', category: 'labor' },
  { id: 'mason', label: '석공', category: 'labor' },
];

export function getJob(id: string): JobDef {
  const job = JOBS.find((j) => j.id === id);
  if (!job) throw new Error(`Unknown job: ${id}`);
  return job;
}

/** Doc 02: labor/combat jobs get a small HP bonus, scholar/merchant jobs a small penalty. */
export function jobHpModifier(category: JobCategory): number {
  switch (category) {
    case 'labor':
    case 'combat':
      return 4;
    case 'scholar':
    case 'merchant':
      return -4;
    default:
      return 0;
  }
}
