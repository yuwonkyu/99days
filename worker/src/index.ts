export interface Env {
  RATE_LIMIT: KVNamespace;
  ANTHROPIC_API_KEY: string;
  ANTHROPIC_MODEL: string;
  DAILY_LIMIT: string;
  ALLOWED_ORIGIN: string;
}

// Kept in sync with src/engine/promptBuilder.ts SYSTEM_PROMPT in the frontend repo —
// see docs/design/04-ai-gamemaster-prompt.md. Update both together.
const SYSTEM_PROMPT = `당신은 텍스트 기반 생존 성장 시뮬레이션 게임의 진행자(게임마스터)입니다.

[세계관 규칙 - 절대 위반 금지]
- 전근대 문명. 마법/무공/주술/초자연적 존재/기적/부활 없음
- 인간의 삶은 신체능력, 두뇌, 경험, 판단력, 노력, 운으로만 결정됨
- 돌연변이(유전적 변이 인간)는 존재하나 완전한 악이 아닌 '다른 생존방식의 존재'
- 죽음은 끝. 영혼/사후세계 없음, 자연으로 돌아가거나 무(無)
- 전투는 짧고 위험하고 비효율적 - 최후의 수단일 뿐 해결책 아님
- '운'은 신의 개입이 아니라 우연/타이밍/타인의 행동이 겹쳐 만드는 결과로만 표현
- 주인공만 특별하지 않음 - 조연도 각자의 서사를 가짐

[매 턴 생성 절차]
1. 캐릭터 상태(스탯/나이/직업/체형/소지품/Day/이력 요약/과거 캐릭터 유산 목록)를 입력받음
2. 상황 설명(2~4문장, 150자 이내) 생성
3. 선택지 2~4개 제시 (각 25자 이내, 자유행동 여지도 허용)
4. 선택 후: 현실적 결과(2~3문장, 120자 이내) 생성, 스탯 반영, 과도하게 유리한 결과 금지
5. day_summary는 30자 이내 한 줄 요약

[생성 후 자가 검증 체크리스트]
- 세계관 위반 없는가?
- 행동이 현실적인가?
- 결과가 과도하게 유리하지 않은가?
- 다른 인물도 주인공이 될 수 있는가? (조연 비중 확보)
- '운'이 개입했다면 납득 가능한가?
- 분량 제한을 지켰는가? (불필요한 수식어·부연설명 생략)

[진행 방향 안내 - turnContext.storyDirective 활용]
- phase/phaseGuide: 지금이 99일 중 어떤 단계인지 알려줌. 그 방향에 맞게 사건의 무게를 조절할 것
- sceneMode(외출/거처): "외출"이면 여정·순찰·사냥·교역·탐색처럼 밖으로 나가는 성격의 사건을, "거처"면 방어·은신·은폐·거주·피난처럼 머무는 성격의 사건을 자연스럽게 녹여낼 것 (단어를 그대로 쓰라는 뜻이 아니라 그 성격의 상황을 만들라는 뜻)
- avoidRepeat가 true면 recentTags와 겹치지 않는 새로운 장소·인물·사건을 반드시 등장시킬 것

[콘텐츠 가이드라인]
- 폭력/죽음/상실 등 소설의 톤(건조한 현실주의)은 유지하되 과도하게 선정적이거나 자극적인 묘사는 피할 것
- 미성년 캐릭터가 생성될 수 있으므로 연령에 부적절한 내용 생성 금지

캐릭터의 현재 상태는 사용자 메시지에 JSON으로 주어진다. turnContext.chosenChoice가 없으면
Day 1 시작 상황이므로 situation/choices만 생성한다(outcome/stat_changes는 비워도 된다).
chosenChoice가 있으면 그 선택의 현실적인 결과를 outcome/stat_changes로 생성하고,
이어서 다음 상황(situation)과 선택지(choices)를 함께 생성한다. 반드시 emit_turn 도구를
호출해 결과를 반환할 것.`;

const TOOL_SCHEMA = {
  name: 'emit_turn',
  description: '이번 턴의 상황/선택지/결과를 정해진 JSON 스키마로 반환한다.',
  input_schema: {
    type: 'object',
    properties: {
      situation: { type: 'string', description: '2~4문장, 150자 이내의 현재 상황 설명' },
      choices: {
        type: 'array',
        items: { type: 'string' },
        minItems: 2,
        maxItems: 4,
        description: '플레이어가 고를 수 있는 선택지 2~4개 (각 25자 이내)',
      },
      outcome: {
        type: 'string',
        description: '이전 선택의 결과, 2~3문장 120자 이내 (Day 1 시작 상황에서는 생략 가능)',
      },
      stat_changes: {
        type: 'object',
        properties: {
          STR: { type: 'number' },
          INT: { type: 'number' },
          AGI: { type: 'number' },
          LUK: { type: 'number' },
          HP: { type: 'number' },
        },
      },
      day_summary: { type: 'string', description: '30자 이내, 복귀 시 요약용 한 줄' },
    },
    required: ['situation', 'choices', 'stat_changes', 'day_summary'],
  },
};

function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(data: unknown, status: number, origin: string): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

function isPlausibleTurnContext(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  if (!v.character || typeof v.character !== 'object') return false;
  if (typeof v.day !== 'number' || typeof v.totalDays !== 'number') return false;
  if (!Array.isArray(v.recentDayLogs) || !Array.isArray(v.legacyMentions)) return false;
  return true;
}

async function checkRateLimit(env: Env, ip: string): Promise<boolean> {
  const dayKey = new Date().toISOString().slice(0, 10);
  const key = `rl:${dayKey}:${ip}`;
  const current = Number((await env.RATE_LIMIT.get(key)) ?? '0');
  const limit = Number(env.DAILY_LIMIT || '50');
  if (current >= limit) return false;
  await env.RATE_LIMIT.put(key, String(current + 1), { expirationTtl: 60 * 60 * 26 });
  return true;
}

async function callAnthropic(env: Env, turnContext: unknown): Promise<unknown> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `다음은 현재 턴의 캐릭터/게임 상태 JSON이다:\n${JSON.stringify(turnContext)}`,
        },
      ],
      tools: [TOOL_SCHEMA],
      tool_choice: { type: 'tool', name: 'emit_turn' },
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic API error: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as {
    content: Array<{ type: string; input?: unknown }>;
  };
  const toolUse = data.content.find((block) => block.type === 'tool_use');
  if (!toolUse || !toolUse.input) {
    throw new Error('No tool_use block in Anthropic response');
  }
  return toolUse.input;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = env.ALLOWED_ORIGIN || '*';

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(origin) });
    }

    const url = new URL(request.url);
    if (url.pathname !== '/turn' || request.method !== 'POST') {
      return json({ error: 'not found' }, 404, origin);
    }

    let body: { sessionId?: string; turnContext?: unknown };
    try {
      body = await request.json();
    } catch {
      return json({ error: 'invalid JSON body' }, 400, origin);
    }

    if (!isPlausibleTurnContext(body.turnContext)) {
      return json({ error: 'invalid turnContext' }, 400, origin);
    }

    const ip = request.headers.get('CF-Connecting-IP') || body.sessionId || 'unknown';
    const allowed = await checkRateLimit(env, ip);
    if (!allowed) {
      return json({ error: 'daily limit reached' }, 429, origin);
    }

    try {
      const turn = await callAnthropic(env, body.turnContext);
      return json(turn, 200, origin);
    } catch (err) {
      return json({ error: (err as Error).message }, 502, origin);
    }
  },
};
