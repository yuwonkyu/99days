import { AITurnResponse, TurnContext } from '../types/game';
import { requestAiTurn, AiUnavailableError } from './aiClient';
import { generateOfflineTurn } from './offlineGenerator';
import { clampTurnResponse } from './textLimits';

export type TurnSource = 'ai' | 'offline';

export interface TurnResult {
  response: AITurnResponse;
  source: TurnSource;
  /** offline 경로일 때만 채워짐 — GameState.usedSeedIds 갱신용. */
  usedSeedId?: string;
  resetUsedSeeds?: boolean;
}

/**
 * 2026-08-06 사용자 피드백: AI 요금 부담이 커서 99일 중 AI 생성 비중을 10% 이하로 낮추고 싶다는
 * 요청 — 이전에는 매 턴 AI를 먼저 시도하고 실패할 때만 오프라인으로 폴백했지만(1판 완주에 최대
 * ~100회 호출), 그 방식 자체가 비용을 좌우하는 구조였다. 이제는 매 턴 이 확률로만 AI 시도 여부를
 * 먼저 굴리고, 당첨되지 않으면 네트워크 요청조차 하지 않고 바로 오프라인 생성기로 간다 — 오프라인
 * 생성기는 "장애 시에만 쓰는 열화판"이 아니라 그 자체로 제대로 만든 1급 경로이므로 이렇게 써도
 * 품질이 크게 떨어지지 않는다(콘텐츠 다양성은 별도로 계속 확충 중).
 *
 * 2026-08-06 추가: 해커톤 심사 기간 동안은 심사위원이 짧은 세션에서도 AI 게임마스터를 실제로
 * 볼 확률을 높이고 싶어 10%→15%로 소폭 상향. Worker의 일일 호출 상한(120회, wrangler.toml)이
 * 여전히 비용 폭주에 대한 서버 사이드 안전판으로 남아 있으므로, 이 값은 그 예산을 얼마나 빨리
 * 쓰느냐만 조절할 뿐 상한 자체를 없애지 않는다.
 */
const AI_ATTEMPT_RATE = 0.15;

/**
 * 당첨된 턴에 한해 AI 게임마스터를 시도하고, 실패하면(또는 애초에 당첨되지 않았으면) 로컬 오프라인
 * 생성기로 대체한다. See docs/design/04-ai-gamemaster-prompt.md.
 *
 * activeThread가 열려 있는 상태로 AI를 시도했다가 실패하면 한 번 재시도한다. 오프라인 생성기는
 * 스레드의 구체적 인물/장소를 이어 쓸 수 없어(offlineGenerator.ts의 buildThreadClosurePrefix)
 * 항상 그 스레드를 강제로 닫고 무관한 새 시드로 넘어가는데, 일시적인 오류 한 번 때문에 진행 중인
 * 이야기를 끊기엔 아깝기 때문이다. (다만 AI 시도 자체가 이제 10%로 줄었으므로, 스레드가 열려도
 * 다음 턴에 대개는 AI가 아예 시도되지 않아 자연스럽게 닫히는 경우가 많아졌다 — 대화가 계속 길게
 * 이어지기보다 하루 단위로 결론이 나길 바란다는 피드백과도 방향이 맞는다.)
 */
export async function getNextTurn(context: TurnContext, usedSeedIds: string[] = []): Promise<TurnResult> {
  if (Math.random() < AI_ATTEMPT_RATE) {
    try {
      const response = await requestAiTurn(context);
      return { response: clampTurnResponse(response), source: 'ai' };
    } catch (err) {
      if (!(err instanceof AiUnavailableError)) throw err;
      if (context.activeThread) {
        try {
          const retryResponse = await requestAiTurn(context);
          return { response: clampTurnResponse(retryResponse), source: 'ai' };
        } catch (retryErr) {
          if (!(retryErr instanceof AiUnavailableError)) throw retryErr;
        }
      }
    }
  }
  const { response, usedSeedId, resetUsedSeeds } = generateOfflineTurn(context, usedSeedIds);
  return { response: clampTurnResponse(response), source: 'offline', usedSeedId, resetUsedSeeds };
}
