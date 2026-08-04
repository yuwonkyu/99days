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
  // '피'/'적' 같은 한 글자 키워드는 '피하다'/'규칙적'처럼 무관한 흔한 단어에도 부분 문자열로
  // 걸려 오탐이 잦아('규칙적이다'가 'danger'로 잘못 분류되는 식) 더 구체적인 복합어로 대체.
  { tag: 'danger', keywords: ['위험', '핏자국', '피투성이', '유혈', '싸움', '칼', '화살', '습격', '도적', '산적', '돌연변이', '비명'] },
  { tag: 'forest', keywords: ['숲', '나무', '수풀', '덤불', '사냥', '산속', '야생'] },
  { tag: 'market', keywords: ['시장', '상인', '가판', '노점', '흥정', '교역'] },
  { tag: 'social', keywords: ['잔치', '연회', '대화', '만남', '모임', '축제', '술집'] },
  { tag: 'indoor', keywords: ['방', '집', '거처', '실내', '오두막', '창고', '침대'] },
];

export function inferSceneTag(situationText: string): SceneTag {
  for (const { tag, keywords } of KEYWORD_TAGS) {
    if (keywords.some((k) => situationText.includes(k))) return tag;
  }
  return 'city';
}

/**
 * Doc 07 Phase 5: 희노애락을 확장한 5가지 분위기 축 — 같은 SceneTag(장소) 안에서도
 * 다정한 장면과 다투는 장면이 다른 배경을 쓰도록 얹는 보조 축. inferSceneTag와 동일하게
 * situation 텍스트 키워드로 추론하며, 우선순위가 높은(더 또렷한 감정인) 순서로 검사한다.
 * 'calm'이 기본값 — 지금 6장의 SceneTag 기본 이미지가 이 역할을 겸한다.
 */
export type SceneMood = 'joy' | 'anger' | 'sorrow' | 'fear' | 'calm';

const KEYWORD_MOODS: Array<{ mood: SceneMood; keywords: string[] }> = [
  { mood: 'fear', keywords: ['발소리', '발자국', '소름', '오싹', '스산', '텅 비어', '숨죽인', '지켜보고 있다'] },
  { mood: 'anger', keywords: ['말다툼', '시비', '소란', '삿대질', '언성', '몰아세'] },
  { mood: 'sorrow', keywords: ['독촉', '빚쟁이', '망가졌다', '궁핍', '한숨'] },
  { mood: 'joy', keywords: ['호감', '다정', '편해진', '훈훈', '반가움'] },
];

export function inferMood(situationText: string): SceneMood {
  for (const { mood, keywords } of KEYWORD_MOODS) {
    if (keywords.some((k) => situationText.includes(k))) return mood;
  }
  return 'calm';
}
