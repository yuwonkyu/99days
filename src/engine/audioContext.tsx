import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { DEFAULT_VOLUME, loadSoundEnabled, saveSoundEnabled } from './settingsStore';

/**
 * Placeholder loop — self-synthesized ambient pad so the app has a working BGM
 * pipeline out of the box. Swap this file (same path/name) for a real downloaded
 * track to replace it; no code changes needed.
 */
const BGM_SOURCE = require('../../assets/audio/bgm.wav');

interface AudioContextValue {
  enabled: boolean;
  toggle: () => void;
  /** Call from a user-gesture handler (button press) — browsers block audio until one occurs. */
  ensureStarted: () => void;
}

const AudioContext = createContext<AudioContextValue | null>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const player = useAudioPlayer(BGM_SOURCE);
  const [enabled, setEnabled] = useState(true);
  const startedRef = useRef(false);

  useEffect(() => {
    player.loop = true;
    player.volume = DEFAULT_VOLUME;
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => {
      setEnabled(await loadSoundEnabled());
    })();
  }, []);

  useEffect(() => {
    if (!enabled) {
      player.pause();
      return;
    }
    if (startedRef.current) {
      player.play();
    }
  }, [enabled, player]);

  const ensureStarted = () => {
    if (startedRef.current || !enabled) return;
    startedRef.current = true;
    player.play();
  };

  const toggle = () => {
    setEnabled((prev) => {
      const next = !prev;
      saveSoundEnabled(next);
      return next;
    });
  };

  return (
    <AudioContext.Provider value={{ enabled, toggle, ensureStarted }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio(): AudioContextValue {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error('useAudio must be used within AudioProvider');
  return ctx;
}
