import type { PropsWithChildren } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TestBanner } from '@/src/components/TestBanner';
import { useContent } from '@/src/content/ContentProvider';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

type AppScreenProps = PropsWithChildren<{
  includeTopInset?: boolean;
  contentStyle?: ViewStyle;
}>;

export function AppScreen({
  children,
  includeTopInset = false,
  contentStyle,
}: AppScreenProps) {
  const { currentLanguage } = useContent();

  return (
    <SafeAreaView
      edges={includeTopInset ? ['top', 'right', 'bottom', 'left'] : ['right', 'bottom', 'left']}
      style={styles.safeArea}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.content,
            { direction: currentLanguage.rtl ? 'rtl' : 'ltr' },
            contentStyle,
          ]}
        >
          <TestBanner />
          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    padding: spacing.lg,
    gap: spacing.lg,
  },
});

