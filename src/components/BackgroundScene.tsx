import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SceneTag, SCENE_THEMES } from '../data/backgroundThemes';

interface Props {
  tag: SceneTag;
  children?: React.ReactNode;
}

/**
 * Doc 07 Phase 4: one static art asset per SceneTag, layered over the gradient.
 * Metro needs a literal string per require() call, so this can't be built from
 * a template — each tag is listed explicitly. Swap the placeholder PNGs in
 * assets/backgrounds/ for real art (same filenames) and it picks them up with
 * no code change; the gradient stays as a permanent fallback underneath in case
 * an asset is missing or fails to load.
 */
const BACKGROUND_IMAGES: Record<SceneTag, number> = {
  city: require('../../assets/backgrounds/city.png'),
  forest: require('../../assets/backgrounds/forest.png'),
  market: require('../../assets/backgrounds/market.png'),
  danger: require('../../assets/backgrounds/danger.png'),
  social: require('../../assets/backgrounds/social.png'),
  indoor: require('../../assets/backgrounds/indoor.png'),
};

export default function BackgroundScene({ tag, children }: Props) {
  const theme = SCENE_THEMES[tag];
  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient colors={theme.gradient} style={StyleSheet.absoluteFill} />
      <Image source={BACKGROUND_IMAGES[tag]} style={StyleSheet.absoluteFill} resizeMode="cover" />
      {children}
    </View>
  );
}
