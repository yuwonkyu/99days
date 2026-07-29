import AsyncStorage from '@react-native-async-storage/async-storage';
import { AITurnResponse, TurnContext } from '../types/game';

const WORKER_URL = process.env.EXPO_PUBLIC_AI_WORKER_URL;
const SESSION_KEY = '99days:sessionId';
const REQUEST_TIMEOUT_MS = 15000;

export class AiUnavailableError extends Error {}

async function getSessionId(): Promise<string> {
  const existing = await AsyncStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  await AsyncStorage.setItem(SESSION_KEY, id);
  return id;
}

function isValidAITurnResponse(value: unknown): value is AITurnResponse {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  if (typeof v.situation !== 'string' || v.situation.trim().length === 0) return false;
  if (!Array.isArray(v.choices) || v.choices.length < 2 || v.choices.length > 4) return false;
  if (!v.choices.every((c) => typeof c === 'string' && c.trim().length > 0)) return false;
  if (typeof v.day_summary !== 'string') return false;
  if (v.outcome !== undefined && typeof v.outcome !== 'string') return false;
  if (typeof v.stat_changes !== 'object' || v.stat_changes === null) return false;
  return true;
}

/**
 * Calls the Cloudflare Worker AI proxy (see worker/src/index.ts). The worker owns
 * the actual Anthropic API key and system prompt; the client only ever sends the
 * turn context (character/day/legacy state), never a secret.
 */
export async function requestAiTurn(context: TurnContext): Promise<AITurnResponse> {
  if (!WORKER_URL) {
    throw new AiUnavailableError('EXPO_PUBLIC_AI_WORKER_URL is not configured');
  }

  const sessionId = await getSessionId();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${WORKER_URL.replace(/\/$/, '')}/turn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, turnContext: context }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new AiUnavailableError(`Worker responded with status ${res.status}`);
    }

    const data = await res.json();
    if (!isValidAITurnResponse(data)) {
      throw new AiUnavailableError('Worker response failed schema validation');
    }
    return data;
  } catch (err) {
    if (err instanceof AiUnavailableError) throw err;
    throw new AiUnavailableError(`AI request failed: ${(err as Error).message}`);
  } finally {
    clearTimeout(timeout);
  }
}
