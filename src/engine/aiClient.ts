import AsyncStorage from '@react-native-async-storage/async-storage';
import { AITurnResponse, ThreadUpdate, TurnContext } from '../types/game';

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

/**
 * Only situation/choices are load-bearing for rendering a turn — everything else
 * (stat_changes, day_summary) has a safe default. The Worker forces tool_choice
 * on `emit_turn`, but max_tokens truncation still regularly drops trailing
 * fields (usually day_summary, sometimes stat_changes too) from otherwise-good
 * responses; rejecting those outright wasted the AI call and fell back to the
 * offline generator far more often than an actual network/schema failure would.
 */
function isValidAITurnResponse(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  if (typeof v.situation !== 'string' || v.situation.trim().length === 0) return false;
  if (!Array.isArray(v.choices) || v.choices.length < 2 || v.choices.length > 4) return false;
  if (!v.choices.every((c) => typeof c === 'string' && c.trim().length > 0)) return false;
  if (v.outcome !== undefined && typeof v.outcome !== 'string') return false;
  return true;
}

const THREAD_STATUSES = new Set(['none', 'continuing', 'resolved']);

/** Same truncation tolerance as the rest of the response — a malformed/missing thread just means "no thread", never a rejected turn. */
function normalizeThread(v: unknown): ThreadUpdate | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const t = v as Record<string, unknown>;
  if (typeof t.status !== 'string' || !THREAD_STATUSES.has(t.status)) return undefined;
  if (t.status === 'continuing' && (typeof t.summary !== 'string' || !t.summary.trim())) return undefined;
  return {
    status: t.status as ThreadUpdate['status'],
    summary: typeof t.summary === 'string' ? t.summary : undefined,
    category: typeof t.category === 'string' ? t.category : undefined,
  };
}

function normalizeAITurnResponse(v: Record<string, unknown>): AITurnResponse {
  const outcome = typeof v.outcome === 'string' ? v.outcome : undefined;
  const situation = v.situation as string;
  const daySummarySource = outcome ?? situation;
  return {
    situation,
    choices: v.choices as string[],
    outcome,
    stat_changes: typeof v.stat_changes === 'object' && v.stat_changes !== null ? (v.stat_changes as AITurnResponse['stat_changes']) : {},
    day_summary: typeof v.day_summary === 'string' ? v.day_summary : daySummarySource,
    thread: normalizeThread(v.thread),
  };
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
    return normalizeAITurnResponse(data);
  } catch (err) {
    if (err instanceof AiUnavailableError) throw err;
    throw new AiUnavailableError(`AI request failed: ${(err as Error).message}`);
  } finally {
    clearTimeout(timeout);
  }
}
