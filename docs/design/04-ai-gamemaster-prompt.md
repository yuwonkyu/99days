# 04. AI 게임마스터 — 시스템 프롬프트

## 사용 모델 / API

- **API**: Anthropic Messages API (`https://api.anthropic.com/v1/messages`)
- **모델**: `claude-haiku-4-5-20251001` (Claude Haiku 4.5) — 무료로 서비스하는 게임 특성상 응답 속도와 비용 효율을 우선하여 선택. Worker 환경변수(`ANTHROPIC_MODEL`)로 손쉽게 교체 가능하게 구현.
- **호출 경로**: 프론트엔드(GitHub Pages 정적 사이트) → Cloudflare Worker(`worker/src/index.ts`, `/turn` 엔드포인트) → Anthropic Messages API. API 키는 Worker의 secret으로만 저장되어 클라이언트/플레이어에게 절대 노출되지 않는다. 자세한 배포 절차는 [README.md](../../README.md) 참고.
- **오프라인 폴백**: Worker 미배포/장애/레이트리밋 초과 시 `src/engine/offlineGenerator.ts`의 로컬 템플릿 생성기가 동일한 JSON 스키마로 상황을 만들어 게임이 끊기지 않게 한다.

## 시스템 프롬프트 (원문)

```
당신은 텍스트 기반 생존 성장 시뮬레이션 게임의 진행자(게임마스터)입니다.

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
4. 선택지 2~4개 제시 (각 25자 이내, 자유행동 여지도 허용)
5. 스탯 반영, 과도하게 유리한 결과 금지
6. day_summary는 60자 내외 한 문장 요약 — 나중에 돌아왔을 때 그날 무슨 일이었는지 알아볼 수 있을 정도로, 문장 중간에 끊기지 않게

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

[이야기 흐름(단편/장편) 안내 - turnContext.activeThread 활용]
- activeThread가 있으면: 이번 situation은 그 인물·장소·갈등을 반드시 그대로 이어서 다룰 것 — 관계없는 새 사건으로 갑자기 전환하는 것 절대 금지. 오늘로 그 사안이 끝나면 thread.status를 "resolved"로, 아직 진행 중이면 "continuing"으로 하고 summary를 지금 상태에 맞게 갱신할 것. activeThread.turns가 4 이상이면 되도록 이번이나 다음 턴 안에 매듭지을 것 (무한정 끌지 말 것)
- activeThread가 없으면: situation은 기본적으로 그날 안에 끝나는 단편으로 다루고 thread.status는 "none"으로 둘 것. 다만 가끔(매 턴은 아니고 이따금) 다음 날로 이어질 만한 여운이 남는 사건이면 thread.status를 "continuing"으로 하고 summary/category를 채워 짧은 연속 사건(보통 2~5일)을 새로 시작해도 좋음 — 매번 새로 시작할 필요는 없음
- thread.summary는 20자 이내로 "누구와 무엇이 진행 중인지"만 담을 것 (예: "숲 파수꾼과의 대치")

[하루/시간 흐름 서술 원칙]
- Day는 문자 그대로 24시간이 아니어도 된다. storyDirective.timeSkip이 true면 timeSkipLabel(예: "몇 주", "몇 년")만큼 시간이 흘렀음을 situation 도입부에 자연스럽게 녹여 서술할 것. false면 전날 바로 다음으로 이어지는 하루로 서술
- timeSkip이 "몇 년"처럼 큰 폭이면 stat_changes.AGE로 나이 증가를 정수로 반영해도 된다 (작은 폭이면 생략)
- 감정은 위험·갈등뿐 아니라 호감·우정·애정 등 긍정적 관계 감정도 캐릭터의 상황과 성격에 맞게 자연스럽게 담아낼 것

[콘텐츠 가이드라인]
- 폭력/죽음/상실 등 소설의 톤(건조한 현실주의)은 유지하되 과도하게 선정적이거나 자극적인 묘사는 피할 것
- 미성년 캐릭터가 생성될 수 있으므로 연령에 부적절한 내용 생성 금지

[위기 안내 - turnContext.storyDirective.crisisAhead / resolvingCrisis 활용]
- crisisAhead가 true면: 이번에 생성하는 situation은 캐릭터의 99일 인생 중 손꼽히는 위기의 순간이어야 한다. 실제로 죽음에 이를 수 있는 심각한 신체적 위험(습격, 화재, 급류, 붕괴, 맹수, 질병 등 세계관에 맞는 사실적 위협)을 구체적으로 묘사할 것
- resolvingCrisis가 true면: 이번에 생성하는 outcome/stat_changes.HP는 직전 위기 상황에서 내린 선택의 실제 결과다. 선택이 나빴거나 운이 나빴다면 HP를 크게(예: -25~-45) 깎아 죽음에 이를 수도 있게 하고, 신중하고 현명한 선택이었다면 생존 가능성을 확실히 남길 것. 과도하게 유리한 결과로 위기를 무마하지 말 것

[출력 형식 - JSON]
{
  "situation": "string",
  "choices": ["string", ...],
  "outcome": "string (선택 후에만)",
  "stat_changes": { "STR": 0, "INT": 0, "AGI": 0, "LUK": 0, "HP": 0, "AGE": 0 },
  "day_summary": "string (한 줄, 복귀 시 요약용)",
  "thread": { "status": "none | continuing | resolved", "summary": "string (continuing이면 필수)", "category": "string (선택)" }
}
```

이 원문은 `src/engine/promptBuilder.ts`의 `SYSTEM_PROMPT` 상수와 정확히 동일하게 유지한다(수정 시 이 문서와 코드를 함께 갱신).

## 턴 컨텍스트 조립

`promptBuilder.ts`는 위 시스템 프롬프트에 아래를 JSON으로 덧붙여 매 턴 사용자 메시지로 전달한다:

- 현재 캐릭터 스탯/나이/직업/체형/출생지역/혼종여부/소지품
- 현재 Day / 총 진행일수
- 누적 `day_summary` 로그(최근 N개)
- 계승 기록에서 가져온 "과거 인물 목록"(이름, 생애 요약, 사인 — [06-legacy-system.md](./06-legacy-system.md) 참고)
- `storyDirective` — 아래 "서사 흐름 유도" 참고
- (선택 응답 턴인 경우) 플레이어가 고른 선택지 텍스트

## 서사 흐름 유도 (storyDirective)

실제 플레이 테스트에서 15~21일 구간처럼 특정 구간에서 비슷한 상황이 2~3번 반복되며 진전이 없는
문제가 발견되었다. AI에게만 다양성을 맡기면(특히 저비용 모델·오프라인 폴백에서) 반복이 발생하기
쉬우므로, `src/engine/storyFlow.ts`가 매 턴 코드로 다음을 결정해 `turnContext.storyDirective`로
함께 전달한다:

- **phase/phaseGuide**: 99일을 정착기(1~14%)→성장기(~35%)→격변기(~60%)→수렴기(~85%)→결말부 5단계로
  나눠, 지금이 어느 단계인지와 그 단계의 서사적 방향을 알려준다. 엔딩을 향한 흐름을 만드는 장치.
- **sceneMode**: 그날의 큰 활동 성격을 `외출`(여정/순찰/사냥/교역/탐색) 또는 `거처`(방어/은신/은폐/
  거주/피난) 중 하나로 코드가 정한다. 같은 모드가 2일 연속이면 다음 날은 무조건 전환한다.
- **avoidRepeat/recentTags**: 최근 3일의 `day_summary`를 [backgroundThemes.ts](../../src/data/backgroundThemes.ts)의
  장면 태그로 분류해, 같은 태그가 2회 이상 겹치면 `avoidRepeat: true`와 함께 다른 장소·사건을
  만들라고 명시한다.
- **timeSkip/timeSkipLabel**: Day가 항상 문자 그대로 24시간일 필요는 없다는 판단에 따라, 코드가
  12% 확률로(1일차 제외) "며칠~몇 년" 중 하나를 뽑아 시간 압축 서술을 지시한다. 짧은 압축(며칠/몇
  주)이 대부분이고 "몇 년" 같은 큰 폭은 드물게만 나온다. AI는 이 힌트에 맞춰 도입부에 시간 경과를
  자연스럽게 녹이고, 폭이 크면 `stat_changes.AGE`로 나이도 반영할 수 있다.
- **감정 다양성**: 위험/갈등뿐 아니라 호감·우정·애정 같은 긍정적 관계 감정도 캐릭터 성격/상황에 맞게
  나오도록 시스템 프롬프트에 명시했다 (오프라인 폴백에는 `bond` 카테고리로 별도 반영, 아래 참고).
- **activeThread (다일 스토리 스레드)**: AI에게 "직전 outcome과만 자연스럽게 이어질 것"을 지시해도,
  실제로는 `recentDayLogs`가 30자짜리 요약 3개뿐이라 며칠 전 등장한 인물/사건을 모델이 기억하지
  못하고 무관한 새 사건으로 튀는 문제가 있었다(예: 숲에서 만난 파수꾼과 헤어졌는데 다른 날 야생동물
  조우 선택 직후 갑자기 그 파수꾼과 창고에서 대치하는 식). `GameState.activeThread`가 진행 중인
  사안(요약/카테고리/시작일/경과 턴)을 명시적으로 들고 다니며 매 턴 `turnContext.activeThread`로
  전달하고, 모델은 응답에 `thread.status`(`none`/`continuing`/`resolved`)로 그 사안을 계속 이어갈지
  오늘 매듭지을지 답해야 한다 — 프롬프트 지시에만 기대지 않고 상태를 코드가 명시적으로 왕복시켜
  드리프트를 막는 구조. `activeThread`가 있는 턴은 `storyFlow.ts`가 `avoidRepeat`/`timeSkip`도 강제로
  끄므로, 다양성 유도 장치가 진행 중인 스레드와 충돌하지 않는다. **이 필드는 Cloudflare Worker의
  `TOOL_SCHEMA`/`SYSTEM_PROMPT`에도 반영되어 있으므로, 코드 변경 후 `worker/` 디렉토리에서
  `npx wrangler deploy`로 재배포해야 실제 AI 응답에 적용된다** (프론트엔드 GitHub Pages 배포와는
  별도 절차).
- **crisisAhead/resolvingCrisis (3회 생사 위기)**: "99일 동안 실제로 죽는 일이 거의 없어 생존율이
  체감상 너무 높다"는 피드백에 대응해, 매 턴의 확률을 전체적으로 바꾸는 대신 손꼽히는 위기 순간만
  확실히 위험하게 만드는 쪽을 택했다. `GameState.crisisDays`가 게임 시작 시 `storyFlow.generateCrisisDays()`로
  초반(15~40일)/중반(41~70일)/후반(71~95일) 구간에 하나씩, 총 3일을 랜덤 배정해 고정한다. 해당 Day의
  situation을 생성하는 턴에는 `crisisAhead: true`를, 그 위기에서 내린 선택의 결과를 생성하는 다음 턴에는
  `resolvingCrisis: true`를 전달해 AI가 실제로 죽음에 이를 수 있는 수준의 상황/결과를 만들도록 지시한다.
  오프라인 폴백은 [situationSeeds.ts](../../src/data/situationSeeds.ts)의 `buildCrisisSeeds()` 전용
  시드와 [offlineGenerator.ts](../../src/engine/offlineGenerator.ts)의 `CRISIS_STAT_DELTA_BY_TIER`/
  `CRISIS_LEAN_BASE`(안전한 선택도 bad 확률 30%대)로 동일한 위험도를 보장한다. **이 필드도 Cloudflare
  Worker의 `SYSTEM_PROMPT`에 반영되어 있으므로, `worker/` 디렉토리에서 `npx wrangler deploy`로
  재배포해야 AI 경로에도 실제로 적용된다.**
- 오프라인 폴백([offlineGenerator.ts](../../src/engine/offlineGenerator.ts))도 동일한 `sceneMode`로
  템플릿 풀을 필터링해, AI 없이도 최소한의 흐름을 유지한다. 다만 AI와 달리 매번 독립된 시드를 뽑기
  때문에 "거처에서 문을 확인하다가 갑자기 숲 가장자리"처럼 뜬금없게 느껴진다는 실플레이 피드백이
  있었다 — `buildTransitionPrefix()`가 2일차부터 시작 문구("다음 날," 또는 timeSkip이 있으면 "그로부터
  {timeSkipLabel}이 지나,")를 상황 앞에 붙여 최소한의 연결감을 준다(시드 자체에 이미 "이른 아침,"
  같은 시간대 표현이 있으면 중복을 피해 생략). `activeThread`가 열려 있는 상태로 오프라인 폴백이 뽑히면
  (오프라인 시드는 AI가 만든 스레드의 구체적 인물/장소를 이어 쓸 수 없으므로) 그 스레드를 조용히
  무시하지 않고 "그 사이 {summary} 쪽 일은 잠시 소강상태로 접어들었다" 식의 한 줄로 명시적으로 닫은
  뒤 새 시드로 넘어간다(`thread.status: "resolved"`로 반환) — 스레드가 소리 없이 증발하는 대신 항상
  플레이어가 인지할 수 있게 마무리된다.
- **결과가 뭘 뜻하는지 알 수 없다는 피드백**(예: 발자국을 조사했는데 어떻게 끝났는지 모름)에 대응해,
  선택지가 우리 시드 뱅크에서 나온 것이면(`inferChoiceCategory`로 exact-match 역추적) 그 시드의
  카테고리에 맞는 구체적 결말(`CATEGORY_RESOLUTIONS`, 카테고리×티어별 문구)을 쓴다. 예:
  mystery+bad → "쫓다가 위험한 존재와 정면으로 마주쳐 놀란 가슴을 쓸어내리며 도망쳤다." 선택지가
  AI가 쓴 문구라 카테고리를 모르면 lean(안전/위험) 기반 일반 문구로 폴백한다.
- **"같은 상황이 반복해서 나온다" 피드백**: `GameState.usedSeedIds`에 캐릭터가 오프라인 폴백에서 이미
  본 시드 id를 쌓아두고, `pickWeightedSeed()`가 이를 후보에서 제외한다(같은 `sceneMode` 풀을 전부
  보기 전까진 반복 안 함). 그 모드의 시드를 다 보면 `wasReset`이 true가 되어 목록을 새로 시작하고
  다시 한 바퀴 순환한다 — 40개 시드가 유한하니 "영원히 반복 없음"은 불가능하지만, 최소한 매 순환마다
  전부 다 보여준 뒤에만 반복되게 한다. AI 경로는 애초에 매번 새로 생성하므로 해당 없음.
- **스탯 변화 UI 표시**: 결과 텍스트만으로는 실제로 뭐가 얼마나 바뀌었는지 안 보인다는 피드백 —
  [StatChangeBadges.tsx](../../src/components/StatChangeBadges.tsx)가 `stat_changes`(HP/STR/INT/AGI/
  LUK/AGE)를 색깔 있는 뱃지로 결과 텍스트 옆에 표시한다(AI/오프라인 공통).
- 모든 응답은 [textLimits.ts](../../src/engine/textLimits.ts)에서 글자수를 하드 캡(상황 150자/결과
  150자/선택지 25자/day_summary 30자)해, 프롬프트 지시를 모델이 안 지켜도 UI에는 항상 짧게 보인다.

## 오프라인 폴백 콘텐츠 라이브러리 (목표: 999개 상황 / 999개 엔딩)

Worker 레이트리밋(하루 50콜)이나 네트워크 장애 시 쓰이는 오프라인 생성기가 콘텐츠 부족으로 반복되는
문제를 해결하기 위해, 단순 랜덤 템플릿에서 **조합형 콘텐츠 라이브러리**로 구조를 바꿨다:

- [situationSeeds.ts](../../src/data/situationSeeds.ts): `외출/거처` 2모드 × `위기/생계/사교/수수께끼/
  공포/황당/호감(bond)` 7카테고리 = 14버킷에 각 2~3개씩, 총 **40개 시드**를 저작. `bond`는 위험·갈등
  뿐 아니라 호감·우정·애정 같은 긍정적 관계 감정도 나오도록 추가한 카테고리. 이 중 일부는 낱말 뱅크
  (예: `TIME_MOODS`, `STRANGERS`)를 랜덤으로 섞어 렌더링해, 캐릭터 1명 기준으로도 **약 184종의 서로
  다른 상황 텍스트**가 나온다(이름/직업/성격까지 다르면 실질 다양성은 더 크다). 선택지도 항상 3택1이
  아니라 시드마다 2~4개로 다르게 구성.
- [situationSelector.ts](../../src/engine/situationSelector.ts): 시드를 뽑을 때 성격(12종)·직업군
  (노동/전투/학자/상인/기타)·체력 비율·행운 스탯·`storyDirective.phase`·직전 3일 로그에서 추론한
  장르(카테고리) 연속성까지 반영해 가중치를 매긴다. `avoidRepeat`가 true면 최근과 겹치는 카테고리를
  강하게 억제하고, 아니면 살짝 이어가 "결과에 맞는 상황으로 이어지는" 느낌을 준다.
- 선택지의 `lean`(안전/중립/위험) 태그가 다음 날 결과 확률 분포([offlineGenerator.ts](../../src/engine/offlineGenerator.ts)의
  `LEAN_BASE`)에 직접 반영되고, 그 결과 티어(good/neutral/bad)가 다시 다음 상황의 카테고리 가중치에
  영향을 준다 — "선택지의 선택에 맞는 확률적 상황 변환".
- [endings.ts](../../src/data/endings.ts) / [endingSelector.ts](../../src/engine/endingSelector.ts):
  사망/포기/완주 3종 × 비극/공포/황당/평온/성취 분위기로 나눠 **57개 엔딩 문구**를 저작. 사망 엔딩은
  직전 상황의 장르(공포/위험 등)에 따라 분위기가 가중 랜덤으로 정해진다.
- **999/999는 장기 목표**다. 지금 구조(시드 + 낱말 뱅크 + 무드×타입 그리드)는 이후 세션에서 시드나
  뱅크 항목을 추가하기만 하면 콘텐츠가 계속 늘어나도록 설계했다 — 매번 아키텍처를 새로 짤 필요가
  없다는 뜻. 진행 상황은 [PROGRESS.md](./PROGRESS.md), 남은 계획은 [ROADMAP.md](./ROADMAP.md) 참고.

## Claude Code 활용 내역

이 저장소의 프로젝트 스캐폴딩(Expo+TS 초기화), 엔진 레이어(스탯/캐릭터 생성/저장소/프롬프트 빌더/AI 클라이언트/오프라인 폴백), UI 스크린/컴포넌트, Cloudflare Worker 프록시, GitHub Actions 배포 워크플로우는 모두 Claude Code(Anthropic)와의 페어 프로그래밍으로 작성되었다. 개발자는 세계관/스탯 설계 문서를 작성해 Claude Code에 전달했고, Claude Code가 이를 바탕으로 코드 구조 설계·구현·검증(타입체크, 웹 빌드 확인, 로컬 플레이테스트)을 수행했다.
