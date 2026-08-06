import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SceneTag, SceneMood, SCENE_THEMES } from '../data/backgroundThemes';

interface Props {
  tag: SceneTag;
  mood?: SceneMood;
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
  cell: require('../../assets/backgrounds/cell.png'),
  stairs: require('../../assets/backgrounds/stairs.png'),
  alley: require('../../assets/backgrounds/alley.png'),
  visitation: require('../../assets/backgrounds/visitation.png'),
  office: require('../../assets/backgrounds/office.png'),
  warehouse: require('../../assets/backgrounds/warehouse.png'),
  dock: require('../../assets/backgrounds/dock.png'),
  field: require('../../assets/backgrounds/field.png'),
  well: require('../../assets/backgrounds/well.png'),
  square: require('../../assets/backgrounds/square.png'),
};

/**
 * Doc 07 Phase 5: mood-specific variants for the highest-contrast (tag, mood) pairs only —
 * not all 6×5 combos are authored. Same require() literal-string constraint as above, so this
 * stays a flat, explicitly-listed map rather than a computed one. Any (tag, mood) pair missing
 * here falls back to the tag's base "calm" image below.
 */
const MOOD_BACKGROUND_IMAGES: Partial<Record<SceneTag, Partial<Record<SceneMood, number>>>> = {
  city: {
    anger: require('../../assets/backgrounds/city_anger.png'),
    joy: require('../../assets/backgrounds/city_joy.png'),
    sorrow: require('../../assets/backgrounds/city_sorrow.png'),
    fear: require('../../assets/backgrounds/city_fear.png'),
  },
  indoor: {
    anger: require('../../assets/backgrounds/indoor_anger.png'),
    sorrow: require('../../assets/backgrounds/indoor_sorrow.png'),
    fear: require('../../assets/backgrounds/indoor_fear.png'),
  },
  market: {
    anger: require('../../assets/backgrounds/market_anger.png'),
    joy: require('../../assets/backgrounds/market_joy.png'),
  },
  social: {
    anger: require('../../assets/backgrounds/social_anger.png'),
    joy: require('../../assets/backgrounds/social_joy.png'),
  },
  danger: { anger: require('../../assets/backgrounds/danger_anger.png') },
  forest: { fear: require('../../assets/backgrounds/forest_fear.png') },
};

export default function BackgroundScene({ tag, mood, children }: Props) {
  const theme = SCENE_THEMES[tag];
  const source = (mood && MOOD_BACKGROUND_IMAGES[tag]?.[mood]) ?? BACKGROUND_IMAGES[tag];
  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient colors={theme.gradient} style={StyleSheet.absoluteFill} />
      <Image source={source} style={styles.backgroundImage} resizeMode="cover" />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  // react-native-web bakes the require()'d asset's real pixel size (e.g. 768x1376)
  // into the Image's wrapper div. StyleSheet.absoluteFill alone only sets
  // top/left/right/bottom: 0, which loses to that explicit width/height in an
  // over-constrained CSS box — the image ends up pinned at native size in the
  // top-left corner instead of covering the screen. Forcing 100%/100% here wins.
  backgroundImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
});
