import { Stats } from '../types/character';

export type JobCategory = 'labor' | 'combat' | 'scholar' | 'merchant' | 'other';

export interface JobDef {
  id: string;
  label: string;
  category: JobCategory;
  /** origins.ts의 RegionDef.statTendency와 같은 방식(작은 ±1~2 가산)으로 스탯 굴림 평균에 더해진다. */
  statTendency?: Partial<Stats>;
}

// Rough job pool referenced by RegionDef.jobIds in origins.ts.
// 2026-08-06 실플레이 제보: "유난히 반복되는 직업이 있다" — characterGen.ts가 지역을 균등 랜덤으로
// 고른 뒤 그 지역의 jobIds(5개) 중에서 다시 균등 랜덤으로 뽑는 구조라, 여러 지역에 중복 등재된
// 직업은 그만큼 뽑힐 확률이 배가된다. blacksmith/soldier가 northern_highlands와 western_feudal
// 양쪽에 다 있어서 다른 직업보다 정확히 2배 자주 나오고 있었음 — origins.ts에서 western_feudal의
// 중복 항목을 knight/troubadour로 교체해 전 직업이 정확히 1/25 확률로 균등해지도록 수정.
//
// 2026-08-06 실플레이 제보 #2: "학자인데 지력이 4밖에 안 된다 — 직업별 어울리는 스텟 경향이
// 있어야 할 것 같다". 이전까지 stat 굴림은 지역(origins.ts statTendency)만 반영하고 직업과는
// 완전히 무관했다(캐릭터 생성 시 지역→직업 순으로 뽑히지만 스탯은 지역 tendency만으로 굴려짐).
// 지역 tendency와 같은 방식(정규분포 평균만 살짝 미는 것, 하드 최솟값 아님)으로 직업별
// statTendency를 추가 — 그래도 학자가 지력 4를 굴리는 극단치 자체는 여전히(더 드물게) 가능하다,
// 의도적으로 하드 플로어는 두지 않음(운이 아주 나쁜 학자도 있을 수 있다는 쪽이 더 자연스러움).
export const JOBS: JobDef[] = [
  { id: 'hunter', label: '사냥꾼', category: 'labor', statTendency: { AGI: 1, STR: 1 } },
  { id: 'herder', label: '목동', category: 'labor', statTendency: { STR: 1 } },
  { id: 'blacksmith', label: '대장장이', category: 'labor', statTendency: { STR: 2 } },
  { id: 'soldier', label: '병사', category: 'combat', statTendency: { STR: 2 } },
  { id: 'porter', label: '짐꾼', category: 'labor', statTendency: { STR: 1 } },
  { id: 'tracker', label: '추적자', category: 'combat', statTendency: { AGI: 2 } },
  { id: 'trapper', label: '덫사냥꾼', category: 'labor', statTendency: { AGI: 1 } },
  { id: 'herbalist', label: '약초꾼', category: 'other', statTendency: { INT: 1 } },
  { id: 'scout', label: '정찰병', category: 'combat', statTendency: { AGI: 2 } },
  { id: 'weaver', label: '길쌈장이', category: 'labor', statTendency: { AGI: 1 } },
  { id: 'merchant', label: '상인', category: 'merchant', statTendency: { LUK: 1, INT: 1 } },
  { id: 'boatman', label: '뱃사공', category: 'labor', statTendency: { STR: 1 } },
  { id: 'gambler', label: '도박꾼', category: 'merchant', statTendency: { LUK: 2 } },
  { id: 'clerk', label: '서기', category: 'scholar', statTendency: { INT: 2 } },
  { id: 'moneylender', label: '전당업자', category: 'merchant', statTendency: { INT: 1, LUK: 1 } },
  { id: 'scholar', label: '학자', category: 'scholar', statTendency: { INT: 2 } },
  { id: 'scribe', label: '필경사', category: 'scholar', statTendency: { INT: 2 } },
  { id: 'physician', label: '의원', category: 'scholar', statTendency: { INT: 2 } },
  { id: 'guard', label: '경비병', category: 'combat', statTendency: { STR: 1 } },
  { id: 'farmer', label: '농부', category: 'labor', statTendency: { STR: 1 } },
  { id: 'squire', label: '종자', category: 'combat', statTendency: { STR: 1, AGI: 1 } },
  { id: 'farmhand', label: '농노', category: 'labor', statTendency: { STR: 1 } },
  { id: 'mason', label: '석공', category: 'labor', statTendency: { STR: 2 } },
  { id: 'knight', label: '기사', category: 'combat', statTendency: { STR: 2 } },
  { id: 'troubadour', label: '음유시인', category: 'other', statTendency: { LUK: 1, AGI: 1 } },
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
