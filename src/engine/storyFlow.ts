import { inferSceneTag } from '../data/backgroundThemes';
import { SceneMode, StoryDirective } from '../types/game';

/**
 * Doc 04: deterministic (non-AI) story pacing layer. The AI/offline generator
 * decide the actual content of each day; this module only decides what *kind*
 * of day it should be, so a 99-day run doesn't drift into repeating the same
 * situation shape for a dozen days in a row.
 */
interface PhaseDef {
  maxRatio: number;
  label: string;
  guide: string;
}

const PHASES: PhaseDef[] = [
  { maxRatio: 0.14, label: '정착기', guide: '새로운 삶에 적응하며 주변 인물·장소를 넓혀가는 시기' },
  { maxRatio: 0.35, label: '성장기', guide: '앞서 쌓인 관계와 사건이 구체적인 갈등으로 이어지는 시기' },
  { maxRatio: 0.6, label: '격변기', guide: '예상 못한 위기나 전환점이 필요한 시기' },
  { maxRatio: 0.85, label: '수렴기', guide: '쌓인 갈등이 정리되며 결말을 향한 선택이 요구되는 시기' },
  { maxRatio: 1, label: '결말부', guide: '생의 마지막을 향해 이야기를 정리하는 시기' },
];

function getPhase(day: number, totalDays: number): PhaseDef {
  const ratio = day / totalDays;
  return PHASES.find((p) => ratio <= p.maxRatio) ?? PHASES[PHASES.length - 1];
}

const SCENE_TAGS: Record<SceneMode, string[]> = {
  outdoor: ['여정', '순찰', '사냥', '교역', '탐색'],
  shelter: ['방어', '은신', '은폐', '거주', '피난'],
};

function sample<T>(arr: T[], count: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, count);
}

function pickSceneMode(recentModes: SceneMode[]): SceneMode {
  const last = recentModes[recentModes.length - 1];
  const secondLast = recentModes[recentModes.length - 2];
  // 같은 모드가 2일 연속이면 강제로 전환 — 3일 연속 같은 성격의 하루 방지
  if (last && last === secondLast) {
    return last === 'outdoor' ? 'shelter' : 'outdoor';
  }
  return Math.random() < 0.5 ? 'outdoor' : 'shelter';
}

export function buildStoryDirective(params: {
  day: number;
  totalDays: number;
  recentSceneModes: SceneMode[];
  recentDaySummaries: string[];
}): StoryDirective {
  const phase = getPhase(params.day, params.totalDays);
  const sceneMode = pickSceneMode(params.recentSceneModes);
  const recentTags = params.recentDaySummaries.map(inferSceneTag);
  const tagCounts = new Map<string, number>();
  recentTags.forEach((tag) => tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1));
  const avoidRepeat = [...tagCounts.values()].some((count) => count >= 2);

  return {
    phase: phase.label,
    phaseGuide: phase.guide,
    sceneMode,
    sceneModeLabel: sceneMode === 'outdoor' ? '외출' : '거처',
    sceneTags: sample(SCENE_TAGS[sceneMode], 2),
    recentTags,
    avoidRepeat,
  };
}
