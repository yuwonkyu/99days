import { Stats } from './character';

export interface LegacyRecord {
  id: string;
  name: string;
  job: string;
  lifeSummary: string;
  finalStats: Stats;
  diedOnDay: number;
  causeOfDeath: string;
  notableItems: string[];
  recordedAt: number;
}

export interface LegacyMention {
  name: string;
  lifeSummary: string;
  causeOfDeath: string;
}
