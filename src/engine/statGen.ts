import { Character, Stats } from '../types/character';
import { StatDelta } from '../types/game';
import { JobCategory, jobHpModifier } from '../data/jobs';

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Rounds to 1 decimal — repeatedly adding fractional stat_changes (e.g. +0.3 growth) across
 * many turns otherwise drifts into floating-point noise like 11.60000000000001. */
function roundTo1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Display helper: whole numbers render without a trailing ".0", fractional stats show 1 decimal. */
export function formatStat(value: number): string {
  const rounded = roundTo1(value);
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

/** Box-Muller transform for a normally distributed random value. */
export function gaussianRandom(mean: number, sd: number): number {
  const u1 = Math.max(Math.random(), Number.EPSILON);
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z0 * sd;
}

/**
 * Doc 02: mean 5 / sd 2 normal roll clamped to 1~20. A 10% "talented" character
 * rolls with mean 7 instead (distribution shift only, same 1~20 range).
 */
export function rollStat(talented: boolean, tendency = 0): number {
  const mean = (talented ? 7 : 5) + tendency;
  const raw = gaussianRandom(mean, 2);
  return clamp(Math.round(raw), 1, 20);
}

export function rollStats(tendency: Partial<Stats>, talented: boolean): Stats {
  return {
    STR: rollStat(talented, tendency.STR ?? 0),
    INT: rollStat(talented, tendency.INT ?? 0),
    AGI: rollStat(talented, tendency.AGI ?? 0),
    LUK: rollStat(talented, tendency.LUK ?? 0),
  };
}

/**
 * Doc 02: peak in late teens to mid-20s, gently declining before/after.
 * Returns an additive HP bonus/penalty.
 */
export function ageCurve(age: number): number {
  const peakStart = 18;
  const peakEnd = 26;
  if (age >= peakStart && age <= peakEnd) return 10;
  if (age < peakStart) {
    const t = (age - 5) / (peakStart - 5);
    return lerp(-10, 10, t);
  }
  const t = (age - peakEnd) / (80 - peakEnd);
  return lerp(10, -25, t);
}

/** BMI-based approximation: closer to a healthy mid-range BMI gives a small bonus. */
export function bodyTypeModifier(heightCm: number, weightKg: number): number {
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  const idealMid = 21.5;
  const diff = Math.abs(bmi - idealMid);
  if (diff <= 3) return 5 - diff;
  return -Math.min(20, (diff - 3) * 2);
}

export function computeHP(
  stats: Stats,
  age: number,
  bodyType: { heightCm: number; weightKg: number },
  jobCategory: JobCategory
): number {
  const base = 30 + stats.STR * 4 - stats.INT * 2;
  const bodyBonus =
    ageCurve(age) + bodyTypeModifier(bodyType.heightCm, bodyType.weightKg) + jobHpModifier(jobCategory);
  return Math.max(10, Math.round(base + bodyBonus));
}

export interface OutcomeDistribution {
  good: number;
  neutral: number;
  bad: number;
}

/** Doc 02: LUK bias = (LUK - 5) * 2%, added to "good" and subtracted from "bad". */
export function applyLuckBias(
  luk: number,
  base: OutcomeDistribution = { good: 0.25, neutral: 0.5, bad: 0.25 }
): OutcomeDistribution {
  const bias = (luk - 5) * 0.02;
  const good = clamp(base.good + bias, 0, 1);
  const bad = clamp(base.bad - bias, 0, 1);
  const neutral = clamp(1 - good - bad, 0, 1);
  const total = good + neutral + bad;
  return { good: good / total, neutral: neutral / total, bad: bad / total };
}

export type OutcomeTier = 'good' | 'neutral' | 'bad';

export function sampleOutcomeTier(dist: OutcomeDistribution): OutcomeTier {
  const roll = Math.random();
  if (roll < dist.good) return 'good';
  if (roll < dist.good + dist.neutral) return 'neutral';
  return 'bad';
}

/** Applies an AI/offline-generated stat delta to a character, clamping to valid ranges. */
export function applyStatDelta(character: Character, delta: StatDelta): Character {
  const stats: Stats = {
    STR: roundTo1(clamp(character.stats.STR + (delta.STR ?? 0), 1, 20)),
    INT: roundTo1(clamp(character.stats.INT + (delta.INT ?? 0), 1, 20)),
    AGI: roundTo1(clamp(character.stats.AGI + (delta.AGI ?? 0), 1, 20)),
    LUK: roundTo1(clamp(character.stats.LUK + (delta.LUK ?? 0), 1, 20)),
  };
  const hp = Math.round(clamp(character.hp + (delta.HP ?? 0), 0, character.maxHp));
  const age = Math.round(clamp(character.age + (delta.AGE ?? 0), 1, 120));
  return { ...character, stats, hp, age };
}
