import { Character } from './character';
import { LegacyMention } from './legacy';

export const TOTAL_DAYS = 99;

export interface StatDelta {
  STR?: number;
  INT?: number;
  AGI?: number;
  LUK?: number;
  HP?: number;
}

/**
 * Shape returned by both the AI game master (via the Cloudflare Worker) and
 * the offline fallback generator. `outcome`/`stat_changes` describe the result
 * of the choice made on the previous day; they are absent on the very first
 * call of a new character's life (Day 1 has no prior choice to resolve).
 */
export interface AITurnResponse {
  situation: string;
  choices: string[];
  outcome?: string;
  stat_changes: StatDelta;
  day_summary: string;
}

export interface TurnContext {
  character: Character;
  day: number;
  totalDays: number;
  recentDayLogs: string[];
  legacyMentions: LegacyMention[];
  chosenChoice?: string;
}

export interface GameState {
  character: Character;
  day: number;
  dayLogs: string[];
  currentSituation: string;
  currentChoices: string[];
  lastOutcome?: string;
  lastReturnSummary?: string;
  lastPlayedAt: number;
  isEnded: boolean;
}
