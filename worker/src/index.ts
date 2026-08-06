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
2. outcome(전날 선택의 결과, 있는 경우, 2~3문장 120자 이내)은 전날 하루가 어떻게 흘러갔는지 요약하듯 서술
3. situation(오늘의 상황, 2~4문장 150자 이내)은 outcome에서 자연스럽게 이어지는 오늘의 도입부로 작성 — 맥락 없는 별개 사건으로 갑자기 전환하지 말 것
4. 선택지 2~4개 제시 (각 25자 이내) — "더 묻는다"/"이야기를 이어간다"처럼 대화만 연장하는 선택지 금지. 반드시 그날의 결과를 실제로 가르는 구체적 행동/결정일 것(예: "일자리를 받는다"/"거절한다"/"다른 일을 알아본다")
5. 스탯 반영, 과도하게 유리한 결과 금지
6. day_summary는 60자 내외 한 문장 요약 — 나중에 돌아왔을 때 그날 무슨 일이었는지 알아볼 수 있을 정도로, 문장 중간에 끊기지 않게

[하루 = 대화 한 마디가 아니라 사건 하나]
- 한 턴(하루)은 대화나 과정의 중간 단계가 아니라, 그 자체로 시작·전개·결과가 있는 사건이어야 한다. 같은 인물·같은 대화가 "묻는다 → 대답한다 → 또 묻는다"처럼 여러 턴에 걸쳐 과정만 늘어지지 않게, 선택은 곧바로 그날의 결과로 이어질 것

[생성 후 자가 검증 체크리스트]
- 세계관 위반 없는가?
- 행동이 현실적인가?
- 결과가 과도하게 유리하지 않은가?
- 다른 인물도 주인공이 될 수 있는가? (조연 비중 확보)
- '운'이 개입했다면 납득 가능한가?
- 분량 제한을 지켰는가? (불필요한 수식어·부연설명 생략)
- 선택지가 대화를 늘어지게 하는 것이 아니라 그날의 결정인가?

[진행 방향 안내 - turnContext.storyDirective 활용]
- phase/phaseGuide: 지금이 99일 중 어떤 단계인지 알려줌. 그 방향에 맞게 사건의 무게를 조절할 것
- sceneMode(외출/거처): "외출"이면 여정·순찰·사냥·교역·탐색처럼 밖으로 나가는 성격의 사건을, "거처"면 방어·은신·은폐·거주·피난처럼 머무는 성격의 사건을 자연스럽게 녹여낼 것 (단어를 그대로 쓰라는 뜻이 아니라 그 성격의 상황을 만들라는 뜻)
- avoidRepeat가 true면 recentTags와 겹치지 않는 새로운 장소·인물·사건을 반드시 등장시킬 것

[이야기 흐름(단편/장편) 안내 - turnContext.activeThread 활용]
- activeThread가 있으면: 이번 situation은 그 인물·장소·갈등을 반드시 그대로 이어서 다룰 것 — 관계없는 새 사건으로 갑자기 전환하는 것 절대 금지. 오늘로 그 사안이 끝나면 thread.status를 "resolved"로, 아직 진행 중이면 "continuing"으로 하고 summary를 지금 상태에 맞게 갱신할 것. activeThread.turns가 4 이상이면 되도록 이번이나 다음 턴 안에 매듭지을 것 (무한정 끌지 말 것)
- activeThread가 없으면: situation은 기본적으로 그날 안에 끝나는 단편으로 다루고 thread.status는 "none"으로 둘 것. 다만 가끔(매 턴은 아니고 이따금) 다음 날로 이어질 만한 여운이 남는 사건이면 thread.status를 "continuing"으로 하고 summary/category를 채워 짧은 연속 사건(보통 2~5일)을 새로 시작해도 좋음 — 매번 새로 시작할 필요는 없음
- thread.summary는 20자 이내로 "누구와 무엇이 진행 중인지"만 담을 것 (예: "숲 파수꾼과의 대치")

[하루/시간 흐름 서술 원칙]
- Day는 문자 그대로 24시간이 아니어도 된다. storyDirective.timeSkip이 true면 timeSkipLabel(예: "몇 주", "몇 년")만큼 시간이 흘렀음을 situation 도입부에 자연스럽게 녹여 서술할 것. false면 전날 바로 다음으로 이어지는 하루로 서술
- timeSkip이 "몇 년"처럼 큰 폭이면 stat_changes.AGE로 나이 증가를 정수로 반영해도 된다 (작은 폭이면 생략)
- 감정은 위험·갈등뿐 아니라 호감·우정·애정 등 긍정적 관계 감정도 캐릭터의 상황과 성격에 맞게 자연스럽게 담아낼 것

[위기 안내 - turnContext.storyDirective.crisisAhead / resolvingCrisis 활용]
- crisisAhead가 true면: 이번에 생성하는 situation은 캐릭터의 99일 인생 중 손꼽히는 위기의 순간이어야 한다. 실제로 죽음에 이를 수 있는 심각한 신체적 위험(습격, 화재, 급류, 붕괴, 맹수, 질병 등 세계관에 맞는 사실적 위협)을 구체적으로 묘사할 것
- resolvingCrisis가 true면: 이번에 생성하는 outcome/stat_changes.HP는 직전 위기 상황에서 내린 선택의 실제 결과다. 선택이 나빴거나 운이 나빴다면 HP를 크게(예: -25~-45) 깎아 죽음에 이를 수도 있게 하고, 신중하고 현명한 선택이었다면 생존 가능성을 확실히 남길 것. 과도하게 유리한 결과로 위기를 무마하지 말 것

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
      situation: {
        type: 'string',
        description: '2~4문장, 150자 이내. outcome에서 자연스럽게 이어지는 오늘의 도입부(별개 사건 금지)',
      },
      choices: {
        type: 'array',
        items: { type: 'string' },
        minItems: 2,
        maxItems: 4,
        description: '플레이어가 고를 수 있는 선택지 2~4개 (각 25자 이내)',
      },
      outcome: {
        type: 'string',
        description: '전날 선택의 결과를 요약하듯 서술, 2~3문장 120자 이내 (Day 1 시작 상황에서는 생략 가능)',
      },
      stat_changes: {
        type: 'object',
        properties: {
          STR: { type: 'number' },
          INT: { type: 'number' },
          AGI: { type: 'number' },
          LUK: { type: 'number' },
          HP: { type: 'number' },
          AGE: { type: 'number', description: 'storyDirective.timeSkip이 큰 폭일 때만 정수로 반영' },
        },
      },
      day_summary: { type: 'string', description: '60자 내외, 복귀 시 요약용 한 문장 — 문장 중간에 끊기지 않게' },
      thread: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['none', 'continuing', 'resolved'],
            description: '이 situation이 다음 날로 이어지는 사안인지 — none: 오늘로 끝나는 단편, continuing: 다음 날도 이어짐(summary 필수), resolved: activeThread가 오늘로 매듭지어짐',
          },
          summary: { type: 'string', description: '20자 이내, "누구와 무엇이 진행 중인지" — status가 continuing일 때 필수' },
          category: { type: 'string', description: '예: danger/work/social/mystery/horror/comedy/bond' },
        },
        required: ['status'],
      },
    },
    required: ['situation', 'choices', 'stat_changes', 'day_summary', 'thread'],
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
      // `thread`는 스키마상 마지막 필드라 다른 필드보다 트렁케이션에 가장 취약함 — 500에서도 이미
      // day_summary가 40~50% 확률로 잘렸던 전례(2026-08-03, PROGRESS.md)를 감안해 여유를 조금 더 둠.
      // 실제 과금은 생성된 토큰 수 기준이라 상한을 올려도 비용은 거의 그대로.
      max_tokens: 650,
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
