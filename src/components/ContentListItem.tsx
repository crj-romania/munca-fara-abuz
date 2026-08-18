import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/src/components/AppText';
import { useContent } from '@/src/content/ContentProvider';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

type ContentListItemProps = {
  label: string;
  onPress: () => void;
  icon?: ComponentProps<typeof Ionicons>['name'];
};

export function ContentListItem({
  label,
  onPress,
  icon = 'information-circle-outline',
}: ContentListItemProps) {
  const { currentLanguage } = useContent();

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View
        style={[
          styles.content,
          { flexDirection: currentLanguage.rtl ? 'row-reverse' : 'row' },
        ]}
      >
        <Ionicons color={colors.primary} name={icon} size={28} />
        <AppText style={styles.label} variant="label">
          {label}
        </AppText>
        <Ionicons
          color={colors.primary}
          name={currentLanguage.rtl ? 'chevron-back' : 'chevron-forward'}
          size={24}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 68,
    justifyContent: 'center',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.white,
  },
  pressed: {
    backgroundColor: colors.surface,
  },
  content: {
    alignItems: 'center',
    gap: spacing.md,
  },
  label: {
    flex: 1,
  },
});
