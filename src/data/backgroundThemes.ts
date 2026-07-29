export type SceneTag = 'city' | 'forest' | 'market' | 'danger' | 'social' | 'indoor';

export interface SceneTheme {
  tag: SceneTag;
  label: string;
  gradient: [string, string];
}

export const SCENE_THEMES: Record<SceneTag, SceneTheme> = {
  city: {
    tag: 'city',
    label: '도시',
    gradient: ['#2b3a55', '#5c6f8a'],
  },
  forest: {
    tag: 'forest',
    label: '숲',
    gradient: ['#1e3d2f', '#3c6e52'],
  },
  market: {
    tag: 'market',
    label: '시장',
    gradient: ['#5a3e26', '#a3703f'],
  },
  danger: {
    tag: 'danger',
    label: '위험',
    gradient: ['#3a1414', '#7a2626'],
  },
  social: {
    tag: 'social',
    label: '사교',
    gradient: ['#4a2f5a', '#8a5fa3'],
  },
  indoor: {
    tag: 'indoor',
    label: '실내',
    gradient: ['#3a2f26', '#6e5a45'],
  },
};

const KEYWORD_TAGS: Array<{ tag: SceneTag; keywords: string[] }> = [
  { tag: 'danger', keywords: ['위험', '피', '싸움', '칼', '화살', '적', '습격', '도적', '산적', '돌연변이', '비명'] },
  { tag: 'forest', keywords: ['숲', '나무', '수풀', '덤불', '사냥', '산속', '야생'] },
  { tag: 'market', keywords: ['시장', '상인', '가판', '노점', '흥정', '교역'] },
  { tag: 'social', keywords: ['잔치', '연회', '대화', '만남', '모임', '축제', '술집'] },
  { tag: 'indoor', keywords: ['방', '집', '실내', '오두막', '창고', '침대'] },
];

export function inferSceneTag(situationText: string): SceneTag {
  for (const { tag, keywords } of KEYWORD_TAGS) {
    if (keywords.some((k) => situationText.includes(k))) return tag;
  }
  return 'city';
}
