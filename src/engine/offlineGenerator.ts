import { AITurnResponse, StatDelta, TurnContext } from '../types/game';
import { applyLuckBias, sampleOutcomeTier, OutcomeTier } from './statGen';
import { SceneTag } from '../data/backgroundThemes';
import { eunNeun } from './korean';

/**
 * Local template-based fallback used when the Cloudflare Worker / Anthropic API
 * is unreachable, so the game always stays playable (see docs/design/04-ai-gamemaster-prompt.md).
 * Simplification: unlike the live AI, the situation shown for the next day is picked
 * independently from the outcome of the previous choice (both stay schema-compatible,
 * but the offline narrative is intentionally looser than the live AI's).
 */
interface SituationTemplate {
  tag: SceneTag;
  build: (name: string, job: string, personality: string) => string;
  choices: string[];
}

const SITUATION_TEMPLATES: SituationTemplate[] = [
  {
    tag: 'city',
    build: (name, job) =>
      `${name}${eunNeun(name)} 이른 아침 도시의 대로를 걷는다. ${job}으로서 오늘 해야 할 일이 산더미다. 저 앞에서 순찰대가 사람들을 붙잡고 무언가를 캐묻고 있다.`,
    choices: ['순찰대를 피해 골목으로 돌아간다', '무슨 일인지 다가가서 물어본다', '신경 쓰지 않고 하던 일을 계속한다'],
  },
  {
    tag: 'forest',
    build: (name, job, personality) =>
      `숲 가장자리에서 ${personality} 성격의 ${name}${eunNeun(name)} 낯선 발자국을 발견한다. 사람의 것 치고는 너무 크고, 짐승의 것 치고는 너무 규칙적이다.`,
    choices: ['발자국을 따라가 본다', '거리를 두고 지켜본다', '왔던 길로 되돌아간다'],
  },
  {
    tag: 'market',
    build: (name) =>
      `시장 한복판, ${name}의 앞에 낯선 상인이 좌판을 펼친다. 값싼 물건들 사이로 어딘가 사연 있어 보이는 물건 하나가 눈에 띈다.`,
    choices: ['값을 흥정해 본다', '물건의 출처를 캐묻는다', '무시하고 지나간다'],
  },
  {
    tag: 'danger',
    build: (name) =>
      `길이 좁아지는 협곡에서 ${name}${eunNeun(name)} 등 뒤에서 위험한 인기척을 느낀다. 산적일지도 모른다.`,
    choices: ['빠르게 앞으로 달린다', '몸을 숨기고 상황을 살핀다', '정면으로 맞선다'],
  },
  {
    tag: 'social',
    build: (name, job, personality) =>
      `저녁, 마을 사람들이 모임을 갖는 자리에 ${personality} ${name}도 어울리게 된다. 누군가 ${job}에 대해 험담 섞인 농담을 던진다.`,
    choices: ['웃어넘긴다', '정색하며 받아친다', '자리를 슬쩍 피한다'],
  },
  {
    tag: 'indoor',
    build: (name) => `좁은 방 안, ${name}${eunNeun(name)} 오늘 번 것과 남은 식량을 헤아려 본다. 셈이 맞지 않는다.`,
    choices: ['다시 꼼꼼히 계산해 본다', '내일 더 벌면 된다고 넘긴다', '누군가 훔쳤다고 의심한다'],
  },
];

const NEXT_DAY_SUMMARIES: Record<OutcomeTier, string[]> = {
  good: ['운 좋게 하루를 잘 넘겼다.', '뜻밖의 도움으로 상황이 나아졌다.'],
  neutral: ['특별한 일 없이 하루가 지나갔다.', '평범하게 하루를 버텼다.'],
  bad: ['뜻하지 않은 곤경에 처했다.', '작은 실수가 화를 불렀다.'],
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

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateOfflineTurn(context: TurnContext): AITurnResponse {
  const { character, chosenChoice } = context;
  const template = pick(SITUATION_TEMPLATES);
  const situation = template.build(character.name, character.job, character.personality);

  if (!chosenChoice) {
    return {
      situation,
      choices: template.choices,
      stat_changes: {},
      day_summary: `${character.name}의 Day ${context.day} 이야기가 시작되었다.`,
    };
  }

  const dist = applyLuckBias(character.stats.LUK);
  const tier = sampleOutcomeTier(dist);

  return {
    situation,
    choices: template.choices,
    outcome: OUTCOME_TEXT[tier](chosenChoice),
    stat_changes: STAT_DELTA_BY_TIER[tier],
    day_summary: pick(NEXT_DAY_SUMMARIES[tier]),
  };
}
