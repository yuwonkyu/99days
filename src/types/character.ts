export interface Stats {
  STR: number;
  INT: number;
  AGI: number;
  LUK: number;
}

export type RegionId =
  | 'northern_highlands'
  | 'forest_tribes'
  | 'river_trade_city'
  | 'eastern_dynasty'
  | 'western_feudal';

export type Gender = 'male' | 'female';

export interface BodyType {
  heightCm: number;
  weightKg: number;
}

export interface Character {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  regionId: RegionId;
  job: string;
  personality: string;
  bodyType: BodyType;
  isHybrid: boolean;
  stats: Stats;
  hp: number;
  maxHp: number;
  inventory: string[];
  isTalented: boolean;
}

export interface CharacterGenOptions {
  allowReroll?: boolean;
  talentedChance?: number;
  hybridChance?: number;
  nameOverride?: string;
}
