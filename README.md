# 99days

텍스트 기반 생존·성장 시뮬레이션. 랜덤으로 태어난 인물이 하루하루 AI 게임마스터가 즉석에서 만들어주는
상황을 마주하며 99일을 살아간다. 정해진 엔딩은 없다 — 죽거나 포기한 인물은 기록으로 남아 다음 삶에
조연/소문으로 다시 등장한다.

NHN 'NAN 2026' 게임×AI 해커톤 **사전 과제** 제출물입니다. 전체 기획 배경과 세계관/스탯/AI 프롬프트/UX/
계승 시스템 설계는 [docs/design](./docs/design)에 정리되어 있습니다.

## 플레이

- **플레이 링크**: https://yuwonkyu.github.io/99days/
- **플레이 방법**: 캐릭터 생성 화면에서 이름을 입력하거나 🎲 버튼으로 랜덤 이름을 뽑고, "이 삶을 시작한다"를
  누르면 시작. 매일 제시되는 상황에서 선택지를 고르면 다음 날로 넘어간다. 우측 상단 "상태" 버튼으로 스탯/
  체력/소지품을 언제든 확인할 수 있고, 그 안에서 "이 삶을 포기한다"를 선택해 삶을 끝낼 수도 있다.
- **종료 조건**: 체력이 0이 되거나(사망), 99일을 모두 채우거나, 플레이어가 직접 포기하면 그 캐릭터의 삶이
  끝나고 기록으로 남는다. 이후 새 캐릭터를 시작하면 그 기록이 세계 속 소문/조연으로 다시 등장할 수 있다.

## 로컬 실행

```bash
npm install
npm run web
```

AI 게임마스터를 실제로 체험하려면 Cloudflare Worker 프록시를 배포하고 `EXPO_PUBLIC_AI_WORKER_URL`을
설정해야 합니다 (아래 "AI 연동 설정" 참고). 설정하지 않아도 게임은 로컬 오프라인 폴백 생성기로 항상
플레이할 수 있습니다.

## AI 연동 설정 (Cloudflare Worker)

이 게임은 백엔드 없이 GitHub Pages에 정적으로 배포되지만, 누구나(심사위원 포함) 별도 키 입력 없이
바로 플레이할 수 있어야 합니다. 그래서 실제 Anthropic API 키는 개발자 본인이 Cloudflare Worker의
secret으로만 보관하고, 프론트엔드는 이 Worker를 통해서만 AI를 호출합니다. Worker가 배포되어 있지
않거나 응답에 실패하면 로컬 오프라인 폴백 생성기가 자동으로 대신 이야기를 생성합니다.

설정 단계는 [worker/README.md](./worker/README.md)를 참고하세요 (Anthropic 키 발급 → Cloudflare
로그인 → KV 생성 → secret 저장 → 배포 → `EXPO_PUBLIC_AI_WORKER_URL` 연결까지 커맨드 그대로 따라
하면 됩니다).

## 배포 (GitHub Pages)

`.github/workflows/deploy.yml`이 `main` 브랜치 푸시 시 자동으로 `expo export --platform web` 결과를
GitHub Pages에 배포합니다.

1. 저장소 Settings → Pages → Source를 "GitHub Actions"로 설정.
2. (AI 연동을 쓰려면) Settings → Secrets and variables → Actions → Variables에 
   `EXPO_PUBLIC_AI_WORKER_URL` 리포지토리 변수 추가.
3. `main`에 푸시하면 자동 배포되고, `https://<github-user>.github.io/99days/`에서 플레이 가능
   (프로젝트 페이지 서브패스는 `app.json`의 `experiments.baseUrl`에 이미 반영되어 있음).

## 리포지토리 구조

```
99days/
  App.tsx                  # 화면 전환(캐릭터 생성 ↔ 게임) 상태 머신
  src/
    types/                  # Character, GameState, LegacyRecord 등 타입
    data/                   # 지역/직업/이름/성격/배경 테마 데이터
    engine/                 # 스탯 계산, 캐릭터 생성, 저장소, AI 프롬프트/클라이언트, 오프라인 폴백
    screens/                # 캐릭터 생성, 게임, 상태 패널
    components/             # 배경, Day 진행바, 선택지, 복귀 요약 배너
  worker/                   # Cloudflare Worker (AI 프록시) — worker/README.md 참고
  docs/design/              # 세계관/스탯/캐릭터생성/AI프롬프트/UI/계승 시스템 설계 문서
  .github/workflows/        # GitHub Pages 배포 워크플로우
```

## 제출 자료

- AI 활용 기술 문서 관련 원문/모델 정보: [docs/design/04-ai-gamemaster-prompt.md](./docs/design/04-ai-gamemaster-prompt.md)
- 진행 기록: [docs/design/PROGRESS.md](./docs/design/PROGRESS.md)
