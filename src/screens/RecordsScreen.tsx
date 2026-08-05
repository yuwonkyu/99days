import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getLegacyRecords } from '../engine/legacyStore';
import { LegacyRecord } from '../types/legacy';

interface Props {
  onBack: () => void;
}

export default function RecordsScreen({ onBack }: Props) {
  const [records, setRecords] = useState<LegacyRecord[] | null>(null);

  useEffect(() => {
    (async () => {
      setRecords(await getLegacyRecords());
    })();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>◀ 뒤로</Text>
        </Pressable>
        <Text style={styles.title}>지난 삶의 기록</Text>
      </View>

      {records === null ? (
        <ActivityIndicator color="#e8c468" style={{ marginTop: 40 }} />
      ) : records.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>아직 기록이 없습니다.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {records.map((record) => (
            <View key={record.id} style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.name}>{record.name}</Text>
                <Text style={styles.job}>{record.job ?? '알 수 없음'}</Text>
              </View>
              <Text style={styles.dayLabel}>Day {record.diedOnDay}</Text>
              <Text style={styles.cause}>{record.causeOfDeath}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#161a24' },
  topBar: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  backButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.1)' },
  backText: { color: '#c8ccd8', fontSize: 13, fontWeight: '600' },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#7a8299', fontSize: 14 },
  list: { padding: 16, paddingTop: 4, gap: 12 },
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { color: '#fff', fontSize: 16, fontWeight: '700' },
  job: { color: '#e8c468', fontSize: 13, fontWeight: '600' },
  dayLabel: { color: '#7a8299', fontSize: 12, marginTop: 4 },
  cause: { color: '#c8ccd8', fontSize: 13, marginTop: 8, lineHeight: 19 },
});
