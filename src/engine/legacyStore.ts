import AsyncStorage from '@react-native-async-storage/async-storage';
import { Character } from '../types/character';
import { LegacyMention, LegacyRecord } from '../types/legacy';

const LEGACY_KEY = '99days:legacyRecords';
const MAX_RECORDS = 50;

export async function getLegacyRecords(): Promise<LegacyRecord[]> {
  const raw = await AsyncStorage.getItem(LEGACY_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as LegacyRecord[];
  } catch {
    return [];
  }
}

function summarizeLife(dayLogs: string[]): string {
  if (dayLogs.length === 0) return '기록이 거의 남지 않은 조용한 생애.';
  const head = dayLogs.slice(0, 1);
  const tail = dayLogs.slice(-2);
  return Array.from(new Set([...head, ...tail])).join(' ');
}

export async function saveLegacyRecord(params: {
  character: Character;
  dayLogs: string[];
  diedOnDay: number;
  causeOfDeath: string;
}): Promise<LegacyRecord> {
  const { character, dayLogs, diedOnDay, causeOfDeath } = params;
  const record: LegacyRecord = {
    id: character.id,
    name: character.name,
    lifeSummary: summarizeLife(dayLogs),
    finalStats: character.stats,
    diedOnDay,
    causeOfDeath,
    notableItems: character.inventory.slice(0, 2),
    recordedAt: Date.now(),
  };
  const existing = await getLegacyRecords();
  const updated = [record, ...existing].slice(0, MAX_RECORDS);
  await AsyncStorage.setItem(LEGACY_KEY, JSON.stringify(updated));
  return record;
}

/** Doc 06: sample a few past characters to inject into the AI prompt as supporting cast. */
export async function sampleLegacyMentions(count = 3): Promise<LegacyMention[]> {
  const records = await getLegacyRecords();
  const shuffled = [...records].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((r) => ({
    name: r.name,
    lifeSummary: r.lifeSummary,
    causeOfDeath: r.causeOfDeath,
  }));
}
