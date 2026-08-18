import Ionicons from '@expo/vector-icons/Ionicons';
import { type PropsWithChildren, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/src/components/AppText';
import { useContent } from '@/src/content/ContentProvider';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

type CollapsibleSectionProps = PropsWithChildren<{
  title: string;
  showLabel: string;
  hideLabel: string;
}>;

export function CollapsibleSection({
  children,
  title,
  showLabel,
  hideLabel,
}: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const { currentLanguage } = useContent();

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((current) => !current)}
        style={({ pressed }) => [
          styles.control,
          { flexDirection: currentLanguage.rtl ? 'row-reverse' : 'row' },
          pressed && styles.pressed,
        ]}
      >
        <Ionicons
          color={colors.primary}
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={22}
        />
        <AppText style={styles.title} variant="label">
          {title}
        </AppText>
        <AppText style={styles.action} variant="caption">
          {expanded ? hideLabel : showLabel}
        </AppText>
      </Pressable>
      {expanded ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.white,
  },
  control: {
    minHeight: 56,
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  pressed: {
    backgroundColor: colors.surface,
  },
  title: {
    flex: 1,
  },
  action: {
    color: colors.primary,
  },
  body: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
});
