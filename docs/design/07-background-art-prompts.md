# 07. 상황 키워드 기반 배경 아트 — 프롬프트 로드맵

**상태(2026-08-03 갱신): 코드 연결 완료, 실제 아트는 아직 자리표시자.** [BackgroundScene.tsx](../../src/components/BackgroundScene.tsx)가
`assets/backgrounds/{tag}.png` 6장을 그라디언트 위에 얹는 구조로 바뀌었고, 지금은 6장 모두 1x1 투명
PNG라 화면상으로는 이전과 차이가 없다. 아래 Phase 1 표의 프롬프트로 Gemini 등에서 실제 아트를
만들어 같은 파일명으로 덮어쓰면 코드 변경 없이 바로 반영된다. 이 문서는 "상황에 맞는 키워드로 실제 배경
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
| `social` | 1/40 | (아직 미작성 — 실측 빈도가 낮아 우선순위 밀림. 잔치/모임/술집 장면 필요 시 추가) |

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

## 다음 세션 체크리스트

- [x] Phase 1: 조합 우선순위 표 작성 — offline 시드 40개 실측 기반으로 SceneTag 6종 전부 확정(2026-08-03)
- [x] Phase 1: 공통 프리픽스/네거티브 프롬프트 문구 확정
- [x] Phase 4: `BackgroundScene.tsx`를 이미지 + 그라디언트 폴백 구조로 확장(2026-08-03) — 단, 6장 모두 아직 1x1 투명 PNG 자리표시자
- [ ] **6장 실제 아트 제작** (Gemini 등으로 생성 후 `assets/backgrounds/`에 동일 파일명으로 교체 — 코드 변경 불필요)
- [ ] `backgroundThemes.ts`의 `KEYWORD_TAGS`에 `거처` 키워드 추가해 `city`/`indoor` 오분류 줄이기(위 표의 실측 결과 참고, 아직 미적용)
- [ ] `social` 태그 프롬프트 아직 미작성(실측 빈도 낮아 후순위) — 잔치/모임/술집 장면이 자주 나오게 되면 추가
- [ ] SceneTag 6종만으로는 부족하다고 느껴지면(예: `indoor`를 bond/danger용으로 세분화) 그때 Phase 2(`buildBackgroundPrompt()`)로 category/mode까지 확장 고려
- [ ] 조합이 늘어날 때마다 이 문서의 우선순위 표도 함께 갱신
