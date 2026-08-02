import { ENDING_TEXTS, EndingMood, EndingType } from '../data/endings';
import { inferCategory } from './situationSelector';

function weightedMood(weights: Partial<Record<EndingMood, number>>): EndingMood {
  const entries = Object.entries(weights) as [EndingMood, number][];
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = Math.random() * total;
  for (const [mood, w] of entries) {
    roll -= w;
    if (roll <= 0) return mood;
  }
  return entries[entries.length - 1][0];
}

/** Doc 04: 최근 상황의 장르(공포/위험 등)와 종료 유형에 따라 엔딩 분위기를 가중 랜덤으로 고른다. */
export function pickEndingText(params: { type: EndingType; recentDayLogs: string[] }): string {
  const { type, recentDayLogs } = params;
  const categories = recentDayLogs.map(inferCategory);
  let mood: EndingMood;

  if (type === 'death') {
    if (categories.includes('horror')) mood = weightedMood({ horror: 0.6, tragic: 0.25, absurd: 0.15 });
    else if (categories.includes('danger')) mood = weightedMood({ tragic: 0.55, horror: 0.25, absurd: 0.2 });
    else mood = weightedMood({ tragic: 0.6, absurd: 0.25, peaceful: 0.15 });
  } else if (type === 'complete') {
    mood = weightedMood({ triumphant: 0.4, peaceful: 0.35, absurd: 0.12, tragic: 0.13 });
  } else {
    mood = weightedMood({ tragic: 0.45, peaceful: 0.4, absurd: 0.15 });
  }

  const byType = ENDING_TEXTS[type];
  const pool = byType[mood] ?? (Object.values(byType).flat() as string[]);
  return pool[Math.floor(Math.random() * pool.length)];
}
