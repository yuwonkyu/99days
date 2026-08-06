import { Character } from './character';
import { LegacyMention } from './legacy';

export const TOTAL_DAYS = 99;

export interface StatDelta {
  STR?: number;
  INT?: number;
  AGI?: number;
  LUK?: number;
  HP?: number;
  /** 시간 압축 서술(storyDirective.timeSkip)로 여러 해가 흐른 경우에만 채워짐. */
  AGE?: number;
}

/**
 * Doc 04: lets a situation span multiple days as a connected mini-arc instead
 * of every day being generated as an independent one-off vignette. 'continuing'
 * means the same conflict/person/place carries into tomorrow (summary/category
 * required); 'resolved' means a previously open thread concluded this turn;
 * 'none' means this situation was (or is now) self-contained.
 */
export interface ThreadUpdate {
  status: 'none' | 'continuing' | 'resolved';
  summary?: string;
  category?: string;
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
  thread?: ThreadUpdate;
}

/** Doc 04: the currently open multi-day story thread, persisted in GameState. */
export interface StoryThread {
  summary: string;
  category?: string;
  openedDay: number;
  /** How many turns (including this one) the thread has been continuing — lets the prompt nudge toward closing it instead of dragging forever. */
  turns: number;
}

/** 하루의 큰 활동 성격 — Doc 04: 반복 방지/흐름 유도용 힌트. `외출`(여정/순찰/사냥/교역/탐색) vs `거처`(방어/은신/은폐/거주/피난). */
export type SceneMode = 'outdoor' | 'shelter';

/** 99일 동안 고른 선택지가 많아지면 뭘 골랐는지 잊어버린다는 피드백(2026-08-06) — 날짜별로 무엇을 골랐고 그 결과가 어떻게 요약됐는지 남겨서 상태 패널에서 조회할 수 있게 한다. */
export interface ChoiceLogEntry {
  day: number;
  choice: string;
  summary: string;
}

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
  /** true면 이번 턴은 전날 바로 다음이 아니라 timeSkipLabel만큼 시간이 압축되어 흐른 것으로 서술한다. */
  timeSkip: boolean;
  timeSkipLabel?: string;
  /** true면 이번에 생성하는 situation(다음 날 상황)이 GameState.crisisDays 중 하나 — 실제로 생사가 걸린 위기여야 한다. */
  crisisAhead: boolean;
  /** true면 이번에 생성하는 outcome/stat_changes가 직전 위기 상황에서 내린 선택의 실제 결과 — 나쁜 선택/불운이면 사망까지 이를 수 있는 수준으로 반영해야 한다. */
  resolvingCrisis: boolean;
}

export interface TurnContext {
  character: Character;
  day: number;
  totalDays: number;
  recentDayLogs: string[];
  legacyMentions: LegacyMention[];
  storyDirective: StoryDirective;
  chosenChoice?: string;
  /** Doc 04: an in-progress multi-day thread from a prior turn, if any — the generator must continue or resolve it, not silently drop it. */
  activeThread?: StoryThread;
}

export interface GameState {
  character: Character;
  day: number;
  dayLogs: string[];
  recentSceneModes: SceneMode[];
  /** Doc 04: 오프라인 폴백이 이미 보여준 시드 id 목록 — 다 보기 전까진 반복 안 되게 제외에 쓴다. */
  usedSeedIds: string[];
  /** 99일 중 실제로 생사가 걸린 위기 3회가 배정된 Day 번호 (게임 시작 시 1회 생성해 고정). */
  crisisDays: number[];
  currentSituation: string;
  currentChoices: string[];
  lastOutcome?: string;
  /** 방금 해소된 선택의 스탯 변화 — UI에 변화량 뱃지로 표시하기 위해 별도 보관 (Doc 04). */
  lastStatChanges?: StatDelta;
  lastReturnSummary?: string;
  lastPlayedAt: number;
  isEnded: boolean;
  /** Doc 04: the multi-day story thread currently in progress, if any — undefined when the last turn was self-contained or just closed one. */
  activeThread?: StoryThread;
  /** 날짜별 선택 기록 — optional: 이 필드가 생기기 전에 저장된 게임에는 없을 수 있음. */
  choiceLog?: ChoiceLogEntry[];
}
