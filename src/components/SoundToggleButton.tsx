import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useAudio } from '../engine/audioContext';

export default function SoundToggleButton() {
  const { enabled, toggle } = useAudio();
  return (
    <Pressable style={styles.button} onPress={toggle}>
      <Text style={styles.text}>{enabled ? '🔊' : '🔇'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  text: { fontSize: 14 },
});
