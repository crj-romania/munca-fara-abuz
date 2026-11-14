import * as Linking from 'expo-linking';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { APP_VERSION_LABEL, FEEDBACK_URL, IS_TEST_BUILD } from '@/src/config/build';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

// Visible on every screen of test builds, so testers (and screenshots) are never
// mistaken for the published app. "TEST" and "Feedback" are left untranslated on
// purpose: the banner is for the test team, not for end users.
export function TestBanner() {
  if (!IS_TEST_BUILD) return null;

  const row = (
    <View style={styles.row}>
      <Text style={styles.text}>{APP_VERSION_LABEL ? `TEST · v${APP_VERSION_LABEL}` : 'TEST'}</Text>
      {FEEDBACK_URL ? <Text style={[styles.text, styles.link]}>Feedback ›</Text> : null}
    </View>
  );

  if (!FEEDBACK_URL) {
    return <View style={styles.banner}>{row}</View>;
  }

  return (
    <Pressable
      accessibilityLabel="Feedback"
      accessibilityRole="link"
      onPress={() => void Linking.openURL(FEEDBACK_URL).catch(() => {})}
      style={({ pressed }) => [styles.banner, pressed && styles.pressed]}
    >
      {row}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.dangerSurface,
    borderColor: colors.danger,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  pressed: {
    opacity: 0.7,
  },
  row: {
    alignItems: 'center',
    direction: 'ltr',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  text: {
    color: colors.danger,
    fontFamily: 'NotoSans_700Bold',
    fontSize: 13,
  },
  link: {
    textDecorationLine: 'underline',
  },
});
