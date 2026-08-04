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
 * Tries the live AI game master first; falls back to the local offline
 * generator if the Worker/Anthropic call fails for any reason (not deployed,
 * network error, rate limited, schema mismatch). See docs/design/04-ai-gamemaster-prompt.md.
 *
 * When an activeThread is open, one retry happens before giving up on the AI. The offline
 * generator can't continue a thread's specific people/places (see offlineGenerator.ts's
 * buildThreadClosurePrefix) — it always forcibly resolves the thread and jumps to an unrelated
 * seed, which reads as the story randomly jumping tracks mid-arc. A single transient blip (one
 * dropped request, one rate-limit) shouldn't be enough to sever an in-progress story; a plain
 * day-to-day turn with no thread to lose falls back immediately as before.
 */
export async function getNextTurn(context: TurnContext, usedSeedIds: string[] = []): Promise<TurnResult> {
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
    const { response, usedSeedId, resetUsedSeeds } = generateOfflineTurn(context, usedSeedIds);
    return { response: clampTurnResponse(response), source: 'offline', usedSeedId, resetUsedSeeds };
  }
}
