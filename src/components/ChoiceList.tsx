import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

interface Props {
  choices: string[];
  onSelect: (index: number) => void;
  disabled?: boolean;
}

export default function ChoiceList({ choices, onSelect, disabled }: Props) {
  return (
    <>
      {choices.map((choice, index) => (
        <Pressable
          key={`${index}-${choice}`}
          disabled={disabled}
          onPress={() => onSelect(index)}
          style={({ pressed }) => [styles.choice, pressed && styles.choicePressed, disabled && styles.choiceDisabled]}
        >
          <Text style={styles.choiceText}>{choice}</Text>
        </Pressable>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  choice: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.35)',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 8,
  },
  choicePressed: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  choiceDisabled: {
    opacity: 0.5,
  },
  choiceText: {
    color: '#fff',
    fontSize: 15,
  },
});
