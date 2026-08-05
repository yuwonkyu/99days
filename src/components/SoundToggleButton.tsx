import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAudio } from '../engine/audioContext';

function speakerIcon(enabled: boolean, volume: number): string {
  if (!enabled) return '🔇';
  if (volume === 0) return '🔈';
  if (volume < 0.67) return '🔉';
  return '🔊';
}

export default function SoundToggleButton() {
  const { enabled, toggle, volume, increaseVolume, decreaseVolume } = useAudio();

  return (
    <View style={styles.row}>
      <Pressable style={styles.stepButton} onPress={decreaseVolume}>
        <Text style={styles.stepText}>－</Text>
      </Pressable>
      <Pressable style={styles.iconButton} onPress={toggle}>
        <Text style={styles.iconText}>{speakerIcon(enabled, volume)}</Text>
      </Pressable>
      <Text style={styles.volumeText}>{Math.round(volume * 100)}%</Text>
      <Pressable style={styles.stepButton} onPress={increaseVolume}>
        <Text style={styles.stepText}>＋</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  iconButton: { paddingHorizontal: 6, paddingVertical: 4 },
  iconText: { fontSize: 14 },
  stepButton: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { color: '#fff', fontSize: 13, fontWeight: '700', lineHeight: 16 },
  volumeText: { color: '#dfe2ea', fontSize: 10, fontWeight: '600', minWidth: 28, textAlign: 'center' },
});
