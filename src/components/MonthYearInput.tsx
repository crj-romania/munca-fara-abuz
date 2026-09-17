import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/src/components/AppButton';
import { AppText } from '@/src/components/AppText';
import { colors } from '@/src/theme/colors';
import type { ComplaintField } from '@/src/types/content';
import { spacing } from '@/src/theme/spacing';

type Props = { field: ComplaintField; value: string; onChange: (value: string) => void };

export function MonthYearInput({ field, value, onChange }: Props) {
  const { t } = useTranslation();
  const [unit, setUnit] = useState<'month' | 'year' | null>(null);
  const unknown = value === 'unknown';
  const [year = '', month = ''] = unknown ? [] : value.split('-');
  const thisYear = new Date().getFullYear();
  const maxYear = thisYear + (field.notFuture ? 0 : 5);
  const monthOptions = Array.from({ length: 12 }, (_, index) => ({
    value: String(index + 1).padStart(2, '0'), label: t(`complaint.month.${index + 1}`),
  }));
  const yearOptions = Array.from({ length: maxYear - (thisYear - 100) + 1 }, (_, index) => ({
    value: String(maxYear - index), label: String(maxYear - index),
  }));
  return (
    <View style={styles.group}>
      {!unknown ? (
        <>
          <AppButton variant="secondary" onPress={() => setUnit('month')}
            label={`${t('complaint.form.month')}: ${monthOptions.find((option) => option.value === month)?.label ?? t('complaint.form.choose')}`} />
          <AppButton variant="secondary" onPress={() => setUnit('year')}
            label={`${t('complaint.form.year')}: ${year || t('complaint.form.choose')}`} />
        </>
      ) : <AppText>{t('complaint.form.dateUnknown')}</AppText>}
      <AppButton label={unknown ? t('complaint.form.choose') : t('complaint.form.dateUnknown')}
        variant="secondary" onPress={() => onChange(unknown ? '' : 'unknown')} />
      <Modal visible={unit !== null} animationType="slide" onRequestClose={() => setUnit(null)}>
        <SafeAreaView style={styles.modal}>
          <AppText variant="subtitle">{t(field.labelKey)}</AppText>
          <AppText variant="title">{t(unit === 'month' ? 'complaint.form.month' : 'complaint.form.year')}</AppText>
          <FlatList data={unit === 'month' ? monthOptions : yearOptions}
            keyExtractor={(option) => option.value} renderItem={({ item }) => (
              <Pressable accessibilityRole="button" style={styles.option} onPress={() => {
                onChange(unit === 'month' ? `${year}-${item.value}` : `${item.value}-${month}`);
                setUnit(null);
              }}><AppText>{item.label}</AppText></Pressable>
            )} />
          <AppButton variant="secondary" label={t('common.cancel')} onPress={() => setUnit(null)} />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  modal: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, gap: spacing.md },
  option: { minHeight: 52, justifyContent: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
});
