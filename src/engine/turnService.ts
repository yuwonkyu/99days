import { AITurnResponse, TurnContext } from '../types/game';
import { requestAiTurn, AiUnavailableError } from './aiClient';
import { generateOfflineTurn } from './offlineGenerator';

export type TurnSource = 'ai' | 'offline';

export interface TurnResult {
  response: AITurnResponse;
  source: TurnSource;
}

/**
 * Tries the live AI game master first; falls back to the local offline
 * generator if the Worker/Anthropic call fails for any reason (not deployed,
 * network error, rate limited, schema mismatch). See docs/design/04-ai-gamemaster-prompt.md.
 */
export async function getNextTurn(context: TurnContext): Promise<TurnResult> {
  try {
    const response = await requestAiTurn(context);
    return { response, source: 'ai' };
  } catch (err) {
    if (!(err instanceof AiUnavailableError)) throw err;
    return { response: generateOfflineTurn(context), source: 'offline' };
  }
}
