import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatDelta } from '../types/game';
import { formatStat } from '../engine/statGen';

/** Doc 04: 결과 텍스트만으로는 실제로 뭐가 얼마나 바뀌었는지 안 보인다는 피드백 — 변화량을 뱃지로 표시. */
const LABELS: Record<keyof StatDelta, string> = {
  STR: '힘',
  INT: '지력',
  AGI: '민첩',
  LUK: '행운',
  HP: '체력',
  AGE: '나이',
};

interface Props {
  delta?: StatDelta;
}

export default function StatChangeBadges({ delta }: Props) {
  if (!delta) return null;
  const entries = (Object.entries(delta) as [keyof StatDelta, number | undefined][]).filter(
    (entry): entry is [keyof StatDelta, number] => typeof entry[1] === 'number' && entry[1] !== 0
  );
  if (entries.length === 0) return null;

  return (
    <View style={styles.row}>
      {entries.map(([key, value]) => (
        <View key={key} style={[styles.badge, value > 0 ? styles.positive : styles.negative]}>
          <Text style={styles.badgeText}>
            {LABELS[key]} {value > 0 ? '+' : ''}
            {formatStat(value)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  badge: { paddingVertical: 3, paddingHorizontal: 9, borderRadius: 8 },
  positive: { backgroundColor: 'rgba(126, 211, 145, 0.24)' },
  negative: { backgroundColor: 'rgba(224, 108, 108, 0.24)' },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
