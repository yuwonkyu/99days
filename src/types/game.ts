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

/** 하루의 큰 활동 성격 — Doc 04: 반복 방지/흐름 유도용 힌트. `외출`(여정/순찰/사냥/교역/탐색) vs `거처`(방어/은신/은폐/거주/피난). */
export type SceneMode = 'outdoor' | 'shelter';

/**
 * 매 턴 AI/오프라인 생성기에 함께 전달하는 서사 진행 힌트. 코드가 결정하는 보조적인
 * 흐름 유도 장치로, 99일 전체를 관통하는 단계감과 장면 다양성을 만드는 데 쓴다.
 */
export interface StoryDirective {
  phase: string;
  phaseGuide: string;
  sceneMode: SceneMode;
  sceneModeLabel: string;
  sceneTags: string[];
  recentTags: string[];
  avoidRepeat: boolean;
}

export interface TurnContext {
  character: Character;
  day: number;
  totalDays: number;
  recentDayLogs: string[];
  legacyMentions: LegacyMention[];
  storyDirective: StoryDirective;
  chosenChoice?: string;
}

export interface GameState {
  character: Character;
  day: number;
  dayLogs: string[];
  recentSceneModes: SceneMode[];
  currentSituation: string;
  currentChoices: string[];
  lastOutcome?: string;
  lastReturnSummary?: string;
  lastPlayedAt: number;
  isEnded: boolean;
}
