import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/src/components/AppText';
import { useContent } from '@/src/content/ContentProvider';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

type ChoiceCardProps = {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  description?: string;
  onPress: () => void;
};

export function ChoiceCard({
  label,
  selected = false,
  disabled = false,
  description,
  onPress,
}: ChoiceCardProps) {
  const { currentLanguage } = useContent();

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.selected,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.row,
          { flexDirection: currentLanguage.rtl ? 'row-reverse' : 'row' },
        ]}
      >
        <Ionicons
          color={selected ? colors.white : colors.primary}
          name={selected ? 'checkmark-circle' : 'ellipse-outline'}
          size={26}
        />
        <View style={styles.text}>
          <AppText
            variant="label"
            style={selected ? styles.selectedText : undefined}
          >
            {label}
          </AppText>
          {description ? (
            <AppText
              variant="caption"
              style={selected ? styles.selectedText : styles.description}
            >
              {description}
            </AppText>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 62,
    justifyContent: 'center',
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.white,
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  disabled: {
    opacity: 0.52,
  },
  pressed: {
    opacity: 0.78,
  },
  row: {
    alignItems: 'center',
    gap: spacing.md,
  },
  text: {
    flex: 1,
    gap: spacing.xs,
  },
  description: {
    color: colors.muted,
  },
  selectedText: {
    color: colors.white,
  },
});
