# 00. 컨셉

## 배경 / 목적

이 게임은 NHN 'NAN 2026' 게임×AI 해커톤 **사전 과제(서류 심사용)** 제출물이다.

- 제출 마감: 2026-08-10
- 필수 제출물: ① 웹 브라우저에서 바로 플레이 가능한 빌드(GitHub Pages) + 전체 소스코드 ② 30~60초 플레이 영상(YouTube) ③ 게임 소개 PDF ④ AI 활용 기술 문서 PDF
- 개발 기간 목표: 약 7일
- 이 사전 과제는 본선(9/4~9/6) 출품작이 아니다. 서류 심사에서 "실행력 + AI 활용 방식"을 보여주는 것이 목적이며, 완성도보다 우선한다.
- 플랫폼: 웹 브라우저 전용 (Expo web export → GitHub Pages 배포)
- 스택: Expo (React Native) + TypeScript, 백엔드는 Cloudflare Workers(AI 프록시)만 사용

## 게임 개요

- 제목(가칭): **99days**
- 장르: 텍스트 기반 생존·성장 시뮬레이션 (BitLife식 랜덤 인생 생성 + AI Dungeon식 실시간 LLM 서사 생성의 하이브리드)
- 코어 루프: 랜덤 생성된 캐릭터가 매일 AI가 그 순간의 상태를 반영해 만들어주는 상황을 마주함 → 선택 → 결과/스탯 변화 → 다음 날. 정해진 엔딩 없이 계속 진행되며, 사망하거나 포기한 캐릭터는 로컬에 저장되어 이후 플레이에 과거 인물(소문/조연/유산)로 재등장한다.
- 세계관은 개발자 본인이 집필 중인 오리지널 소설을 기반으로 한다 (외부 IP 아님, 저작권 문제 없음).

세부 세계관 규칙은 [01-world-setting.md](./01-world-setting.md), 스탯 시스템은 [02-stats-system.md](./02-stats-system.md), 캐릭터 생성은 [03-character-generation.md](./03-character-generation.md), AI 게임마스터 프롬프트는 [04-ai-gamemaster-prompt.md](./04-ai-gamemaster-prompt.md), UI/UX는 [05-ui-ux.md](./05-ui-ux.md), 계승 시스템은 [06-legacy-system.md](./06-legacy-system.md)를 참고.
