import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { loadGameState, clearGameState } from '../engine/gameStateStore';
import { TOTAL_DAYS } from '../types/game';
import { useAudio } from '../engine/audioContext';
import SoundToggleButton from '../components/SoundToggleButton';

interface Props {
  onContinue: () => void;
  onNewGame: () => void;
  onRecords: () => void;
}

export default function HomeScreen({ onContinue, onNewGame, onRecords }: Props) {
  const [checking, setChecking] = useState(true);
  const [hasSave, setHasSave] = useState(false);
  const [savedDay, setSavedDay] = useState<number | null>(null);
  const [confirmingNewGame, setConfirmingNewGame] = useState(false);
  const { ensureStarted } = useAudio();

  useEffect(() => {
    (async () => {
      const saved = await loadGameState();
      setHasSave(!!saved && !saved.isEnded);
      setSavedDay(saved && !saved.isEnded ? saved.day : null);
      setChecking(false);
    })();
  }, []);

  const handleContinue = () => {
    ensureStarted();
    onContinue();
  };

  const handleNewGamePress = () => {
    ensureStarted();
    if (hasSave) {
      setConfirmingNewGame(true);
      return;
    }
    onNewGame();
  };

  const handleConfirmNewGame = async () => {
    await clearGameState();
    setConfirmingNewGame(false);
    onNewGame();
  };

  const handleRecords = () => {
    ensureStarted();
    onRecords();
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <SoundToggleButton />
      </View>
      <View style={styles.center}>
        <Text style={styles.title}>99days</Text>
        <Text style={styles.subtitle}>낯선 삶에서 99일을 살아남아라.</Text>

        {checking ? (
          <ActivityIndicator color="#e8c468" style={{ marginTop: 32 }} />
        ) : confirmingNewGame ? (
          <View style={styles.confirmBox}>
            <Text style={styles.confirmText}>정말 새로 시작할까요?{'\n'}이어하기 기록이 사라집니다.</Text>
            <View style={styles.confirmRow}>
              <Pressable style={styles.cancelButton} onPress={() => setConfirmingNewGame(false)}>
                <Text style={styles.cancelText}>취소</Text>
              </Pressable>
              <Pressable style={styles.confirmButton} onPress={handleConfirmNewGame}>
                <Text style={styles.confirmButtonText}>새로 시작</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.menu}>
            <Pressable
              style={[styles.primaryButton, !hasSave && styles.disabledButton]}
              onPress={handleContinue}
              disabled={!hasSave}
            >
              <Text style={styles.primaryText}>이어하기</Text>
              {hasSave && savedDay != null && (
                <Text style={styles.primarySubText}>Day {savedDay}/{TOTAL_DAYS}</Text>
              )}
            </Pressable>

            <Pressable style={styles.secondaryButton} onPress={handleNewGamePress}>
              <Text style={styles.secondaryText}>새로 시작</Text>
            </Pressable>

            <Pressable style={styles.textButton} onPress={handleRecords}>
              <Text style={styles.textButtonLabel}>지난 삶의 기록</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#161a24' },
  topBar: { flexDirection: 'row', justifyContent: 'flex-end', padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  title: { color: '#fff', fontSize: 40, fontWeight: '800', letterSpacing: 3 },
  subtitle: { color: '#9aa2b8', fontSize: 14, marginTop: 10, marginBottom: 40, textAlign: 'center' },
  menu: { width: '100%', maxWidth: 360, gap: 12 },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#e8c468',
    alignItems: 'center',
  },
  disabledButton: { opacity: 0.35 },
  primaryText: { color: '#20242f', fontSize: 16, fontWeight: '800' },
  primarySubText: { color: '#4a3f22', fontSize: 12, marginTop: 2, fontWeight: '600' },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
  },
  secondaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  textButton: { marginTop: 8, alignItems: 'center', paddingVertical: 8 },
  textButtonLabel: { color: '#9aa2b8', fontSize: 13, textDecorationLine: 'underline' },
  confirmBox: {
    width: '100%',
    maxWidth: 360,
    padding: 20,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  confirmText: { color: '#e6e9f2', fontSize: 14, lineHeight: 21, textAlign: 'center' },
  confirmRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  cancelText: { color: '#c8ccd8', fontSize: 14, fontWeight: '600' },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#e0645a',
    alignItems: 'center',
  },
  confirmButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
