# 07. 상황 키워드 기반 배경 아트 — 프롬프트 로드맵

**상태: 설계 로드맵만. 아직 이미지 생성/에셋 코드는 구현하지 않았다.** 지금은 [BackgroundScene.tsx](../../src/components/BackgroundScene.tsx)가
`SceneTag` 6종에 대응하는 단색 그라디언트만 보여준다. 이 문서는 "상황에 맞는 키워드로 실제 배경
아트(이미지/일러스트)를 만든다"는 다음 목표를 위해, 이미 게임에 있는 키워드 체계를 어떻게 이미지
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

### Phase 1 — 우선순위 매핑 테이블 작성 (설계만, 코드 없음)
자주 나오는 조합부터 순서를 매기고, 조합별로 영어 이미지 프롬프트 키워드를 손으로 작성한 표를
만든다. 예:

| SceneTag | Category | Mode | 프롬프트 키워드 예시 |
|---|---|---|---|
| forest | horror | outdoor | `dark misty forest, fog, bare trees, no color saturation, eerie silence` |
| market | work | outdoor | `bustling pre-modern market street, stalls, warm afternoon light` |
| indoor | bond | shelter | `small warm cottage room, soft candlelight, two figures in quiet conversation` |

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

### Phase 4 — BackgroundScene.tsx 통합
이미지 에셋이 있으면 이미지를, 없으면 지금처럼 그라디언트를 보여주는 우선순위 로직으로 확장:

```ts
// 개념 스케치 — 아직 구현 안 함
const image = BACKGROUND_IMAGES[key(sceneTag, category, mode)];
return image ? <ImageBackground source={image} ... /> : <LinearGradient ... />;
```

기존 `SCENE_THEMES` 그라디언트는 폴백으로 계속 남겨둔다 — 오프라인/이미지 로드 실패 시에도 배경이
비지 않도록.

## 다음 세션 체크리스트

- [ ] Phase 1: 조합 우선순위 표 작성 (플레이 로그 쌓이면 실제 등장 빈도로 우선순위 조정)
- [ ] Phase 1: 공통 프리픽스/네거티브 프롬프트 문구 확정
- [ ] Phase 2: `buildBackgroundPrompt()` 함수 구현
- [ ] Phase 3: 정적 에셋 제작/수급 방법 결정 (이미지 생성 도구 선택 포함)
- [ ] Phase 4: `BackgroundScene.tsx`를 이미지 우선 + 그라디언트 폴백 구조로 확장
- [ ] 조합이 늘어날 때마다 이 문서의 우선순위 표도 함께 갱신
