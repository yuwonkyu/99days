import { AITurnResponse, StatDelta, TurnContext } from '../types/game';
import { applyLuckBias, sampleOutcomeTier, OutcomeDistribution, OutcomeTier } from './statGen';
import { ChoiceLean } from '../data/situationSeeds';
import { buildKnownChoiceLeans, inferChoiceLean, pickWeightedSeed } from './situationSelector';

/**
 * Local seed-based fallback used when the Cloudflare Worker / Anthropic API is
 * unreachable, so the game always stays playable (see docs/design/04-ai-gamemaster-prompt.md
 * → "서사 흐름 유도"). Situation content lives in src/data/situationSeeds.ts (36 seeds,
 * combinatorially well over 100 renders); this file picks one via situationSelector.ts
 * and resolves the previous choice's outcome.
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

const OUTCOME_TEXT: Record<OutcomeTier, (choice: string) => string> = {
  good: (choice) => `"${choice}" 쪽을 택했고, 예상보다 수월하게 풀렸다. 작은 행운이 따랐다.`,
  neutral: (choice) => `"${choice}" 쪽을 택했다. 특별히 좋지도 나쁘지도 않게 지나갔다.`,
  bad: (choice) => `"${choice}" 쪽을 택했지만 상황이 꼬였다. 대가를 치러야 했다.`,
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

export function generateOfflineTurn(context: TurnContext): AITurnResponse {
  const { character, chosenChoice, storyDirective, recentDayLogs, day } = context;
  const seedCtx = { name: character.name, job: character.job, personality: character.personality };

  let tier: OutcomeTier | undefined;
  if (chosenChoice) {
    const knownLeans = buildKnownChoiceLeans(seedCtx);
    const lean = inferChoiceLean(chosenChoice, knownLeans);
    const dist = applyLuckBias(character.stats.LUK, LEAN_BASE[lean]);
    tier = sampleOutcomeTier(dist);
  }

  // Doc 04: 결과 티어(good/neutral/bad)가 다음 상황의 장르 가중치에도 영향을 준다 —
  // "결과에 맞는 상황으로 이어지는" 흐름.
  const seed = pickWeightedSeed({
    seedCtx,
    sceneMode: storyDirective.sceneMode,
    avoidRepeat: storyDirective.avoidRepeat,
    recentDayLogs: recentDayLogs ?? [],
    hpRatio: character.hp / character.maxHp,
    luk: character.stats.LUK,
    phase: storyDirective.phase,
    linkedTier: tier,
  });
  const choices = seed.choices.map((c) => c.text);

  if (!chosenChoice || !tier) {
    return {
      situation: seed.situation,
      choices,
      stat_changes: {},
      day_summary: `${character.name}의 Day ${day} 이야기가 시작되었다.`,
    };
  }

  return {
    situation: seed.situation,
    choices,
    outcome: OUTCOME_TEXT[tier](chosenChoice),
    stat_changes: STAT_DELTA_BY_TIER[tier],
    day_summary: pick(NEXT_DAY_SUMMARIES[tier]),
  };
}
