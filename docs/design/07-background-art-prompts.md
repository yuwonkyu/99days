# 07. 상황 키워드 기반 배경 아트 — 프롬프트 로드맵

**상태(2026-08-04 갱신): 코드 연결 완료, 기본 6종 + Phase 5 분위기 소분류 13종 전부 실제 아트 교체 완료.**
[BackgroundScene.tsx](../../src/components/BackgroundScene.tsx)가 `assets/backgrounds/{tag}.png` 6장을
그라디언트 위에 얹는 구조에서, `SceneTag`+`SceneMood` 조합의 `{tag}_{mood}.png` 13장을 추가로 얹는
구조로 확장됐다. 6종 기본 이미지(`social` 포함)와 13종 분위기 이미지 모두 실제 아트로 교체 완료.
이 문서는 "상황에 맞는 키워드로 실제 배경
아트(이미지/일러스트)를 만든다"는 목표를 위해, 이미 게임에 있는 키워드 체계를 어떻게 이미지
프롬프트로 연결할지 정리한다.

## 왜 재설계가 아니라 "연결"인가

이번 세션에서 서사 흐름 유도([04-ai-gamemaster-prompt.md](./04-ai-gamemaster-prompt.md) 참고)를
만들면서, 이미 배경 아트에 그대로 쓸 수 있는 키워드 축이 4개 쌓였다. 새로 뭔가 분석기를 만들 필요
없이, 이 축들을 이미지 프롬프트 템플릿에 연결하기만 하면 된다.

| 축 | 값 | 정의 위치 | 의미 |
|---|---|---|---|
| `SceneTag` | 도시/숲/시장/위험/사교/실내 (6종) | [backgroundThemes.ts](../../src/data/backgroundThemes.ts) | 지금 그라디언트 배경을 고르는 키. 상황 텍스트에서 키워드로 추론 |
| `SituationCategory` | 위기/생계/사교/수수께끼/공포/황당/호감(bond) (7종) | [situationSeeds.ts](../../src/data/situationSeeds.ts) | 서사 장르. 오프라인 폴백 시드와 `avoidRepeat` 판정에 이미 쓰이는 축 |
| `SceneMode` | 외출 / 거처 | [storyFlow.ts](../../src/engine/storyFlow.ts) | 실내외 여부 — 배경 구도(원경 vs 실내 공간)에 직결 |
| `StoryDirective.phase` | 정착기/성장기/격변기/수렴기/결말부 | [storyFlow.ts](../../src/engine/storyFlow.ts) | 이야기의 무게감 — 색감/조도 톤에 반영 가능 |

네 축을 조합하면 6×7×2×5 = 420가지 조합이 나오지만, 실제로 등장 빈도가 높은 조합은 훨씬 적다
(예: `danger`+`horror`+`정착기` 조합은 거의 안 나옴). 그래서 전량을 미리 만들기보다 **자주 나오는
조합부터 우선순위를 매겨 채워나가는** 접근을 권장한다 (Phase 1 참고).

## 프롬프트 설계 원칙

- **세계관 고정 프리픽스**: 모든 프롬프트 앞에 [01-world-setting.md](./01-world-setting.md)의 규칙을
  반영한 공통 접두어를 고정으로 붙인다. 예: `painterly illustration, pre-industrial fantasy setting,
  muted natural palette, no magic effects, no sci-fi elements, no modern technology`. 이렇게 하면
  카테고리별로 매번 "마법 금지"를 반복 명시하지 않아도 된다.
- **네거티브 프롬프트 공통화**: `no text, no watermark, no modern clothing, no futuristic elements`
  등도 고정 접두어처럼 관리해 모든 이미지의 톤을 통일한다.
- **톤은 `phase`가, 구도는 `SceneMode`가, 소재는 `SceneTag`+`SituationCategory`가 담당**하도록 역할을
  나눈다 — 한 축에 모든 걸 다 표현하려 하지 않는다.
  - `phase`: 정착기/성장기 → 밝고 안정된 색감, 격변기/결말부 → 어둡고 대비 강한 색감
  - `SceneMode`: 외출 → 원경/풍경 위주 구도, 거처 → 좁은 실내 구도
  - `SceneTag`+`category`: 실제 소재(숲/시장/위험한 골목/다정한 실내 등)

## 단계별 로드맵

### Phase 1 — 우선순위 매핑 테이블 (2026-08-03 확정, SceneTag 6종 전부 커버)

지금 코드는 `SceneTag` 6종(city/forest/market/danger/social/indoor) 단위로만 이미지를 고르므로,
당장은 이 6개만 채우면 된다(category/mode/phase 조합까지 세분화하는 건 나중에 필요해지면 확장).

**실측 우선순위**: offline 시드 40개 각각을 `inferSceneTag()`에 통과시켜 실제로 어떤 태그가
나오는지 세어본 결과 — `city`(기본값) 24개(60%), `indoor` 7개, `danger` 5개, `forest`/`market`/`social`
각 1~2개. `city`가 압도적으로 많은 건 사교/코미디/호감류 시드에 특정 키워드가 없어서이기도 하지만,
결정적으로 **`거처`(shelter 모드 시드 대부분에 쓰이는 단어)가 `indoor` 키워드 목록에서 빠져 있어서**다
— [backgroundThemes.ts](../../src/data/backgroundThemes.ts)의 `KEYWORD_TAGS`에 `거처`를 추가하면
`city`/`indoor` 분류가 더 정확해질 것으로 보임(아직 미적용, 로드맵 5번 참고).

모든 프롬프트 공통: `vertical portrait composition, 9:16 aspect ratio, key subject centered in frame`
(9:16 세로 프레임으로 고정된 앱 레이아웃에 맞춤, [App.tsx](../../App.tsx)의 `FRAME_ASPECT_RATIO` 참고),
해상도는 1080×1920 권장.

| SceneTag | 실측 빈도 | 프롬프트 키워드 |
|---|---|---|
| `city`(기본값) | 24/40 | `modest pre-industrial village exterior, dirt path between simple wooden and clay-daub houses, overcast daytime light, low wide composition with room for a small figure, calm neutral everyday mood, muted blue-grey tones` |
| `indoor` | 7/40 | `plain one-room dwelling interior, worn wooden furniture, a single small window, simple hearth, modest and slightly cramped, neutral daytime or dim evening light adaptable to mood, warm brown and grey tones` |
| `danger` | 5/40 | `narrow path at the edge of wilderness, tense atmosphere, a half-hidden figure or unclear silhouette in the distance, low visibility, tense stillness, desaturated cold tones with a hint of dread` |
| `forest` | 2/40 | `dark misty forest path, fog drifting between trunks, bare trees, wide distant shot, tense quiet atmosphere, cool desaturated green-grey tones` |
| `market` | 1/40 | `bustling pre-modern market street, wooden stalls with cloth and produce, worn cobblestones, warm afternoon sunlight, lively but grounded everyday tone, warm ochre and terracotta palette` |
| `social` | 1/40 | `modest village gathering at dusk, small group of villagers around a communal fire or long wooden table, simple benches, warm firelight glow against a darkening sky, close-knit but grounded everyday mood, wide low composition with room for a small figure joining the group, warm amber and dusky violet tones` |

모든 프롬프트 앞뒤에 아래 공통 프리픽스/네거티브를 붙여서 사용:
```
painterly illustration, pre-industrial fantasy setting, muted natural palette, no magic effects, no sci-fi elements, no modern technology.
[표의 키워드]
vertical portrait composition, 9:16 aspect ratio, key subject centered in frame.
no text, no watermark, no modern clothing, no futuristic elements.
```

### Phase 2 — 프롬프트 빌더 함수
`buildBackgroundPrompt({ sceneTag, category, mode, phase }): string` 형태의 순수 함수를
`src/engine/`에 추가. 상황 텍스트를 매번 다시 분석하지 않고, 이미 계산된 `storyDirective` +
`inferSceneTag` 결과만으로 조립 — 추가 AI 호출이나 텍스트 분석 비용이 들지 않는다.

### Phase 3 — 이미지 확보 방식 결정
| 방식 | 장점 | 단점 |
|---|---|---|
| **(a) 사전 생성 정적 에셋** (권장) | 런타임 비용 0원, 오프라인 폴백에서도 그대로 동작, 지연 없음 | 조합 수만큼 사전 제작 필요 (Phase 1 우선순위로 범위 조절) |
| (b) 런타임 이미지 생성 API 호출 | 조합 수 제한 없음 | 매 턴 비용·지연 발생, Worker에 이미지 API 프록시 추가 필요, 오프라인 폴백과 상충 |

이 프로젝트는 해커톤 **사전 과제**(완성도보다 실행력·비용 관리가 심사 포인트, [00-concept.md](./00-concept.md)
참고)이므로, 초기에는 **(a) 사전 생성 정적 에셋**을 권장한다. Phase 1에서 정한 우선순위 상위
조합만 먼저 채우고 나머지는 그라디언트로 자연스럽게 폴백시키면 된다.

### Phase 4 — BackgroundScene.tsx 통합 (2026-08-03 구현 완료)
SceneTag 6종 단일 이미지로 단순하게 시작했기 때문에, Phase 2(`buildBackgroundPrompt()` 동적 조합
함수)는 필요 없어져 생략했다 — 대신 Phase 1 표를 손으로 6장 프롬프트로 바로 확정했다. 실제 구현:

```ts
// src/components/BackgroundScene.tsx — 실제 구현
const BACKGROUND_IMAGES: Record<SceneTag, number> = {
  city: require('../../assets/backgrounds/city.png'),
  forest: require('../../assets/backgrounds/forest.png'),
  market: require('../../assets/backgrounds/market.png'),
  danger: require('../../assets/backgrounds/danger.png'),
  social: require('../../assets/backgrounds/social.png'),
  indoor: require('../../assets/backgrounds/indoor.png'),
};
// 그라디언트를 항상 먼저 그리고, 그 위에 이미지를 얹는다 — 이미지가 자리표시자(투명)이거나
// 로드에 실패해도 그라디언트가 항상 폴백으로 남는다.
```

기존 `SCENE_THEMES` 그라디언트는 폴백으로 계속 남아 있다 — 오프라인/이미지 로드 실패 시에도 배경이
비지 않도록.

### Phase 5 — 분위기(Mood) 소분류 (2026-08-04 확정)

SceneTag 6종만으로는 같은 장소(예: 거처)에서 벌어지는 다정한 장면과 싸움 장면이 같은 배경을
쓰게 되는 문제가 있다. 완전히 개별적인 배경(장면당 1장)은 조합이 너무 많아 비현실적이므로,
**희노애락을 확장한 5가지 분위기(mood) 축**을 SceneTag 위에 얹어 6×5로 소분류한다.

| 분위기 | 정의 | 주로 대응하는 `SituationCategory` |
|---|---|---|
| 희 (joy) | 따뜻하고 유쾌한 순간 | `bond`, `comedy` 일부 |
| 노 (anger) | 긴장된 말다툼, 대립 | `social`/`work`의 갈등형 |
| 애 (sorrow) | 고단함, 궁핍, 상실감 | `work` 대부분 |
| 락 (calm) | 특별할 것 없는 잔잔한 하루 — **현재 6장이 이 역할** | `social`/`work`의 무난한 쪽, 기본값 |
| 공포·긴장 (fear) | 오싹함, 위협감 — 전통 희노애락엔 없지만 이 게임엔 필수 | `danger`, `horror`, `mystery` |

`danger`/`forest`는 기존 Phase 1 프롬프트가 이미 "tense/dread" 톤이라 락=공포 상태나 마찬가지라
소분류 우선순위에서 제외했다. 실제로 분위기 차이가 크게 갈리는 곳(=지금 락 한 장으로 뭉뚱그려지는
곳) 위주로 6장만 우선 확정:

| 파일명 | SceneTag | 분위기 | 상황 예시 |
|---|---|---|---|
| `city_anger.png` | city | 노 | 취객 시비, 빚쟁이가 몰려와 소란 |
| `indoor_anger.png` | indoor | 노 | 동거인과의 말다툼 |
| `indoor_sorrow.png` | indoor | 애 | 궁핍, 도구 고장, 집세 독촉 |
| `indoor_fear.png` | indoor | 공포·긴장 | 벽 너머 소리, 한밤중 문 두드림 |
| `market_anger.png` | market | 노 | 도둑 의심, 장터 시비 |
| `social_anger.png` | social | 노 | 모임 중 말다툼 |

프롬프트 (공통 프리픽스/네거티브는 Phase 1과 동일, 아래는 중간 키워드만):

```
city_anger:    narrow village street at dusk, a tense confrontation between two figures with
               onlookers watching from a distance, raised voices implied through posture,
               cluttered wooden house fronts, harsh directional light and long shadows,
               agitated uneasy mood, muted red-brown and grey tones

indoor_anger:  cramped one-room dwelling interior, two silhouetted figures facing each other
               in a tense standoff, overturned or disturbed furniture, dim harsh lamplight
               casting sharp shadows, claustrophobic and confrontational mood, muted red and
               dark brown tones

indoor_sorrow: plain one-room dwelling interior, worn-out furniture and a broken tool or empty
               food containers on a table, a single dim window with grey overcast light, weary
               and quietly hopeless mood, desaturated cold grey-blue tones

indoor_fear:   plain one-room dwelling interior at night, a single flickering candle or dying
               hearth fire as the only light source, a shadowed wall or door taking visual
               focus, oppressive silence implied, tense dread atmosphere, near-black
               desaturated tones with a single warm light source

market_anger:  pre-modern market street, a tense confrontation near a wooden stall with
               scattered goods, onlooking merchants pausing their work, overcast harsh light,
               accusatory and uneasy mood, muted ochre and grey tones

social_anger:  small village gathering interrupted by a tense argument between two figures,
               others in the group stepping back or watching uneasily, dim evening firelight
               casting harsh shadows, awkward confrontational mood, muted amber and dark red
               tones
```

**2차 배치(2026-08-04, 후순위 희(joy) 계열 + 검토 중 발견한 추가 갭 3개)**:

| 파일명 | SceneTag | 분위기 | 상황 예시 |
|---|---|---|---|
| `city_joy.png` | city | 희 | 장터 인연 등 소소한 훈훈함 |
| `market_joy.png` | market | 희 | 흥정하며 훈훈함 |
| `social_joy.png` | social | 희 | 모임에서의 훈훈함 |
| `city_sorrow.png` | city | 애 | 도구 고장 등 궁핍(`sh-work-2`) — 실내 키워드가 없어 city로 떨어지는 work 시드용 |
| `danger_anger.png` | danger | 노 | 도적/맹수와 적극적으로 대치(기존 danger 기본이 "은은한 위협"이라 "정면 대치"는 결이 다름) |
| `forest_fear.png` | forest | 공포·긴장 | 낯선 발자국, 안개 낀 숲 |

```
city_joy:      modest village street in soft afternoon light, two figures sharing a warm
               friendly exchange near a doorway, gentle golden sunlight, relaxed unhurried
               everyday warmth, muted gold and soft blue tones

market_joy:    lively pre-modern market stall, a friendly haggling exchange between two
               figures with a small smile, baskets of goods and warm textiles, bright midday
               sunlight, cheerful grounded everyday mood, warm ochre and soft gold tones

social_joy:    small village gathering at dusk, warm laughter implied through relaxed
               postures around a fire, soft firelight glow, gentle sense of belonging and
               ease, warm amber and soft orange tones

city_sorrow:   narrow village street under grey overcast sky, a modest doorway with a notice
               or scrap of paper wedged in the frame, empty street, weary quiet hardship,
               desaturated cold grey-brown tones

danger_anger:  narrow mountain path, a tense direct standoff with a half-seen armed figure or
               wild beast blocking the way, close low framing emphasizing confrontation,
               harsh cold light, sharp adrenaline-charged mood, desaturated red-grey tones

forest_fear:   dense misty forest floor, an unnatural set of footprints or disturbed
               undergrowth catching the eye, thick fog swallowing the distance, unsettling
               stillness, cool desaturated green-grey tones with deep shadow
```

**3차 배치(2026-08-04, 실측으로 확인된 마지막 갭 1개)**: `od-horror-2`/`od-horror-3`/`sh-horror-2` 세 시드가
모두 실내 키워드가 없어 `city`로 떨어지면서 `fear` 무드 이미지가 없어 평범한 기본 이미지로 폴백되고
있던 것을 확인. 나머지 6×5 그리드 칸(`indoor_joy`, `market_sorrow`, `social_fear` 등)은 40개 오프라인
시드 중 어느 것도 해당 키워드 조합에 걸리지 않아 실측 근거가 없으므로 보류.

| 파일명 | SceneTag | 분위기 | 상황 예시 |
|---|---|---|---|
| `city_fear.png` | city | 공포·긴장 | 텅 빈 마을 어귀, 지켜보는 듯한 느낌, 다가오는 발소리 |

```
city_fear:     empty village street at night, a single distant figure or shadow half-glimpsed
               at the edge of visibility, unusually quiet with no other signs of life, faint
               moonlight or a lone dim lantern, unsettling watched feeling, desaturated cold
               blue-grey tones with deep shadow
```

**구현 완료(2026-08-04)**: `category`는 이미 매 시드/AI 응답에 있는 값이지만 `GameState`/`AITurnResponse`엔
현재 턴의 category가 별도로 노출되지 않아(스레드 연속용 `thread.category`만 있음) 백엔드/AI 프롬프트
스키마는 건드리지 않고, 기존 `inferSceneTag()`([backgroundThemes.ts](../../src/data/backgroundThemes.ts))와
동일한 방식으로 situation 텍스트 키워드 기반 `inferMood()`를 추가해 프론트에서만 처리했다.
[GameScreen.tsx](../../src/screens/GameScreen.tsx)에서 `inferMood(gameState.currentSituation)`을 계산해
`<BackgroundScene tag={sceneTag} mood={sceneMood}>`로 전달하고, `BackgroundScene.tsx`의
`MOOD_BACKGROUND_IMAGES`에 없는 (tag, mood) 조합은 자동으로 tag의 기본(락) 이미지로 폴백한다.
구현 중 `inferSceneTag`의 부분 문자열 매칭 함정(예: '적' 한 글자가 '규칙적'에도 매칭)이 실제로
`od-mystery-1` 시드를 `danger`로 잘못 분류하고 있는 걸 발견해 함께 고쳤다 — 자세한 내용은 아래
체크리스트 참고.

### Phase 6 — 새 SceneTag 4종 추가 (2026-08-04, 사용자 플레이테스트 피드백)

AI 게임마스터가 만드는 장면이 기존 6종(city/forest/market/danger/social/indoor)으로 다 안 덮이는
경우가 실제로 나왔다 — 감옥 탈출 스토리 라인에서 감방/면회실/계단/골목길 장면이 계속 `city`
기본 이미지로 떨어지고 있었다. `SceneTag`를 4종 늘렸다: `cell`(감방), `visitation`(면회실),
`stairs`(계단), `alley`(골목길). 키워드는 `danger` 등 넓은 무드 태그보다 먼저 검사해 장소가
구체적으로 특정되면 우선 매칭되게 했다([backgroundThemes.ts](../../src/data/backgroundThemes.ts)의
`KEYWORD_TAGS` 순서 참고).

세계관 규칙(전근대 문명, 현대 기술 없음)을 지키기 위해 면회실은 유리 칸막이가 아니라 창살/나무
격자로 묘사했다.

| 파일명 | SceneTag | 키워드 | 상황 예시 |
|---|---|---|---|
| `cell.png` | cell | 감방/독방/옥사/철창 | 좁은 감방, 차가운 돌바닥 |
| `visitation.png` | visitation | 면회실/면회 | 창살 너머로 대화하는 면회 장면 |
| `stairs.png` | stairs | 계단/층계 | 좁고 가파른 돌계단 |
| `alley.png` | alley | 골목 | 건물 사이 좁은 골목길 |

```
cell:          damp stone prison cell, rough-hewn walls, a small barred window letting in a
               thin shaft of light, sparse straw bedding in the corner, oppressive confined
               atmosphere, cold desaturated blue-grey tones

visitation:    bare stone visiting room split by a row of iron bars or a wooden lattice
               grille (no glass), two simple wooden stools facing each other across the
               divide, dim light from a high narrow window, quietly tense subdued mood, cold
               muted grey-blue tones

stairs:        narrow worn stone stairwell, steps disappearing into shadow above and below,
               a single shaft of light cutting across the steps, liminal transitional
               atmosphere, muted grey-brown tones

alley:         narrow gap between two close-set stone-and-timber buildings, high walls
               looming on both sides, dim light filtering in from the far end, faint sense
               of being boxed in, muted cool urban tones
```

**구현 완료(2026-08-04)**: `SceneTag` 유니온 타입, `SCENE_THEMES`, `KEYWORD_TAGS`,
[BackgroundScene.tsx](../../src/components/BackgroundScene.tsx)의 `BACKGROUND_IMAGES`까지 전부
갱신, 브라우저에서 4종 모두 정상 렌더링 확인. `cell`/`visitation`은 실제 아트로 교체 완료(2026-08-04).
`stairs`/`alley`는 아직 1x1 투명 PNG 자리표시자 — 제미니 이미지 생성 한도 초기화 후 이어서 제작 예정
(프롬프트는 위 표에 이미 확정돼 있음). 무드(Phase 5) 소분류는 아직 이 4종에 적용 안 함 — 필요해지면 추가.

## 다음 세션 체크리스트

- [x] Phase 1: 조합 우선순위 표 작성 — offline 시드 40개 실측 기반으로 SceneTag 6종 전부 확정(2026-08-03)
- [x] Phase 1: 공통 프리픽스/네거티브 프롬프트 문구 확정
- [x] Phase 4: `BackgroundScene.tsx`를 이미지 + 그라디언트 폴백 구조로 확장(2026-08-03) — 단, 6장 모두 아직 1x1 투명 PNG 자리표시자
- [x] **6장 실제 아트 제작** — `city`/`danger`/`forest`/`indoor`/`market`/`social` 전부 교체 완료(2026-08-04 확인)
- [x] `backgroundThemes.ts`의 `KEYWORD_TAGS`에 `거처` 키워드 추가해 `city`/`indoor` 오분류 줄이기(2026-08-04 적용)
- [x] Phase 5: 분위기(mood) 소분류 축 확정 — 희노애락 확장 5종, 우선순위 6장 프롬프트 확정(2026-08-04)
- [x] Phase 5: `inferMood()` 구현 + `BackgroundScene.tsx`를 `SceneTag`+`SceneMood` 조합으로 확장(2026-08-04). `MOOD_BACKGROUND_IMAGES`에 없는 (tag, mood) 조합은 자동으로 해당 tag의 기본(락) 이미지로 폴백. 우선순위 6장은 아직 1x1 투명 PNG 자리표시자 — 실제 아트로 교체하면 코드 변경 없이 반영됨
- [x] 구현 중 발견: `KEYWORD_TAGS`의 한 글자 키워드(`피`, `적`)가 `피하다`/`규칙적`처럼 무관한 단어에도 부분 문자열로 걸려 오분류를 일으킴(`od-mystery-1`이 `forest` 대신 `danger`로 잘못 분류되는 등). `피`→`핏자국`/`피투성이`/`유혈`로, `적` 단독 키워드는 제거(도적/산적/습격이 이미 커버)로 교체(2026-08-04)
- [x] Phase 5 2차 배치: `city_joy`/`market_joy`/`social_joy`/`city_sorrow`/`danger_anger`/`forest_fear` 프롬프트 확정 및 `MOOD_BACKGROUND_IMAGES`에 연결(2026-08-04) — `city_sorrow`는 `sh-work-2`(도구 고장) 실측으로 확인된 실사용 조합
- [x] Phase 5 3차 배치: `city_fear` 프롬프트 확정 및 연결(2026-08-04) — `od-horror-2`/`od-horror-3`/`sh-horror-2` 3개 시드 실측으로 확인된 마지막 갭. 나머지 그리드 칸은 실측 근거 없어 보류
- [x] Phase 5: 우선순위 13장(`city_anger`/`city_joy`/`city_sorrow`/`city_fear`/`indoor_anger`/`indoor_sorrow`/`indoor_fear`/`market_anger`/`market_joy`/`social_anger`/`social_joy`/`danger_anger`/`forest_fear`) 실제 아트 제작 완료, `assets/backgrounds/`에 반영 및 브라우저에서 렌더링 확인(2026-08-04)
- [x] Phase 6: `SceneTag`에 `cell`/`stairs`/`alley`/`visitation` 4종 추가, 코드 전체(`SCENE_THEMES`/`KEYWORD_TAGS`/`BACKGROUND_IMAGES`) 반영 및 브라우저 렌더링 확인(2026-08-04)
- [x] Phase 6: `cell`/`visitation` 실제 아트 제작 완료(2026-08-04 확인) — `stairs`/`alley`는 아직 1x1 투명 PNG 자리표시자, 제미니 한도 초기화 후 이어서 제작 예정
- [ ] Phase 6: 새 4종에도 Phase 5 무드 소분류 적용할지는 실제 플레이 빈도 보고 나중에 결정
- [ ] 조합이 늘어날 때마다 이 문서의 우선순위 표도 함께 갱신
