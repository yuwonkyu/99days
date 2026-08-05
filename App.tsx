import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Character } from './src/types/character';
import { AudioProvider } from './src/engine/audioContext';
import HomeScreen from './src/screens/HomeScreen';
import RecordsScreen from './src/screens/RecordsScreen';
import CharacterCreationScreen from './src/screens/CharacterCreationScreen';
import GameScreen from './src/screens/GameScreen';

type Screen = 'home' | 'creation' | 'game' | 'records';

// Portrait frame used to letterbox the game on wide desktop windows so it
// always reads as a mobile screen. width/height ratio, mobile-standard 9:16.
const FRAME_ASPECT_RATIO = 9 / 16;
const FRAME_MAX_WIDTH = 480;
// Below this window width we assume it's a real phone browser (not a desktop
// tab) and skip letterboxing entirely so the game fills the device edge-to-edge.
const DESKTOP_BREAKPOINT = 600;

function useFrameSize() {
  const { width: winW, height: winH } = useWindowDimensions();
  if (winW < DESKTOP_BREAKPOINT) {
    return { width: winW, height: winH };
  }
  const widthFromHeight = winH * FRAME_ASPECT_RATIO;
  const width = Math.min(winW, widthFromHeight, FRAME_MAX_WIDTH);
  return { width, height: width / FRAME_ASPECT_RATIO };
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [pendingCharacter, setPendingCharacter] = useState<Character | null>(null);
  const frameSize = useFrameSize();

  return (
    <AudioProvider>
      <View style={styles.page}>
        <SafeAreaView style={[styles.container, frameSize]}>
          <StatusBar style="light" />
          {screen === 'home' && (
            <HomeScreen
              onContinue={() => {
                setPendingCharacter(null);
                setScreen('game');
              }}
              onNewGame={() => setScreen('creation')}
              onRecords={() => setScreen('records')}
            />
          )}
          {screen === 'creation' && (
            <CharacterCreationScreen
              onStart={(character) => {
                setPendingCharacter(character);
                setScreen('game');
              }}
            />
          )}
          {screen === 'game' && (
            <GameScreen
              initialCharacter={pendingCharacter}
              onEnded={() => {
                setPendingCharacter(null);
                setScreen('home');
              }}
            />
          )}
          {screen === 'records' && <RecordsScreen onBack={() => setScreen('home')} />}
        </SafeAreaView>
      </View>
    </AudioProvider>
  );
}

const styles = StyleSheet.create({
  // Fills the real browser window and centers a phone-shaped box so the game
  // always reads as a portrait mobile screen, even on a wide/tall desktop tab.
  page: {
    flex: 1,
    backgroundColor: '#05060a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    backgroundColor: '#161a24',
    overflow: 'hidden',
  },
});
