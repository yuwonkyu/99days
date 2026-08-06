import AsyncStorage from '@react-native-async-storage/async-storage';

const SOUND_ENABLED_KEY = '99days:soundEnabled';
/** BGM plays at a fixed comfortable level — the UI is on/off only, no volume slider. */
export const DEFAULT_VOLUME = 0.35;

export async function loadSoundEnabled(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(SOUND_ENABLED_KEY);
  if (raw === null) return true;
  return raw === 'true';
}

export async function saveSoundEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(SOUND_ENABLED_KEY, String(enabled));
}
