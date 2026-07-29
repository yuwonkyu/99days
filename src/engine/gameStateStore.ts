import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameState } from '../types/game';

const GAME_STATE_KEY = '99days:currentGame';

/** Doc 05: show a "그동안 요약" banner if the player has been away this long. */
export const RETURN_THRESHOLD_MS = 1000 * 60 * 60 * 3;

export async function saveGameState(state: GameState): Promise<void> {
  await AsyncStorage.setItem(GAME_STATE_KEY, JSON.stringify(state));
}

export async function loadGameState(): Promise<GameState | null> {
  const raw = await AsyncStorage.getItem(GAME_STATE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GameState;
  } catch {
    return null;
  }
}

export async function clearGameState(): Promise<void> {
  await AsyncStorage.removeItem(GAME_STATE_KEY);
}

export function buildReturnSummary(state: GameState): string | null {
  const awayMs = Date.now() - state.lastPlayedAt;
  if (awayMs < RETURN_THRESHOLD_MS || state.dayLogs.length === 0) return null;
  const recent = state.dayLogs.slice(-3);
  return `그동안의 이야기: ${recent.join(' ')}`;
}
