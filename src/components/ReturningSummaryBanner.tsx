import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface Props {
  summary: string;
  onDismiss: () => void;
}

export default function ReturningSummaryBanner({ summary, onDismiss }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{summary}</Text>
      <Pressable onPress={onDismiss} style={styles.closeButton}>
        <Text style={styles.closeText}>확인</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  text: {
    color: '#f0e6c8',
    fontSize: 13,
    flex: 1,
  },
  closeButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  closeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
