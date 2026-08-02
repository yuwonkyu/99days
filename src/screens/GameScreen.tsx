import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Character } from '../types/character';
import { GameState, TOTAL_DAYS } from '../types/game';
import { TurnSource, getNextTurn } from '../engine/turnService';
import { buildTurnContext } from '../engine/promptBuilder';
import { buildStoryDirective } from '../engine/storyFlow';
import { pickEndingText } from '../engine/endingSelector';
import { applyStatDelta } from '../engine/statGen';
import { sampleLegacyMentions, saveLegacyRecord } from '../engine/legacyStore';
import { buildReturnSummary, clearGameState, loadGameState, saveGameState } from '../engine/gameStateStore';
import { inferSceneTag } from '../data/backgroundThemes';
import BackgroundScene from '../components/BackgroundScene';
import DayProgressBar from '../components/DayProgressBar';
import ChoiceList from '../components/ChoiceList';
import ReturningSummaryBanner from '../components/ReturningSummaryBanner';
import StatChangeBadges from '../components/StatChangeBadges';
import StatusPanel from './StatusPanel';

interface Props {
  initialCharacter: Character | null;
  onEnded: () => void;
}

interface EndingInfo {
  characterName: string;
  day: number;
  text: string;
}

export default function GameScreen({ initialCharacter, onEnded }: Props) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusVisible, setStatusVisible] = useState(false);
  const [returnSummary, setReturnSummary] = useState<string | null>(null);
  const [lastSource, setLastSource] = useState<TurnSource | null>(null);
  const [ending, setEnding] = useState<EndingInfo | null>(null);

  useEffect(() => {
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function bootstrap() {
    const saved = await loadGameState();
    if (saved && !saved.isEnded) {
      setGameState(saved);
      setReturnSummary(buildReturnSummary(saved));
      setLoading(false);
      return;
    }
    if (initialCharacter) {
      await startNewGame(initialCharacter);
    } else {
      setLoading(false);
    }
  }

  async function startNewGame(character: Character) {
    setLoading(true);
    const legacyMentions = await sampleLegacyMentions();
    const storyDirective = buildStoryDirective({
      day: 1,
      totalDays: TOTAL_DAYS,
      recentSceneModes: [],
      recentDaySummaries: [],
    });
    const context = buildTurnContext({
      character,
      day: 1,
      totalDays: TOTAL_DAYS,
      recentDayLogs: [],
      legacyMentions,
      storyDirective,
    });
    const { response, source, usedSeedId } = await getNextTurn(context, []);
    setLastSource(source);

    const newState: GameState = {
      character,
      day: 1,
      dayLogs: [],
      recentSceneModes: [storyDirective.sceneMode],
      usedSeedIds: usedSeedId ? [usedSeedId] : [],
      currentSituation: response.situation,
      currentChoices: response.choices,
      lastOutcome: undefined,
      lastStatChanges: undefined,
      lastPlayedAt: Date.now(),
      isEnded: false,
    };
    await saveGameState(newState);
    setGameState(newState);
    setLoading(false);
  }

  async function endGame(character: Character, dayLogs: string[], diedOnDay: number, causeOfDeath: string) {
    await saveLegacyRecord({ character, dayLogs, diedOnDay, causeOfDeath });
    await clearGameState();
    setGameState(null);
    setLoading(false);
    setStatusVisible(false);
    setEnding({ characterName: character.name, day: diedOnDay, text: causeOfDeath });
  }

  async function handleChoice(index: number) {
    if (!gameState || loading) return;
    setLoading(true);
    const chosenChoice = gameState.currentChoices[index];
    const legacyMentions = await sampleLegacyMentions();
    const recentDayLogs = gameState.dayLogs.slice(-3);
    const storyDirective = buildStoryDirective({
      day: gameState.day,
      totalDays: TOTAL_DAYS,
      recentSceneModes: gameState.recentSceneModes ?? [],
      recentDaySummaries: recentDayLogs,
    });
    const context = buildTurnContext({
      character: gameState.character,
      day: gameState.day,
      totalDays: TOTAL_DAYS,
      recentDayLogs,
      legacyMentions,
      storyDirective,
      chosenChoice,
    });

    const { response, source, usedSeedId, resetUsedSeeds } = await getNextTurn(context, gameState.usedSeedIds ?? []);
    setLastSource(source);

    const updatedCharacter = applyStatDelta(gameState.character, response.stat_changes);
    const newDayLogs = [...gameState.dayLogs, response.day_summary];
    const newSceneModes = [...(gameState.recentSceneModes ?? []), storyDirective.sceneMode].slice(-6);
    const newUsedSeedIds = usedSeedId
      ? resetUsedSeeds
        ? [usedSeedId]
        : [...(gameState.usedSeedIds ?? []), usedSeedId]
      : gameState.usedSeedIds ?? [];

    if (updatedCharacter.hp <= 0) {
      const text = pickEndingText({ type: 'death', recentDayLogs: newDayLogs.slice(-3) });
      await endGame(updatedCharacter, newDayLogs, gameState.day, text);
      return;
    }
    if (gameState.day >= TOTAL_DAYS) {
      const text = pickEndingText({ type: 'complete', recentDayLogs: newDayLogs.slice(-3) });
      await endGame(updatedCharacter, newDayLogs, gameState.day, text);
      return;
    }

    const newState: GameState = {
      character: updatedCharacter,
      day: gameState.day + 1,
      dayLogs: newDayLogs,
      recentSceneModes: newSceneModes,
      usedSeedIds: newUsedSeedIds,
      currentSituation: response.situation,
      currentChoices: response.choices,
      lastOutcome: response.outcome,
      lastStatChanges: response.stat_changes,
      lastPlayedAt: Date.now(),
      isEnded: false,
    };
    await saveGameState(newState);
    setGameState(newState);
    setLoading(false);
  }

  async function handleGiveUp() {
    if (!gameState) return;
    const text = pickEndingText({ type: 'giveup', recentDayLogs: gameState.dayLogs.slice(-3) });
    await endGame(gameState.character, gameState.dayLogs, gameState.day, text);
  }

  if (ending) {
    return (
      <View style={styles.endingContainer}>
        <Text style={styles.endingTitle}>{ending.characterName}</Text>
        <Text style={styles.endingDay}>Day {ending.day}/{TOTAL_DAYS}</Text>
        <Text style={styles.endingText}>{ending.text}</Text>
        <Pressable
          style={styles.newLifeButton}
          onPress={() => {
            setEnding(null);
            onEnded();
          }}
        >
          <Text style={styles.newLifeText}>새로운 인생 시작하기</Text>
        </Pressable>
      </View>
    );
  }

  if (!gameState) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#e8c468" size="large" />
        <Text style={styles.loadingText}>이야기를 준비하는 중...</Text>
      </View>
    );
  }

  const sceneTag = inferSceneTag(gameState.currentSituation);

  return (
    <BackgroundScene tag={sceneTag}>
      <View style={styles.overlay}>
        <View style={styles.topBar}>
          <DayProgressBar day={gameState.day} totalDays={TOTAL_DAYS} />
          <Pressable style={styles.statusButton} onPress={() => setStatusVisible(true)}>
            <Text style={styles.statusButtonText}>상태</Text>
          </Pressable>
        </View>

        {returnSummary && (
          <ReturningSummaryBanner summary={returnSummary} onDismiss={() => setReturnSummary(null)} />
        )}

        <ScrollView contentContainerStyle={styles.panelScroll}>
          <View style={styles.panel}>
            {gameState.lastOutcome && (
              <>
                <Text style={styles.outcomeText}>{gameState.lastOutcome}</Text>
                <StatChangeBadges delta={gameState.lastStatChanges} />
              </>
            )}
            <Text style={styles.situationText}>{gameState.currentSituation}</Text>

            {loading ? (
              <View style={styles.inlineLoading}>
                <ActivityIndicator color="#fff" />
                <Text style={styles.inlineLoadingText}>다음 상황을 생각하는 중...</Text>
              </View>
            ) : (
              <ChoiceList choices={gameState.currentChoices} onSelect={handleChoice} disabled={loading} />
            )}

            {lastSource && (
              <Text style={styles.sourceBadge}>
                {lastSource === 'ai' ? 'AI 게임마스터 생성' : '오프라인 폴백 생성'}
              </Text>
            )}
          </View>
        </ScrollView>
      </View>

      <StatusPanel
        visible={statusVisible}
        character={gameState.character}
        day={gameState.day}
        totalDays={TOTAL_DAYS}
        onClose={() => setStatusVisible(false)}
        onGiveUp={handleGiveUp}
      />
    </BackgroundScene>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingRight: 16 },
  statusButton: {
    marginTop: 12,
    marginLeft: 'auto',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  statusButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  panelScroll: { flexGrow: 1, justifyContent: 'flex-end', padding: 16 },
  panel: {
    backgroundColor: 'rgba(10,12,18,0.72)',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  outcomeText: { color: '#e8c468', fontSize: 14, marginBottom: 10, lineHeight: 20 },
  situationText: { color: '#fff', fontSize: 16, lineHeight: 23 },
  inlineLoading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  inlineLoadingText: { color: '#c8ccd8', fontSize: 13 },
  sourceBadge: { color: '#7a8299', fontSize: 10, marginTop: 14, textAlign: 'right' },
  loadingContainer: { flex: 1, backgroundColor: '#161a24', alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: '#c8ccd8', fontSize: 14 },
  endingContainer: { flex: 1, backgroundColor: '#161a24', alignItems: 'center', justifyContent: 'center', padding: 24 },
  endingTitle: { color: '#fff', fontSize: 24, fontWeight: '800' },
  endingDay: { color: '#9aa2b8', fontSize: 14, marginTop: 6 },
  endingText: { color: '#e6e9f2', fontSize: 16, marginTop: 18, textAlign: 'center', lineHeight: 24 },
  newLifeButton: {
    marginTop: 32,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#e8c468',
  },
  newLifeText: { color: '#20242f', fontSize: 15, fontWeight: '800' },
});
