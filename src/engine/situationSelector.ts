import { JOBS, JobCategory } from '../data/jobs';
import {
  ChoiceLean,
  SeedContext,
  SituationCategory,
  SituationSeed,
  buildSituationSeeds,
} from '../data/situationSeeds';
import { OutcomeTier } from './statGen';
import { SceneMode } from '../types/game';

/**
 * Doc 04: turns the 40 authored seeds into a character/history-aware weighted
 * pick, so the same seed pool feels different depending on who's playing, how
 * the story has gone so far, and what just happened.
 */
const CATEGORY_KEYWORDS: Record<SituationCategory, string[]> = {
  danger: ['도적', '맹수', '짐승', '위험', '싸움', '피습', '습격', '부상', '침입'],
  work: ['셈', '삯', '도구', '장사', '시장', '흥정', '일감', '집세', '빚'],
  social: ['모임', '대화', '손님', '이웃', '지인', '부탁', '다툼'],
  mystery: ['발자국', '흔적', '수상', '의문', '정체', '샛길', '물건'],
  horror: ['소리', '인기척', '그림자', '텅', '오싹', '섬뜩', '발소리'],
  comedy: ['웃음', '오해', '소동', '실수', '엉뚱', '헤집'],
  bond: ['호감', '설렘', '다정', '마음이 쓰', '친해', '가까워', '애정'],
};

export function inferCategory(text: string): SituationCategory | null {
  for (const [category, words] of Object.entries(CATEGORY_KEYWORDS) as [SituationCategory, string[]][]) {
    if (words.some((w) => text.includes(w))) return category;
  }
  return null;
}

const RISKY_KEYWORDS = ['맞선다', '맞서', '정면', '따라간다', '다가가', '뛰어든다', '캐묻', '살펴본다', '확인한다', '쫓아다니'];
const SAFE_KEYWORDS = ['피한다', '물러선다', '숨', '지켜본다', '되돌아간다', '거절', '넘긴다', '기다린다', '무시하고'];

export interface ChoiceMeta {
  lean: ChoiceLean;
  category: SituationCategory;
}

/**
 * Doc 04: "발자국을 조사하고 어떻게 끝난 건지 모르겠다" 피드백 — 결과 문구를 그 선택이 나온
 * 시드의 카테고리에 맞게 고르려면, 어느 시드에서 나온 선택지였는지 역추적할 수 있어야 한다.
 * 선택지 문구는 시드마다 사실상 유일하므로 exact-match로 안정적으로 복원 가능하다.
 */
export function buildKnownChoiceMeta(seedCtx: SeedContext): Map<string, ChoiceMeta> {
  const map = new Map<string, ChoiceMeta>();
  buildSituationSeeds(seedCtx).forEach((seed) => {
    seed.choices.forEach((choice) => map.set(choice.text, { lean: choice.lean, category: seed.category }));
  });
  return map;
}

/** Exact-match against the known choice bank first (reliable); keyword guess as fallback for AI-authored text. */
export function inferChoiceLean(text: string, knownMeta: Map<string, ChoiceMeta>): ChoiceLean {
  const known = knownMeta.get(text);
  if (known) return known.lean;
  if (RISKY_KEYWORDS.some((w) => text.includes(w))) return 'risky';
  if (SAFE_KEYWORDS.some((w) => text.includes(w))) return 'safe';
  return 'neutral';
}

/** Only resolvable for choices that came from our own seed bank (AI-authored text falls back to null). */
export function inferChoiceCategory(text: string, knownMeta: Map<string, ChoiceMeta>): SituationCategory | null {
  return knownMeta.get(text)?.category ?? null;
}

const PERSONALITY_BIAS: Record<string, Partial<Record<SituationCategory, number>>> = {
  '신중한': { work: 1.3, danger: 0.7 },
  '대담한': { danger: 1.5, horror: 0.6 },
  '냉소적인': { mystery: 1.3, comedy: 1.2, bond: 0.6 },
  '다정한': { social: 1.5, bond: 1.7 },
  '계산적인': { work: 1.4, mystery: 1.2, bond: 0.7 },
  '고집스러운': { danger: 1.2, work: 1.2 },
  '소심한': { horror: 1.4, social: 0.7, bond: 0.7 },
  '낙천적인': { comedy: 1.5, horror: 0.6, bond: 1.3 },
  '예민한': { horror: 1.4, mystery: 1.3 },
  '무뚝뚝한': { work: 1.3, social: 0.7, bond: 0.6 },
  '호기심 많은': { mystery: 1.6 },
  '과묵한': { work: 1.2, social: 0.6, bond: 0.6 },
};

const JOB_CATEGORY_BIAS: Record<JobCategory, Partial<Record<SituationCategory, number>>> = {
  labor: { work: 1.3, danger: 1.1 },
  combat: { danger: 1.5 },
  scholar: { mystery: 1.4, work: 1.1 },
  merchant: { work: 1.4, comedy: 1.1 },
  other: { mystery: 1.2 },
};

export interface SelectionContext {
  seedCtx: SeedContext;
  sceneMode: SceneMode;
  avoidRepeat: boolean;
  recentDayLogs: string[];
  hpRatio: number;
  luk: number;
  phase: string;
  linkedTier?: OutcomeTier;
  /** Doc 04: "한번 나온 상황은 안 나왔으면" — 이미 본 시드 id는 (다 보기 전까지) 후보에서 제외한다. */
  excludeIds?: Set<string>;
}

export interface WeightedSeedResult {
  seed: SituationSeed;
  /** true면 이 모드의 시드를 전부 본 상태라 순환을 리셋했다는 신호 — 호출자가 usedSeedIds를 새로 시작해야 함. */
  wasReset: boolean;
}

function weightSeed(seed: SituationSeed, ctx: SelectionContext): number {
  let weight = 1;

  const recentCategories = ctx.recentDayLogs.map(inferCategory).filter((c): c is SituationCategory => !!c);
  if (recentCategories.includes(seed.category)) {
    weight *= ctx.avoidRepeat ? 0.25 : 1.3;
  }

  weight *= PERSONALITY_BIAS[ctx.seedCtx.personality]?.[seed.category] ?? 1;

  const jobCategory = JOBS.find((j) => j.label === ctx.seedCtx.job)?.category;
  if (jobCategory) weight *= JOB_CATEGORY_BIAS[jobCategory]?.[seed.category] ?? 1;

  if (ctx.hpRatio < 0.3) {
    if (seed.category === 'danger' || seed.category === 'horror') weight *= 1.6;
    if (seed.category === 'bond') weight *= 0.5; // 크게 다친 상태에서 로맨스는 어울리지 않는다
  }
  if (ctx.luk <= 3 && seed.category === 'horror') weight *= 1.3;
  if (ctx.luk >= 8 && seed.category === 'comedy') weight *= 1.3;

  if ((ctx.phase === '격변기' || ctx.phase === '결말부') && (seed.category === 'danger' || seed.category === 'horror')) {
    weight *= 1.3;
  }
  if (ctx.phase === '정착기' && (seed.category === 'work' || seed.category === 'social')) {
    weight *= 1.2;
  }
  if (ctx.phase === '성장기' && seed.category === 'bond') {
    weight *= 1.4; // 관계가 쌓이는 시기에 호감/우정 사건이 자연스럽다
  }

  if (ctx.linkedTier === 'bad' && (seed.category === 'danger' || seed.category === 'horror')) {
    weight *= 1.4;
  }
  if (ctx.linkedTier === 'good' && (seed.category === 'social' || seed.category === 'work' || seed.category === 'comedy' || seed.category === 'bond')) {
    weight *= 1.2;
  }

  return Math.max(weight, 0.05);
}

export function pickWeightedSeed(ctx: SelectionContext): WeightedSeedResult {
  const seeds = buildSituationSeeds(ctx.seedCtx);
  const modePool = seeds.filter((s) => s.mode === ctx.sceneMode);
  const basePool = modePool.length > 0 ? modePool : seeds;

  const exclude = ctx.excludeIds ?? new Set<string>();
  const unseenPool = basePool.filter((s) => !exclude.has(s.id));
  const wasReset = unseenPool.length === 0;
  const candidates = wasReset ? basePool : unseenPool;

  const weights = candidates.map((seed) => weightSeed(seed, ctx));
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < candidates.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return { seed: candidates[i], wasReset };
  }
  return { seed: candidates[candidates.length - 1], wasReset };
}
