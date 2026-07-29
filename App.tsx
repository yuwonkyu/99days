import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet } from 'react-native';
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
    return <SafeAreaView style={styles.container} />;
  }

  return (
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#161a24' },
});
