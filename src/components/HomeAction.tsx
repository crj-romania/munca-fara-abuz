import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/src/components/AppText';
import { useContent } from '@/src/content/ContentProvider';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

type HomeActionProps = {
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  danger?: boolean;
  disabled?: boolean;
  onPress?: () => void;
};

export function HomeAction({
  label,
  icon,
  danger = false,
  disabled = false,
  onPress,
}: HomeActionProps) {
  const { currentLanguage } = useContent();
  const foreground = danger ? colors.danger : colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        danger && styles.dangerCard,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View
        style={[
          styles.content,
          { flexDirection: currentLanguage.rtl ? 'row-reverse' : 'row' },
        ]}
      >
        <Ionicons color={foreground} name={icon} size={34} />
        <AppText variant="subtitle" style={{ color: foreground, flex: 1 }}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 88,
    justifyContent: 'center',
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 16,
    backgroundColor: colors.white,
  },
  dangerCard: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerSurface,
  },
  pressed: {
    opacity: 0.78,
  },
  disabled: {
    opacity: 0.62,
  },
  content: {
    alignItems: 'center',
    gap: spacing.md,
  },
});
