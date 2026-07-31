import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { Character } from './src/types/character';
import { loadGameState } from './src/engine/gameStateStore';
import CharacterCreationScreen from './src/screens/CharacterCreationScreen';
import GameScreen from './src/screens/GameScreen';

type Screen = 'boot' | 'creation' | 'game';

export default function App() {
  const [screen, setScreen] = useState<Screen>('boot');
  const [pendingCharacter, setPendingCharacter] = useState<Character | null>(null);

  useEffect(() => {
    (async () => {
      const saved = await loadGameState();
      setScreen(saved && !saved.isEnded ? 'game' : 'creation');
    })();
  }, []);

  if (screen === 'boot') {
    return (
      <View style={styles.page}>
        <SafeAreaView style={styles.container} />
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        {screen === 'creation' ? (
          <CharacterCreationScreen
            onStart={(character) => {
              setPendingCharacter(character);
              setScreen('game');
            }}
          />
        ) : (
          <GameScreen
            initialCharacter={pendingCharacter}
            onEnded={() => {
              setPendingCharacter(null);
              setScreen('creation');
            }}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Fills the real browser window and centers a phone-sized column so the
  // game always reads as a portrait mobile screen, even on a wide desktop tab.
  page: {
    flex: 1,
    backgroundColor: '#05060a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: { flex: 1, width: '100%', maxWidth: 480, backgroundColor: '#161a24' },
});
