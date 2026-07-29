import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Character } from '../types/character';
import { generateRandomCharacter, randomCharacterName } from '../engine/characterGen';
import { getRegion } from '../data/origins';

interface Props {
  onStart: (character: Character) => void;
}

export default function CharacterCreationScreen({ onStart }: Props) {
  const [character, setCharacter] = useState<Character>(() => generateRandomCharacter());
  const [nameInput, setNameInput] = useState(character.name);

  const reroll = () => {
    const fresh = generateRandomCharacter({ nameOverride: nameInput });
    setCharacter(fresh);
  };

  const randomizeName = () => {
    const name = randomCharacterName(character.regionId, character.gender);
    setNameInput(name);
    setCharacter({ ...character, name });
  };

  const onChangeName = (text: string) => {
    setNameInput(text);
    setCharacter({ ...character, name: text.trim() || character.name });
  };

  const region = getRegion(character.regionId);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>99days</Text>
        <Text style={styles.subtitle}>새로운 삶이 시작됩니다.</Text>

        <View style={styles.nameRow}>
          <TextInput
            style={styles.nameInput}
            value={nameInput}
            onChangeText={onChangeName}
            placeholder="이름"
            placeholderTextColor="#8890a0"
          />
          <Pressable style={styles.diceButton} onPress={randomizeName}>
            <Text style={styles.diceText}>🎲</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLine}>
            {character.age}세 · {character.gender === 'male' ? '남성' : '여성'} · {region.label}
          </Text>
          <Text style={styles.cardLine}>
            {character.job} · {character.personality} 성격
          </Text>
          <Text style={styles.cardLine}>
            키 {character.bodyType.heightCm}cm · 몸무게 {character.bodyType.weightKg}kg
          </Text>
          {character.isHybrid && <Text style={styles.tag}>돌연변이 혼종</Text>}
          {character.isTalented && <Text style={styles.tag}>재능형</Text>}

          <View style={styles.statsBlock}>
            <Text style={styles.statLine}>힘 {character.stats.STR} · 지력 {character.stats.INT}</Text>
            <Text style={styles.statLine}>민첩 {character.stats.AGI} · 행운 {character.stats.LUK}</Text>
            <Text style={styles.statLine}>
              체력 {character.hp}/{character.maxHp}
            </Text>
          </View>
        </View>

        <Pressable style={styles.rerollButton} onPress={reroll}>
          <Text style={styles.rerollText}>다른 인물로 다시 태어나기</Text>
        </Pressable>

        <Pressable style={styles.startButton} onPress={() => onStart(character)}>
          <Text style={styles.startText}>이 삶을 시작한다</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#161a24' },
  scroll: { padding: 24, alignItems: 'center', paddingTop: 64 },
  title: { color: '#fff', fontSize: 32, fontWeight: '800', letterSpacing: 2 },
  subtitle: { color: '#9aa2b8', fontSize: 14, marginTop: 6, marginBottom: 24 },
  nameRow: { flexDirection: 'row', width: '100%', maxWidth: 360, gap: 8 },
  nameInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    color: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  diceButton: {
    width: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  diceText: { fontSize: 18 },
  card: {
    width: '100%',
    maxWidth: 360,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  cardLine: { color: '#e6e9f2', fontSize: 14, marginTop: 4 },
  tag: {
    color: '#e8c468',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
  },
  statsBlock: { marginTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)', paddingTop: 12 },
  statLine: { color: '#c8ccd8', fontSize: 13, marginTop: 2 },
  rerollButton: {
    marginTop: 18,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  rerollText: { color: '#9aa2b8', fontSize: 13, textDecorationLine: 'underline' },
  startButton: {
    marginTop: 8,
    width: '100%',
    maxWidth: 360,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#e8c468',
    alignItems: 'center',
  },
  startText: { color: '#20242f', fontSize: 16, fontWeight: '800' },
});
