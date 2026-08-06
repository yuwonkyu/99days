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

/**
 * Doc 04: 최근 상황의 장르(공포/위험 등)와 종료 유형에 따라 엔딩 분위기를 가중 랜덤으로 고른다.
 * 2026-08-06 실플레이 제보: 멧돼지 떼 습격(위기 Day) 사망인데 "익숙한 자리에서 잠들듯" peaceful
 * 엔딩이 나옴 — 원인은 CRISIS_DAY_SUMMARIES 문구가 danger 키워드를 하나도 안 담고 있어
 * inferCategory가 null을 반환, 결과적으로 peaceful까지 포함된 기본 분기로 빠졌기 때문. 키워드
 * 매칭은 문구가 바뀔 때마다 또 깨질 수 있는 취약한 신호이므로, 위기 Day 사망 여부를 호출부
 * (GameScreen)에서 직접 넘겨받아 확정적으로 처리한다 — 위기로 죽었으면 peaceful은 아예 배제.
 */
export function pickEndingText(params: { type: EndingType; recentDayLogs: string[]; wasCrisisDeath?: boolean }): string {
  const { type, recentDayLogs, wasCrisisDeath } = params;
  const categories = recentDayLogs.map(inferCategory);
  let mood: EndingMood;

  if (type === 'death') {
    if (wasCrisisDeath) mood = weightedMood({ horror: 0.4, tragic: 0.4, absurd: 0.2 });
    else if (categories.includes('horror')) mood = weightedMood({ horror: 0.6, tragic: 0.25, absurd: 0.15 });
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
