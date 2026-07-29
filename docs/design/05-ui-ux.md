# 05. UI/UX 요구사항

- 전체화면 배경(상황 태그별 색상/그라디언트 테마, 초기엔 5~6종 — 도시/숲/시장/전투위험/사교/실내 등) + 그 위에 반투명 텍스트 패널로 상황 → 선택 → 결과 진행. 컴포넌트: `src/components/BackgroundScene.tsx`.
- 상단 고정 UI: Day 카운터 + 진행 바 (예: "Day 23/99"). 컴포넌트: `src/components/DayProgressBar.tsx`.
- 상시 접근 가능한 상태 아이콘 → 탭하면 스탯/체력/소지품/신상정보 패널 오픈. 컴포넌트: `src/screens/StatusPanel.tsx`.
- **복귀 UX (중요)**: 며칠 쉬다 들어와도 맥락을 알 수 있도록, 재접속 시 "그동안 요약" 한 줄(day_summary 누적)을 보여주고 현재 상태 패널과 함께 노출. 컴포넌트: `src/components/ReturningSummaryBanner.tsx`.
- 캐릭터 생성 화면: 이름 입력 + 랜덤 이름 버튼, 스탯은 자동 롤(생성된 스탯을 미리보기로 보여줌). 화면: `src/screens/CharacterCreationScreen.tsx`.
- 선택지 UI: 2~4개 버튼 목록, 자유행동 여지가 있는 경우 텍스트 입력도 허용(1차 스코프에서는 버튼 선택 우선, 자유입력은 여유 있으면 추가). 컴포넌트: `src/components/ChoiceList.tsx`.
