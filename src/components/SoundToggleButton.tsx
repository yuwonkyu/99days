import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useAudio } from '../engine/audioContext';

export default function SoundToggleButton() {
  const { enabled, toggle } = useAudio();

  return (
    <Pressable style={styles.button} onPress={toggle}>
      <Text style={styles.icon}>{enabled ? '🔊' : '🔈'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 16 },
});
