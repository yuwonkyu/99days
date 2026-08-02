# 진행 상황

| 날짜 | 내용 |
|---|---|
| 2026-07-29 | 저장소 초기화(Expo+TS, web export 확인), 설계 문서(00~06) 작성, 인수인계 문서 기반 아키텍처 확정(Cloudflare Workers AI 프록시 + 오프라인 폴백) |
| 2026-07-30 | Expo+TS 스캐폴딩(타입/데이터/엔진/화면/컴포넌트), Cloudflare Worker AI 프록시 스캐폴드 구현 |
| 2026-07-31 | Cloudflare Worker KV 네임스페이스 id 연동, 웹 게임 UI를 모바일 세로(9:16) 컬럼으로 중앙 정렬 고정 |
| 2026-08-02 | GitHub Pages/Worker 배포 상태 점검(정상 동작 확인), README 플레이 링크 반영, AI 토큰 사용량 절감(프롬프트 분량 제한, `max_tokens` 축소, 컨텍스트 축소) |
| 2026-08-02 | 실플레이 중 15~21일 구간 상황 반복/정체 버그 발견 → `storyFlow.ts`(단계/외출·거처 흐름 유도), 오프라인 폴백 템플릿 확장(6→9, 거처형 보강), 응답 글자수 하드 캡(`textLimits.ts`)으로 대응 |
| 2026-08-02 | 오프라인 폴백을 조합형 콘텐츠 라이브러리로 재구축: 시드 36개(캐릭터당 ~152종 렌더), 성격/직업/체력/행운/단계/직전 로그 기반 가중 선택(`situationSelector.ts`), 선택지 lean→결과 확률→다음 상황 카테고리로 이어지는 확률적 흐름, 선택지 개수 2~4 가변화, 엔딩 3→57개(`endings.ts`/`endingSelector.ts`). 999개 목표는 장기 로드맵으로 이관 |
| 2026-08-02 | Worker 프롬프트/오프라인 라이브러리 배포, `ALLOWED_ORIGIN`을 GitHub Pages 도메인으로 제한, main 머지 및 GitHub Pages 자동 재배포 완료 |
| 2026-08-02 | 서사 흐름 피드백 반영: outcome=전날 요약→situation=자연스러운 오늘 도입부로 프롬프트 재정비, `storyDirective.timeSkip`(며칠~몇 년 시간 압축 서술, 12% 확률)과 `stat_changes.AGE` 추가, 오프라인 라이브러리에 `bond`(호감/우정/애정) 카테고리 신설(36→40 시드, ~184종 렌더). 배경 아트 키워드 프롬프트 로드맵을 [07-background-art-prompts.md](./07-background-art-prompts.md)로 별도 작성(설계만, 미구현) |
| 2026-08-02 | 스크린샷 피드백 반영: 오프라인 폴백이 "대가를 치러야 했다"처럼 결과를 뭉뚱그리던 것을 lean별 구체적 문구로 교체, 하루↔하루 사이에 아무 연결 문구 없이 시드가 점프하던 문제를 `buildTransitionPrefix()`("다음 날," / timeSkip 문구)로 완화 |
| 2026-08-03 | "결과가 어떻게 끝난 건지 모르겠다"는 후속 피드백 반영: 선택지를 우리 시드로 역추적해(`inferChoiceCategory`) 카테고리별 구체적 결말(`CATEGORY_RESOLUTIONS`)로 교체, 시드 자체 시간대 표현과 "다음 날,"이 겹치는 중복 제거. 스탯 변화(HP/STR/INT/AGI/LUK/AGE)를 `StatChangeBadges` 컴포넌트로 결과 옆에 시각화 |
| 2026-08-03 | "같은 상황이 반복해서 나온다" 피드백 반영: `GameState.usedSeedIds`로 오프라인 폴백이 이미 보여준 시드를 캐릭터별로 기억해 제외, 해당 모드(외출/거처)의 시드를 전부 소진하면 그때만 순환 리셋(`pickWeightedSeed`의 `wasReset`) |
| 2026-08-03 | 99일 완주 1판에 AI 호출이 최대 ~100회 필요함을 확인 — `DAILY_LIMIT`을 50→120으로 상향해 후반부도 AI로 이어지게 함, Worker 재배포. 이후 세션부터는 매 작업 끝에 확인 없이 바로 main 머지까지 진행하기로 함 |

앞으로 진행 시 이 표에 날짜/내용을 추가한다. 다음 할 일은 [ROADMAP.md](./ROADMAP.md) 참고.
