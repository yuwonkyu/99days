import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { DEFAULT_VOLUME, loadSoundEnabled, loadSoundVolume, saveSoundEnabled, saveSoundVolume } from './settingsStore';

const VOLUME_STEP = 0.1;

function clampVolume(value: number): number {
  return Math.round(Math.min(1, Math.max(0, value)) * 10) / 10;
}

/**
 * Placeholder loop — self-synthesized ambient pad so the app has a working BGM
 * pipeline out of the box. Swap this file (same path/name) for a real downloaded
 * track to replace it; no code changes needed.
 */
const BGM_SOURCE = require('../../assets/audio/bgm.wav');

interface AudioContextValue {
  enabled: boolean;
  toggle: () => void;
  volume: number;
  increaseVolume: () => void;
  decreaseVolume: () => void;
  /** Call from a user-gesture handler (button press) — browsers block audio until one occurs. */
  ensureStarted: () => void;
}

const AudioContext = createContext<AudioContextValue | null>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const player = useAudioPlayer(BGM_SOURCE);
  const [enabled, setEnabled] = useState(true);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const startedRef = useRef(false);

  useEffect(() => {
    player.loop = true;
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => {
      setEnabled(await loadSoundEnabled());
      setVolume(await loadSoundVolume());
    })();
  }, []);

  useEffect(() => {
    player.volume = volume;
  }, [volume, player]);

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

  const changeVolume = (delta: number) => {
    setVolume((prev) => {
      const next = clampVolume(prev + delta);
      saveSoundVolume(next);
      return next;
    });
  };

  const increaseVolume = () => changeVolume(VOLUME_STEP);
  const decreaseVolume = () => changeVolume(-VOLUME_STEP);

  return (
    <AudioContext.Provider value={{ enabled, toggle, volume, increaseVolume, decreaseVolume, ensureStarted }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio(): AudioContextValue {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error('useAudio must be used within AudioProvider');
  return ctx;
}
