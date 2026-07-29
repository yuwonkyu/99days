import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  day: number;
  totalDays: number;
}

export default function DayProgressBar({ day, totalDays }: Props) {
  const pct = Math.min(100, Math.max(0, (day / totalDays) * 100));
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{`Day ${day}/${totalDays}`}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  label: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#e8c468',
    borderRadius: 4,
  },
});
