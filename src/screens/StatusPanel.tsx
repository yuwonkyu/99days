import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Character } from '../types/character';
import { ChoiceLogEntry } from '../types/game';
import { getRegion } from '../data/origins';
import { formatStat } from '../engine/statGen';

interface Props {
  visible: boolean;
  character: Character;
  day: number;
  totalDays: number;
  choiceLog: ChoiceLogEntry[];
  onClose: () => void;
  onGiveUp: () => void;
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statTrack}>
        <View style={[styles.statFill, { width: `${(value / 20) * 100}%` }]} />
      </View>
      <Text style={styles.statValue}>{formatStat(value)}</Text>
    </View>
  );
}

export default function StatusPanel({ visible, character, day, totalDays, choiceLog, onClose, onGiveUp }: Props) {
  const region = getRegion(character.regionId);
  const [tab, setTab] = useState<'status' | 'log'>('status');

  if (!visible) return null;

  return (
    <>
      <View style={styles.backdrop}>
        <View style={styles.panel}>
          <View style={styles.tabRow}>
            <Pressable style={[styles.tabButton, tab === 'status' && styles.tabButtonActive]} onPress={() => setTab('status')}>
              <Text style={[styles.tabText, tab === 'status' && styles.tabTextActive]}>상태</Text>
            </Pressable>
            <Pressable style={[styles.tabButton, tab === 'log' && styles.tabButtonActive]} onPress={() => setTab('log')}>
              <Text style={[styles.tabText, tab === 'log' && styles.tabTextActive]}>선택 기록</Text>
            </Pressable>
          </View>

          {tab === 'status' ? (
            <ScrollView>
              <Text style={styles.name}>
                {character.name}
                {character.isHybrid ? ' (혼종)' : ''}
                {character.isTalented ? ' ★' : ''}
              </Text>
              <Text style={styles.subtitle}>
                {character.age}세 · {region.label} · {character.job} · {character.personality}
              </Text>
              <Text style={styles.subtitle}>
                키 {character.bodyType.heightCm}cm · 몸무게 {character.bodyType.weightKg}kg
              </Text>
              <Text style={styles.subtitle}>Day {day}/{totalDays}</Text>

              <View style={styles.hpRow}>
                <Text style={styles.statLabel}>체력</Text>
                <View style={styles.statTrack}>
                  <View
                    style={[
                      styles.hpFill,
                      { width: `${Math.max(0, Math.min(100, (character.hp / character.maxHp) * 100))}%` },
                    ]}
                  />
                </View>
                <Text style={styles.statValue}>
                  {character.hp}/{character.maxHp}
                </Text>
              </View>

              <StatRow label="힘" value={character.stats.STR} />
              <StatRow label="지력" value={character.stats.INT} />
              <StatRow label="민첩" value={character.stats.AGI} />
              <StatRow label="행운" value={character.stats.LUK} />

              <Text style={styles.sectionTitle}>소지품</Text>
              {character.inventory.length === 0 ? (
                <Text style={styles.itemText}>없음</Text>
              ) : (
                character.inventory.map((item, i) => (
                  <Text key={i} style={styles.itemText}>
                    · {item}
                  </Text>
                ))
              )}

              <Pressable style={styles.giveUpButton} onPress={onGiveUp}>
                <Text style={styles.giveUpText}>이 삶을 포기한다</Text>
              </Pressable>
            </ScrollView>
          ) : (
            <ScrollView>
              {choiceLog.length === 0 ? (
                <Text style={styles.itemText}>아직 선택한 기록이 없습니다.</Text>
              ) : (
                [...choiceLog].reverse().map((entry, i) => (
                  <View key={i} style={styles.logEntry}>
                    <Text style={styles.logDay}>Day {entry.day}</Text>
                    <Text style={styles.logChoice}>&quot;{entry.choice}&quot;</Text>
                    <Text style={styles.logSummary}>{entry.summary}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          )}

          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>닫기</Text>
          </Pressable>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  panel: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    backgroundColor: '#20242f',
    borderRadius: 14,
    padding: 20,
  },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  tabButtonActive: { backgroundColor: 'rgba(232,196,104,0.18)' },
  tabText: { color: '#9aa2b8', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#e8c468' },
  logEntry: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  logDay: { color: '#e8c468', fontSize: 11, fontWeight: '700' },
  logChoice: { color: '#fff', fontSize: 13, fontWeight: '600', marginTop: 3 },
  logSummary: { color: '#9aa2b8', fontSize: 12, marginTop: 3, lineHeight: 17 },
  name: { color: '#fff', fontSize: 20, fontWeight: '700' },
  subtitle: { color: '#c8ccd8', fontSize: 13, marginTop: 4 },
  sectionTitle: { color: '#fff', fontSize: 15, fontWeight: '600', marginTop: 16, marginBottom: 6 },
  itemText: { color: '#c8ccd8', fontSize: 13, marginTop: 2 },
  hpRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 8 },
  statRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  statLabel: { color: '#fff', fontSize: 13, width: 36 },
  statTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  statFill: { height: '100%', backgroundColor: '#8fb3ff', borderRadius: 4 },
  hpFill: { height: '100%', backgroundColor: '#e0645a', borderRadius: 4 },
  statValue: { color: '#fff', fontSize: 12, width: 46, textAlign: 'right' },
  giveUpButton: {
    marginTop: 24,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(224,100,90,0.6)',
    alignItems: 'center',
  },
  giveUpText: { color: '#e0645a', fontSize: 13, fontWeight: '600' },
  closeButton: {
    marginTop: 14,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  closeText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
