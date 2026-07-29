import { RegionId, Stats } from '../types/character';

export interface RegionDef {
  id: RegionId;
  label: string;
  description: string;
  /** Rough additive tendency applied to base stat rolls (kept small: ±1~2 per doc). */
  statTendency: Partial<Stats>;
  jobIds: string[];
}

// Placeholder regional flavor text. Rough tendencies only — not final balance numbers.
export const REGIONS: RegionDef[] = [
  {
    id: 'northern_highlands',
    label: '북부 고원 국가',
    description: '척박한 고원과 매서운 바람 속에서 목축과 수렵으로 살아가는 사람들.',
    statTendency: { STR: 2 },
    jobIds: ['hunter', 'herder', 'blacksmith', 'soldier', 'porter'],
  },
  {
    id: 'forest_tribes',
    label: '숲의 부족 국가',
    description: '깊은 숲을 근거지로 삼아 사냥과 채집, 은밀한 이동술로 생존하는 부족들.',
    statTendency: { AGI: 2 },
    jobIds: ['tracker', 'trapper', 'herbalist', 'scout', 'weaver'],
  },
  {
    id: 'river_trade_city',
    label: '강 중심 상업 도시',
    description: '큰 강을 낀 교역의 중심지. 상인과 도박꾼, 정보상이 뒤섞여 산다.',
    statTendency: { LUK: 1, INT: 1 },
    jobIds: ['merchant', 'boatman', 'gambler', 'clerk', 'moneylender'],
  },
  {
    id: 'eastern_dynasty',
    label: '동양풍 왕조',
    description: '엄격한 신분 질서와 관료제, 학문을 중시하는 오래된 왕조.',
    statTendency: { INT: 2 },
    jobIds: ['scholar', 'scribe', 'physician', 'guard', 'farmer'],
  },
  {
    id: 'western_feudal',
    label: '서양풍 봉건국가',
    description: '영주와 기사, 농노가 얽힌 봉건 질서. 잦은 소규모 전쟁이 배경에 깔려 있다.',
    statTendency: { STR: 1, AGI: 1 },
    jobIds: ['squire', 'farmhand', 'mason', 'soldier', 'blacksmith'],
  },
];

export function getRegion(id: RegionId): RegionDef {
  const region = REGIONS.find((r) => r.id === id);
  if (!region) throw new Error(`Unknown region: ${id}`);
  return region;
}
