import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { AppText } from '@/src/components/AppText';
import { useContent } from '@/src/content/ContentProvider';
import i18n from '@/src/i18n/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

type LanguageGridProps = {
  onApplied?: () => void;
};

function waitForIndicator(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 500));
}

export function LanguageGrid({ onApplied }: LanguageGridProps) {
  const { applyLanguage, content, currentLanguage, selectedLanguage } = useContent();
  const [applyingCode, setApplyingCode] = useState<string | null>(null);

  async function handleLanguagePress(languageCode: string) {
    setApplyingCode(languageCode);
    try {
      await i18n.changeLanguage(languageCode);
      await waitForIndicator();
      const reloading = await applyLanguage(languageCode);
      if (!reloading) {
        onApplied?.();
      }
    } catch {
      // Keep language selection usable if persistence or native reload fails.
    } finally {
      setApplyingCode(null);
    }
  }

  return (
    <>
      <View
        style={[
          styles.grid,
          { flexDirection: currentLanguage.rtl ? 'row-reverse' : 'row' },
        ]}
      >
        {content.index.languages.map((language) => {
          const label = i18n.getFixedT(language.code)('language.selfName');
          const selected = selectedLanguage === language.code;

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected }}
              disabled={applyingCode !== null}
              key={language.code}
              onPress={() => void handleLanguagePress(language.code)}
              style={({ pressed }) => [
                styles.language,
                selected && styles.selected,
                pressed && styles.pressed,
              ]}
            >
              <AppText
                languageCode={language.code}
                variant="label"
                style={styles.languageLabel}
              >
                {label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {applyingCode ? (
        <View accessibilityLiveRegion="polite" style={styles.overlay}>
          <ActivityIndicator color={colors.primary} size="large" />
          <AppText languageCode={applyingCode} variant="label">
            {i18n.getFixedT(applyingCode)('language.applying')}
          </AppText>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  language: {
    minHeight: 72,
    minWidth: 132,
    flexGrow: 1,
    flexBasis: '44%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  pressed: {
    borderColor: colors.primary,
  },
  languageLabel: {
    textAlign: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.overlay,
  },
});
