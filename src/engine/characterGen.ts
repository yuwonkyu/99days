import { Character, CharacterGenOptions, Gender, BodyType, RegionId, Stats } from '../types/character';
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

/**
 * 2026-08-06 실플레이 제보: 26세 학자가 164cm/39kg(BMI 14.5, 기아 수준)로 나왔는데 isHybrid도
 * 아니었음 — "돌연변이라 가능은 하지만 의도한 거면 인정, 아니면 오류"라는 지적대로, isHybrid
 * 플래그가 실제로는 체형 굴림에 전혀 관여하지 않고 있었다(태그만 붙고 수치는 완전히 무관하게
 * 독립 굴림). 혼종이 아닌 일반 캐릭터는 BMI 클램프 범위를 좁혀 기아/고도비만 수준까지는 잘
 * 안 나오게 하고, 그 극단치는 isHybrid(5% 확률)에게만 허용해 태그와 수치가 실제로 맞물리게 함.
 */
function randomBodyType(age: number, gender: Gender, isHybrid: boolean): BodyType {
  const adultHeight = gender === 'male' ? 172 : 160;
  const growth = clamp(age / 18, 0.55, 1);
  let heightCm = gaussianRandom(adultHeight, 7) * growth;
  if (age > 60) heightCm *= 0.97;
  heightCm = clamp(heightCm, 90, 210);
  const heightM = heightCm / 100;
  const [bmiMin, bmiMax] = isHybrid ? [14, 35] : [16.5, 30];
  const bmi = clamp(gaussianRandom(21.5, 3.5), bmiMin, bmiMax);
  const weightKg = clamp(bmi * heightM * heightM, 15, 150);
  return { heightCm: Math.round(heightCm), weightKg: Math.round(weightKg) };
}

function mergeTendency(a: Partial<Stats>, b: Partial<Stats>): Partial<Stats> {
  return {
    STR: (a.STR ?? 0) + (b.STR ?? 0),
    INT: (a.INT ?? 0) + (b.INT ?? 0),
    AGI: (a.AGI ?? 0) + (b.AGI ?? 0),
    LUK: (a.LUK ?? 0) + (b.LUK ?? 0),
  };
}

/** 직업 카테고리(5종) 단위 폴백 — 아래 STARTER_ITEMS_BY_JOB에 없는 직업 id가 추가되면 여기로 떨어진다. */
const STARTER_ITEMS_BY_CATEGORY: Record<string, string[]> = {
  labor: ['여벌 옷', '무두질된 가죽끈'],
  combat: ['여벌 옷', '녹슨 단검'],
  scholar: ['여벌 옷', '닳은 서책'],
  merchant: ['여벌 옷', '작은 저울'],
  other: ['여벌 옷', '부싯돌'],
};

/** 같은 카테고리라도 구체적인 직업에 맞는 소지품이 나오도록 직업 id 단위로 세분화. */
const STARTER_ITEMS_BY_JOB: Record<string, string[]> = {
  hunter: ['활과 화살', '가죽 화살통'],
  herder: ['양치기 지팡이', '여벌 옷'],
  blacksmith: ['작은 망치', '가죽 앞치마'],
  soldier: ['녹슨 단검', '낡은 사슬 갑옷 조각'],
  porter: ['질긴 밧줄', '등짐'],
  tracker: ['사냥용 덫', '여벌 옷'],
  trapper: ['동물 가죽', '사냥용 덫'],
  herbalist: ['말린 약초 주머니', '작은 절구'],
  scout: ['멀리 보는 렌즈', '녹슨 단검'],
  weaver: ['실타래', '베틀북'],
  merchant: ['작은 저울', '거래 장부'],
  boatman: ['노', '여벌 옷'],
  gambler: ['낡은 패 한 벌', '동전 몇 닢'],
  clerk: ['깃펜', '잉크병'],
  moneylender: ['전당 장부', '열쇠 꾸러미'],
  scholar: ['닳은 서책', '깃펜'],
  scribe: ['양피지 조각', '먹물통'],
  physician: ['약초 주머니', '침 상자'],
  guard: ['짧은 곤봉', '호루라기'],
  farmer: ['낫', '씨앗 주머니'],
  squire: ['녹슨 단검', '방패 조각'],
  farmhand: ['괭이', '여벌 옷'],
  mason: ['정과 망치', '돌가루 묻은 앞치마'],
  knight: ['가문 문장이 새겨진 방패', '녹슨 단검'],
  troubadour: ['현이 낡은 류트', '여벌 옷'],
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
  const isHybrid = Math.random() < hybridChance;
  const eligibleJobIds =
    age < 14 ? region.jobIds.filter((id) => getJob(id).category !== 'combat') : region.jobIds;
  const jobPool = eligibleJobIds.length > 0 ? eligibleJobIds : region.jobIds;
  const jobId = jobPool[Math.floor(Math.random() * jobPool.length)];
  const job = getJob(jobId);
  const stats = rollStats(mergeTendency(region.statTendency, job.statTendency ?? {}), isTalented);
  const bodyType = randomBodyType(age, gender, isHybrid);
  const personality = randomPersonality();
  const name = nameOverride?.trim() || randomName(regionId, gender);
  const hp = computeHP(stats, age, bodyType, job.category);
  const inventory = [
    ...(STARTER_ITEMS_BY_JOB[job.id] ?? STARTER_ITEMS_BY_CATEGORY[job.category] ?? STARTER_ITEMS_BY_CATEGORY.other),
  ];

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
