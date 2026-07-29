import { Character, CharacterGenOptions, Gender, BodyType, RegionId } from '../types/character';
import { REGIONS, getRegion } from '../data/origins';
import { getJob, JOBS } from '../data/jobs';
import { randomName } from '../data/names';
import { randomPersonality } from '../data/personalities';
import { rollStats, computeHP, gaussianRandom, clamp } from './statGen';

function randomRegion(): RegionId {
  return REGIONS[Math.floor(Math.random() * REGIONS.length)].id;
}

function randomGender(): Gender {
  return Math.random() < 0.5 ? 'male' : 'female';
}

function randomAge(): number {
  return Math.round(clamp(gaussianRandom(24, 14), 8, 75));
}

function randomBodyType(age: number, gender: Gender): BodyType {
  const adultHeight = gender === 'male' ? 172 : 160;
  const growth = clamp(age / 18, 0.55, 1);
  let heightCm = gaussianRandom(adultHeight, 7) * growth;
  if (age > 60) heightCm *= 0.97;
  heightCm = clamp(heightCm, 90, 210);
  const heightM = heightCm / 100;
  const bmi = clamp(gaussianRandom(21.5, 3.5), 14, 35);
  const weightKg = clamp(bmi * heightM * heightM, 15, 150);
  return { heightCm: Math.round(heightCm), weightKg: Math.round(weightKg) };
}

const STARTER_ITEMS_BY_CATEGORY: Record<string, string[]> = {
  labor: ['여벌 옷', '무두질된 가죽끈'],
  combat: ['여벌 옷', '녹슨 단검'],
  scholar: ['여벌 옷', '닳은 서책'],
  merchant: ['여벌 옷', '작은 저울'],
  other: ['여벌 옷', '부싯돌'],
};

function generateId(): string {
  return `char_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function generateRandomCharacter(options: CharacterGenOptions = {}): Character {
  const { hybridChance = 0.05, nameOverride } = options;

  const regionId = randomRegion();
  const region = getRegion(regionId);
  const gender = randomGender();
  const age = randomAge();
  const isTalented = Math.random() < 0.1;
  const stats = rollStats(region.statTendency, isTalented);
  const bodyType = randomBodyType(age, gender);
  const isHybrid = Math.random() < hybridChance;
  const eligibleJobIds =
    age < 14 ? region.jobIds.filter((id) => getJob(id).category !== 'combat') : region.jobIds;
  const jobPool = eligibleJobIds.length > 0 ? eligibleJobIds : region.jobIds;
  const jobId = jobPool[Math.floor(Math.random() * jobPool.length)];
  const job = getJob(jobId);
  const personality = randomPersonality();
  const name = nameOverride?.trim() || randomName(regionId, gender);
  const hp = computeHP(stats, age, bodyType, job.category);
  const inventory = [...(STARTER_ITEMS_BY_CATEGORY[job.category] ?? STARTER_ITEMS_BY_CATEGORY.other)];

  return {
    id: generateId(),
    name,
    age,
    gender,
    regionId,
    job: job.label,
    personality,
    bodyType,
    isHybrid,
    stats,
    hp,
    maxHp: hp,
    inventory,
    isTalented,
  };
}

export function randomCharacterName(regionId?: RegionId, gender?: Gender): string {
  const region = regionId ?? randomRegion();
  const g = gender ?? randomGender();
  return randomName(region, g);
}

export { REGIONS, JOBS };
