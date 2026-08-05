import AsyncStorage from '@react-native-async-storage/async-storage';

const SOUND_ENABLED_KEY = '99days:soundEnabled';
const SOUND_VOLUME_KEY = '99days:soundVolume';
export const DEFAULT_VOLUME = 0.35;

export async function loadSoundEnabled(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(SOUND_ENABLED_KEY);
  if (raw === null) return true;
  return raw === 'true';
}

export async function saveSoundEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(SOUND_ENABLED_KEY, String(enabled));
}

export async function loadSoundVolume(): Promise<number> {
  const raw = await AsyncStorage.getItem(SOUND_VOLUME_KEY);
  if (raw === null) return DEFAULT_VOLUME;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : DEFAULT_VOLUME;
}

export async function saveSoundVolume(volume: number): Promise<void> {
  await AsyncStorage.setItem(SOUND_VOLUME_KEY, String(volume));
}
