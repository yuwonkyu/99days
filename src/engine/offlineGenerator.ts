import { AITurnResponse, StatDelta, TurnContext } from '../types/game';
import { applyLuckBias, sampleOutcomeTier, OutcomeDistribution, OutcomeTier } from './statGen';
import { ChoiceLean, SituationCategory, TIME_MOODS } from '../data/situationSeeds';
import {
  buildKnownChoiceMeta,
  inferChoiceCategory,
  inferChoiceLean,
  pickWeightedSeed,
} from './situationSelector';

/**
 * Local seed-based fallback used when the Cloudflare Worker / Anthropic API is
 * unreachable, so the game always stays playable (see docs/design/04-ai-gamemaster-prompt.md
 * → "서사 흐름 유도"). Situation content lives in src/data/situationSeeds.ts (40 seeds,
 * combinatorially well over 100 renders); this file picks one via situationSelector.ts,
 * resolves the previous choice's outcome with a category-specific resolution when the
 * choice came from our own seed bank, and prepends a short day-transition phrase.
 */
const NEXT_DAY_SUMMARIES: Record<OutcomeTier, string[]> = {
  good: [
    '운 좋게 하루를 잘 넘겼다.',
    '뜻밖의 도움으로 상황이 나아졌다.',
    '작은 성과를 얻어 마음이 놓였다.',
    '위기를 매끄럽게 피해 갔다.',
  ],
  neutral: [
    '특별한 일 없이 하루가 지나갔다.',
    '평범하게 하루를 버텼다.',
    '이렇다 할 변화 없이 지나갔다.',
    '이전과 크게 다르지 않은 하루였다.',
  ],
  bad: [
    '뜻하지 않은 곤경에 처했다.',
    '작은 실수가 화를 불렀다.',
    '생각보다 힘든 하루를 보냈다.',
    '피하고 싶던 문제가 결국 터졌다.',
  ],
};

/** Doc 04: "대가가 뭔지" 알 수 없다는 피드백 반영 — lean별로 실제 대가(대부분 체력 손실)를 구체적으로
 * 언급. category를 모를 때(= 직전 선택이 AI가 쓴 문구)의 폴백으로만 쓰인다 — 아래 CATEGORY_RESOLUTIONS 참고. */
const GENERIC_OUTCOME_TEXT: Record<OutcomeTier, (choice: string, lean: ChoiceLean) => string> = {
  good: (choice, lean) =>
    lean === 'risky'
      ? `"${choice}" 쪽을 택했다. 위험을 무릅쓴 보람이 있었는지, 뜻밖의 행운이 따랐다.`
      : `"${choice}" 쪽을 택했고, 예상보다 수월하게 풀렸다. 작은 행운이 따랐다.`,
  neutral: (choice) => `"${choice}" 쪽을 택했다. 특별히 좋지도 나쁘지도 않게 지나갔다.`,
  bad: (choice, lean) =>
    lean === 'risky'
      ? `"${choice}" 쪽을 택했지만 무리하다 몸을 다쳤다. 그 대가로 며칠은 몸이 욱신거릴 것 같다.`
      : `"${choice}" 쪽을 택했는데도 어쩔 수 없이 상황이 나빠져 몸에 무리가 왔다.`,
};

/**
 * Doc 04: "발자국을 조사했는데 어떻게 끝난 건지 모르겠다" 피드백 — 결과를 lean 기반 일반 문구가
 * 아니라, 그 선택이 나온 시드의 카테고리에 맞는 구체적인 결말로 서술한다.
 */
const CATEGORY_RESOLUTIONS: Record<SituationCategory, Record<OutcomeTier, string[]>> = {
  danger: {
    good: ['침착하게 대응해 위험을 완전히 피했다.', '예상보다 수월하게 위기를 넘기고 무사히 벗어났다.'],
    neutral: ['아슬아슬하게 위기를 넘겼다. 별다른 피해는 없었다.'],
    bad: ['위험에 휘말려 공격받았다. 상처를 입고 간신히 몸을 피했다.', '맞서 싸우다 크게 다쳤다.'],
  },
  work: {
    good: ['생각보다 수월하게 일을 마무리했다.', '뜻밖의 이득을 챙겼다.'],
    neutral: ['별다른 성과도 손해도 없이 하루가 지나갔다.'],
    bad: ['일이 꼬여 손해를 봤다.', '실수가 겹쳐 하루를 허비했다.'],
  },
  social: {
    good: ['좋은 인상을 남기며 관계가 한 뼘 가까워졌다.'],
    neutral: ['별다른 진전 없이 대화가 끝났다.'],
    bad: ['분위기가 서먹해졌다.', '괜한 오해를 사고 말았다.'],
  },
  mystery: {
    good: ['끝까지 쫓아 흥미로운 사실을 알아냈다.', '의문을 말끔히 해소하고 홀가분하게 발길을 돌렸다.'],
    neutral: ['끝까지 확인했지만 별다른 단서를 찾지 못했다.', '결국 아무것도 알아내지 못한 채 발길을 돌렸다.'],
    bad: ['쫓다가 위험한 존재와 정면으로 마주쳐 놀란 가슴을 쓸어내리며 도망쳤다.', '괜한 일에 휘말려 곤란해졌다.'],
  },
  horror: {
    good: ['침착하게 상황을 파악하고 무사히 벗어났다.'],
    neutral: ['별일 아니었다는 걸 확인하고 나서야 겨우 진정했다.'],
    bad: ['정체를 알 수 없는 무언가에 크게 놀라 온몸이 굳었다.'],
  },
  comedy: {
    good: ['오히려 좋은 이야깃거리가 되어 웃으며 넘어갔다.'],
    neutral: ['소동은 흐지부지 마무리됐다.'],
    bad: ['상황이 더 꼬여 웃지 못할 하루가 됐다.'],
  },
  bond: {
    good: ['마음이 한층 가까워진 걸 느꼈다.'],
    neutral: ['별다른 진전 없이 그저 그런 하루였다.'],
    bad: ['어색해진 분위기에 마음이 무거워졌다.'],
  },
};

const STAT_DELTA_BY_TIER: Record<OutcomeTier, StatDelta> = {
  good: { HP: 2, LUK: 1 },
  neutral: {},
  bad: { HP: -6 },
};

/** Doc 04: 선택지의 lean(안전/중립/위험)에 따라 결과 확률 분포 자체가 달라진다. */
const LEAN_BASE: Record<ChoiceLean, OutcomeDistribution> = {
  safe: { good: 0.3, neutral: 0.55, bad: 0.15 },
  neutral: { good: 0.25, neutral: 0.5, bad: 0.25 },
  risky: { good: 0.35, neutral: 0.2, bad: 0.45 },
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Doc 04: 오프라인 생성기는 AI와 달리 매번 독립된 시드를 뽑기 때문에, 아무 문구 없이 이어붙이면
 * "거처에서 문을 확인하다가 갑자기 숲 가장자리"처럼 뜬금없게 느껴진다는 피드백을 받았다. 짧은
 * 시간 경과 문구를 하나 붙여 최소한의 연결감을 준다.
 */
function buildTransitionPrefix(day: number, timeSkip: boolean, timeSkipLabel: string | undefined, situationText: string): string {
  if (day <= 1) return '';
  if (timeSkip && timeSkipLabel) return `그로부터 ${timeSkipLabel}이 지나, `;
  // 시드 자체에 이미 시간대 표현이 있으면 "다음 날,"과 겹쳐 어색해지므로 생략
  if (TIME_MOODS.some((mood) => situationText.startsWith(mood))) return '';
  return '다음 날, ';
}

/** category를 알면(=어제 선택이 우리 시드에서 나왔으면) 그 맥락에 맞는 구체적 결말을, 모르면 lean 기반 일반 문구를 쓴다. */
function buildOutcome(choice: string, lean: ChoiceLean, tier: OutcomeTier, category: SituationCategory | null): string {
  if (category) {
    const resolution = pick(CATEGORY_RESOLUTIONS[category][tier]);
    return `"${choice}" 쪽을 택했다. ${resolution}`;
  }
  return GENERIC_OUTCOME_TEXT[tier](choice, lean);
}

export interface OfflineTurnResult {
  response: AITurnResponse;
  /** 이번에 고른 시드의 id — GameState.usedSeedIds에 쌓아서 다음 호출 때 excludeIds로 넘긴다. */
  usedSeedId: string;
  /** true면 이 모드의 시드를 다 봐서 순환을 리셋했다는 뜻 — 호출자가 usedSeedIds를 [usedSeedId]로 새로 시작해야 한다. */
  resetUsedSeeds: boolean;
}

export function generateOfflineTurn(context: TurnContext, usedSeedIds: string[] = []): OfflineTurnResult {
  const { character, chosenChoice, storyDirective, recentDayLogs, day } = context;
  const seedCtx = { name: character.name, job: character.job, personality: character.personality };

  let tier: OutcomeTier | undefined;
  let lean: ChoiceLean = 'neutral';
  let category: SituationCategory | null = null;
  if (chosenChoice) {
    const knownMeta = buildKnownChoiceMeta(seedCtx);
    lean = inferChoiceLean(chosenChoice, knownMeta);
    category = inferChoiceCategory(chosenChoice, knownMeta);
    const dist = applyLuckBias(character.stats.LUK, LEAN_BASE[lean]);
    tier = sampleOutcomeTier(dist);
  }

  // Doc 04: 결과 티어(good/neutral/bad)가 다음 상황의 장르 가중치에도 영향을 준다 —
  // "결과에 맞는 상황으로 이어지는" 흐름. excludeIds로 "한번 나온 상황은 다시 안 나오게" 한다.
  const { seed, wasReset } = pickWeightedSeed({
    seedCtx,
    sceneMode: storyDirective.sceneMode,
    avoidRepeat: storyDirective.avoidRepeat,
    recentDayLogs: recentDayLogs ?? [],
    hpRatio: character.hp / character.maxHp,
    luk: character.stats.LUK,
    phase: storyDirective.phase,
    linkedTier: tier,
    excludeIds: new Set(usedSeedIds),
  });
  const choices = seed.choices.map((c) => c.text);
  const prefix = buildTransitionPrefix(day, storyDirective.timeSkip, storyDirective.timeSkipLabel, seed.situation);
  const situation = `${prefix}${seed.situation}`;

  if (!chosenChoice || !tier) {
    return {
      response: {
        situation,
        choices,
        stat_changes: {},
        day_summary: `${character.name}의 Day ${day} 이야기가 시작되었다.`,
      },
      usedSeedId: seed.id,
      resetUsedSeeds: wasReset,
    };
  }

  return {
    response: {
      situation,
      choices,
      outcome: buildOutcome(chosenChoice, lean, tier, category),
      stat_changes: STAT_DELTA_BY_TIER[tier],
      day_summary: pick(NEXT_DAY_SUMMARIES[tier]),
    },
    usedSeedId: seed.id,
    resetUsedSeeds: wasReset,
  };
}
