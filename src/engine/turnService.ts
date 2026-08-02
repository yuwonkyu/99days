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
 */
export async function getNextTurn(context: TurnContext, usedSeedIds: string[] = []): Promise<TurnResult> {
  try {
    const response = await requestAiTurn(context);
    return { response: clampTurnResponse(response), source: 'ai' };
  } catch (err) {
    if (!(err instanceof AiUnavailableError)) throw err;
    const { response, usedSeedId, resetUsedSeeds } = generateOfflineTurn(context, usedSeedIds);
    return { response: clampTurnResponse(response), source: 'offline', usedSeedId, resetUsedSeeds };
  }
}
