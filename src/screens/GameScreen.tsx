import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Character } from '../types/character';
import { ChoiceLogEntry, GameState, StoryThread, TOTAL_DAYS } from '../types/game';
import { TurnSource, getNextTurn } from '../engine/turnService';
import { buildTurnContext } from '../engine/promptBuilder';
import { buildStoryDirective, generateCrisisDays } from '../engine/storyFlow';
import { pickEndingText } from '../engine/endingSelector';
import { applyStatDelta } from '../engine/statGen';
import { sampleLegacyMentions, saveLegacyRecord } from '../engine/legacyStore';
import { buildReturnSummary, clearGameState, loadGameState, saveGameState } from '../engine/gameStateStore';
import { paginate } from '../engine/textLimits';
import { inferMood, inferSceneTag } from '../data/backgroundThemes';
import BackgroundScene from '../components/BackgroundScene';
import DayProgressBar from '../components/DayProgressBar';
import ChoiceList from '../components/ChoiceList';
import ReturningSummaryBanner from '../components/ReturningSummaryBanner';
import StatChangeBadges from '../components/StatChangeBadges';
import SoundToggleButton from '../components/SoundToggleButton';
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
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPageIndex(0);
  }, [gameState?.day, gameState?.currentSituation]);

  const pages = useMemo(() => {
    if (!gameState) return [];
    const outcomePages = paginate(gameState.lastOutcome).map((text) => ({ type: 'outcome' as const, text }));
    const situationPages = paginate(gameState.currentSituation).map((text) => ({ type: 'situation' as const, text }));
    return [...outcomePages, ...situationPages];
  }, [gameState?.lastOutcome, gameState?.currentSituation]);

  const currentPage = pages[pageIndex];
  const isLastPage = pageIndex >= pages.length - 1;

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
    const crisisDays = generateCrisisDays(TOTAL_DAYS);
    const storyDirective = buildStoryDirective({
      day: 1,
      totalDays: TOTAL_DAYS,
      recentSceneModes: [],
      recentDaySummaries: [],
      crisisAhead: crisisDays.includes(1),
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
      crisisDays,
      currentSituation: response.situation,
      currentChoices: response.choices,
      lastOutcome: undefined,
      lastStatChanges: undefined,
      lastPlayedAt: Date.now(),
      isEnded: false,
      activeThread:
        response.thread?.status === 'continuing' && response.thread.summary
          ? { summary: response.thread.summary, category: response.thread.category, openedDay: 1, turns: 1 }
          : undefined,
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
    const activeThread = gameState.activeThread;
    const crisisDays = gameState.crisisDays ?? [];
    const storyDirective = buildStoryDirective({
      day: gameState.day,
      totalDays: TOTAL_DAYS,
      recentSceneModes: gameState.recentSceneModes ?? [],
      recentDaySummaries: recentDayLogs,
      hasActiveThread: !!activeThread,
      resolvingCrisis: crisisDays.includes(gameState.day),
      crisisAhead: crisisDays.includes(gameState.day + 1),
    });
    const context = buildTurnContext({
      character: gameState.character,
      day: gameState.day,
      totalDays: TOTAL_DAYS,
      recentDayLogs,
      legacyMentions,
      storyDirective,
      chosenChoice,
      activeThread,
    });

    const { response, source, usedSeedId, resetUsedSeeds } = await getNextTurn(context, gameState.usedSeedIds ?? []);
    setLastSource(source);
    const newActiveThread: StoryThread | undefined =
      response.thread?.status === 'continuing' && response.thread.summary
        ? {
            summary: response.thread.summary,
            category: response.thread.category,
            openedDay: activeThread?.openedDay ?? gameState.day,
            turns: (activeThread?.turns ?? 0) + 1,
          }
        : undefined;

    const updatedCharacter = applyStatDelta(gameState.character, response.stat_changes);
    const newDayLogs = [...gameState.dayLogs, response.day_summary];
    const newChoiceLog: ChoiceLogEntry[] = [
      ...(gameState.choiceLog ?? []),
      { day: gameState.day, choice: chosenChoice, summary: response.day_summary },
    ];
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
      crisisDays,
      currentSituation: response.situation,
      currentChoices: response.choices,
      lastOutcome: response.outcome,
      lastStatChanges: response.stat_changes,
      lastPlayedAt: Date.now(),
      isEnded: false,
      activeThread: newActiveThread,
      choiceLog: newChoiceLog,
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

  // 배경은 situation 전체(여러 페이지 분량)가 아니라 지금 보이는 페이지 텍스트만 보고 고른다 —
  // 3페이지짜리 상황의 1페이지가 실내 대화인데 2~3페이지 어딘가의 "숲" 언급 때문에 숲 배경이
  // 뜨는 식의 불일치가 실제로 있었다(2026-08-06 제보). 페이지를 넘길 때마다 배경도 그 페이지
  // 내용에 맞게 다시 계산된다.
  const currentSceneMode = gameState.recentSceneModes?.[gameState.recentSceneModes.length - 1];
  const backgroundText = currentPage?.text ?? gameState.currentSituation;
  const sceneTag = inferSceneTag(backgroundText, currentSceneMode);
  const sceneMood = inferMood(backgroundText);
  const isCrisisToday = (gameState.crisisDays ?? []).includes(gameState.day);

  return (
    <BackgroundScene tag={sceneTag} mood={sceneMood}>
      <View style={styles.overlay}>
        <View style={styles.topBar}>
          <DayProgressBar day={gameState.day} totalDays={TOTAL_DAYS} />
          <SoundToggleButton />
          <Pressable style={styles.statusButton} onPress={() => setStatusVisible(true)}>
            <Text style={styles.statusButtonText}>상태</Text>
          </Pressable>
        </View>

        {isCrisisToday && (
          <View style={styles.crisisBanner}>
            <Text style={styles.crisisBannerText}>⚠ 생사의 기로 — 신중히 선택하세요</Text>
          </View>
        )}

        {returnSummary && (
          <ReturningSummaryBanner summary={returnSummary} onDismiss={() => setReturnSummary(null)} />
        )}

        <ScrollView contentContainerStyle={styles.panelScroll}>
          <View style={styles.panel}>
            {currentPage?.type === 'outcome' && (
              <>
                <Text style={styles.outcomeText}>{currentPage.text}</Text>
                <StatChangeBadges delta={gameState.lastStatChanges} />
              </>
            )}
            {currentPage?.type === 'situation' && <Text style={styles.situationText}>{currentPage.text}</Text>}

            {pages.length > 1 && (
              <View style={styles.pageNavRow}>
                <Pressable
                  style={[styles.prevButton, pageIndex === 0 && styles.navButtonDisabled]}
                  onPress={() => setPageIndex((i) => Math.max(0, i - 1))}
                  disabled={pageIndex === 0}
                >
                  <Text style={styles.prevButtonText}>◀ 이전</Text>
                </Pressable>
                <Text style={styles.pageIndicator}>
                  {pageIndex + 1} / {pages.length}
                </Text>
                {!isLastPage && (
                  <Pressable style={styles.nextButton} onPress={() => setPageIndex((i) => i + 1)}>
                    <Text style={styles.nextButtonText}>다음 ▶</Text>
                  </Pressable>
                )}
              </View>
            )}

            {loading ? (
              <View style={styles.inlineLoading}>
                <ActivityIndicator color="#fff" />
                <Text style={styles.inlineLoadingText}>다음 상황을 생각하는 중...</Text>
              </View>
            ) : isLastPage ? (
              <ChoiceList choices={gameState.currentChoices} onSelect={handleChoice} disabled={loading} />
            ) : null}

            {isLastPage && lastSource && (
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
        choiceLog={gameState.choiceLog ?? []}
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
  crisisBanner: {
    marginHorizontal: 16,
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(160,30,30,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,120,120,0.6)',
  },
  crisisBannerText: { color: '#ffd7d3', fontSize: 12, fontWeight: '700', textAlign: 'center' },
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
  pageNavRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, gap: 10 },
  prevButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  prevButtonText: { color: '#c8ccd8', fontSize: 13, fontWeight: '600' },
  navButtonDisabled: { opacity: 0.3 },
  nextButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  nextButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  pageIndicator: { color: '#7a8299', fontSize: 11, textAlign: 'center' },
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
