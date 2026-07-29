import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SceneTag, SCENE_THEMES } from '../data/backgroundThemes';

interface Props {
  tag: SceneTag;
  children?: React.ReactNode;
}

export default function BackgroundScene({ tag, children }: Props) {
  const theme = SCENE_THEMES[tag];
  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient colors={theme.gradient} style={StyleSheet.absoluteFill} />
      {children}
    </View>
  );
}
