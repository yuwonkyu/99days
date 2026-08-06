export type SceneTag =
  | 'city'
  | 'forest'
  | 'market'
  | 'danger'
  | 'social'
  | 'indoor'
  | 'cell'
  | 'stairs'
  | 'alley'
  | 'visitation'
  | 'office'
  | 'warehouse'
  | 'dock'
  | 'field'
  | 'well'
  | 'square'
  | 'inn'
  | 'stable'
  | 'forge'
  | 'mill'
  | 'bakery'
  | 'brewery'
  | 'bridge'
  | 'gate'
  | 'riverside'
  | 'hill'
  | 'cave'
  | 'waterfall'
  | 'grassland'
  | 'swamp'
  | 'graveyard';

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
  cell: {
    tag: 'cell',
    label: '감방',
    gradient: ['#262a2e', '#4a5158'],
  },
  stairs: {
    tag: 'stairs',
    label: '계단',
    gradient: ['#2e2c2a', '#5c5750'],
  },
  alley: {
    tag: 'alley',
    label: '골목길',
    gradient: ['#24222a', '#484454'],
  },
  visitation: {
    tag: 'visitation',
    label: '면회실',
    gradient: ['#2a2e38', '#545c6e'],
  },
  office: {
    tag: 'office',
    label: '관공서',
    gradient: ['#2e3038', '#565c68'],
  },
  warehouse: {
    tag: 'warehouse',
    label: '창고',
    gradient: ['#2a2620', '#524a3a'],
  },
  dock: {
    tag: 'dock',
    label: '부두',
    gradient: ['#22323a', '#4a6470'],
  },
  field: {
    tag: 'field',
    label: '밭',
    gradient: ['#33321e', '#6a6a3c'],
  },
  well: {
    tag: 'well',
    label: '우물가',
    gradient: ['#30302c', '#5e5e54'],
  },
  square: {
    tag: 'square',
    label: '광장',
    gradient: ['#3a3226', '#78694c'],
  },
  inn: {
    tag: 'inn',
    label: '여관/술집',
    gradient: ['#3a2a18', '#7a5530'],
  },
  stable: {
    tag: 'stable',
    label: '외양간/마구간',
    gradient: ['#332c1a', '#6e5c34'],
  },
  forge: {
    tag: 'forge',
    label: '대장간',
    gradient: ['#241a14', '#8a4420'],
  },
  mill: {
    tag: 'mill',
    label: '방앗간',
    gradient: ['#3a3226', '#7a6a4a'],
  },
  bakery: {
    tag: 'bakery',
    label: '빵집/제과점',
    gradient: ['#3a2a1a', '#8a5c34'],
  },
  brewery: {
    tag: 'brewery',
    label: '양조장/술도가',
    gradient: ['#2e2414', '#6e4a22'],
  },
  bridge: {
    tag: 'bridge',
    label: '다리',
    gradient: ['#242e34', '#4a6058'],
  },
  gate: {
    tag: 'gate',
    label: '성문/관문',
    gradient: ['#2e2a26', '#5c5248'],
  },
  riverside: {
    tag: 'riverside',
    label: '강가/개울',
    gradient: ['#1e3234', '#3c6260'],
  },
  hill: {
    tag: 'hill',
    label: '언덕/구릉',
    gradient: ['#28322a', '#5a6e5c'],
  },
  cave: {
    tag: 'cave',
    label: '동굴',
    gradient: ['#202224', '#454a4e'],
  },
  waterfall: {
    tag: 'waterfall',
    label: '폭포',
    gradient: ['#1a2e28', '#3c645c'],
  },
  grassland: {
    tag: 'grassland',
    label: '초원/들판',
    gradient: ['#2e3220', '#6a7a44'],
  },
  swamp: {
    tag: 'swamp',
    label: '습지/늪',
    gradient: ['#242a1e', '#4a5238'],
  },
  graveyard: {
    tag: 'graveyard',
    label: '묘지',
    gradient: ['#2a2c28', '#525850'],
  },
};

const KEYWORD_TAGS: Array<{ tag: SceneTag; keywords: string[] }> = [
  // 장소가 특정되는 키워드(감방/계단/골목/면회실)는 danger 등 넓은 무드 키워드보다 앞에 둬서
  // 우선 매칭되게 한다 — "감방에서 다투다" 같은 장면은 danger보다 cell 배경이 더 구체적으로 맞다.
  { tag: 'cell', keywords: ['감옥', '감방', '독방', '옥사', '철창', '수감', '죄수'] },
  { tag: 'visitation', keywords: ['면회실', '면회', '접견실', '접견'] },
  { tag: 'stairs', keywords: ['계단', '층계'] },
  { tag: 'alley', keywords: ['골목'] },
  // 실제 플레이 제보: AI가 만든 "청사에서 윤쇠를 찾는" 장면이 forest 기본값으로 잘못 표시됨 —
  // 장소 키워드(청사/관아 등)가 danger/forest보다 뒤에 있어서, situation 앞부분에 숲/산길
  // 묘사가 섞여 있으면 그쪽이 먼저 걸렸기 때문. 다른 장소 특정 키워드들과 같은 우선순위로 올림.
  { tag: 'office', keywords: ['청사', '관아', '관청', '관공서', '집무실', '서무'] },
  // 실플레이 제보(2026-08-06): "창고 안은 깜깜했다... 나무 상자들"이 forest로 잘못 표시됨 —
  // 원인은 forest의 '나무' 한 글자 키워드가 "나무 상자"/"나무 문"처럼 목재 재질을 가리키는
  // (숲과 무관한) 흔한 표현에도 걸렸기 때문. '나무' 제거하고(숲/수풀/덤불/산속/산길/야생으로도
  // 충분히 커버됨), '창고'는 indoor에서 분리해 전용 태그로 승격 — 아늑한 거처와 어수선한
  // 창고는 그림도 달라야 자연스럽다.
  { tag: 'warehouse', keywords: ['창고', '곳간'] },
  { tag: 'dock', keywords: ['부두', '선착장', '나루터', '항구'] },
  { tag: 'field', keywords: ['밭', '농경지', '경작지'] },
  { tag: 'well', keywords: ['우물'] },
  { tag: 'square', keywords: ['광장'] },
  // Phase 11(2026-08-06): 마을/자연/상황 장소 15종 추가. '여관'/'술집'은 기존에 각각 indoor/
  // social 키워드에 들어 있었는데, 전용 배경이 생겼으니 그쪽에서 빼고 여기로 옮긴다.
  { tag: 'inn', keywords: ['여관', '술집', '주막', '선술집'] },
  { tag: 'stable', keywords: ['외양간', '마구간'] },
  { tag: 'forge', keywords: ['대장간'] },
  { tag: 'mill', keywords: ['방앗간', '물레방아'] },
  { tag: 'bakery', keywords: ['빵집', '제과점'] },
  { tag: 'brewery', keywords: ['양조장', '술도가'] },
  // '다리'는 신체 부위(다리를 다쳤다)와 겹치는 흔한 단어라, '나무 상자' 사고와 같은 종류의
  // 오탐을 피하려고 다리(교량)일 때만 쓰는 구체적인 구절로 한정한다.
  { tag: 'bridge', keywords: ['다리를 건너', '다리 위', '돌다리', '나무다리', '구름다리'] },
  { tag: 'gate', keywords: ['성문', '관문'] },
  { tag: 'riverside', keywords: ['강가', '개울', '시냇가'] },
  { tag: 'hill', keywords: ['언덕', '구릉'] },
  { tag: 'cave', keywords: ['동굴'] },
  { tag: 'waterfall', keywords: ['폭포'] },
  { tag: 'grassland', keywords: ['초원', '들판'] },
  { tag: 'swamp', keywords: ['습지', '늪'] },
  { tag: 'graveyard', keywords: ['묘지', '무덤'] },
  // '피'/'적' 같은 한 글자 키워드는 '피하다'/'규칙적'처럼 무관한 흔한 단어에도 부분 문자열로
  // 걸려 오탐이 잦아('규칙적이다'가 'danger'로 잘못 분류되는 식) 더 구체적인 복합어로 대체.
  { tag: 'danger', keywords: ['위험', '위협', '매복', '강도', '흉기', '핏자국', '피투성이', '유혈', '싸움', '칼', '화살', '습격', '도적', '산적', '돌연변이', '비명'] },
  { tag: 'forest', keywords: ['숲', '수풀', '덤불', '사냥', '산속', '산길', '야생'] },
  { tag: 'market', keywords: ['시장', '장터', '좌판', '저잣거리', '상인', '가판', '노점', '흥정', '교역'] },
  { tag: 'social', keywords: ['잔치', '연회', '대화', '만남', '모임', '축제'] },
  { tag: 'indoor', keywords: ['방', '집', '거처', '관사', '숙소', '실내', '오두막', '침대'] },
];

/**
 * `sceneMode` is an optional fallback, not a keyword source — many `shelter`(거처) seeds/AI
 * turns describe being home without ever writing "방"/"집" (e.g. "문을 두드린다", "짐을 정리하던")
 * and were defaulting all the way to `city`. When no keyword matches and the turn's own
 * sceneMode says "shelter", `indoor` is a much safer guess than the generic village street.
 */
export function inferSceneTag(situationText: string, sceneMode?: 'outdoor' | 'shelter'): SceneTag {
  for (const { tag, keywords } of KEYWORD_TAGS) {
    if (keywords.some((k) => situationText.includes(k))) return tag;
  }
  return sceneMode === 'shelter' ? 'indoor' : 'city';
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
