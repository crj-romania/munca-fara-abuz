import { Redirect, Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useComplaint } from '@/src/complaint/ComplaintProvider';
import { AppButton } from '@/src/components/AppButton';
import { AppScreen } from '@/src/components/AppScreen';
import { AppText } from '@/src/components/AppText';
import { ChoiceCard } from '@/src/components/ChoiceCard';
import {
  findComplaintCategory,
  getComplaintContent,
} from '@/src/content/complaintContent';
import { useContent } from '@/src/content/ContentProvider';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export default function ComplaintViolationsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { content } = useContent();
  const { draft, toggleViolation } = useComplaint();
  const complaint = getComplaintContent(content);
  const category = findComplaintCategory(complaint, draft.categoryId);

  if (!category) {
    return <Redirect href="/complaint" />;
  }

  const emergencySelected = category.violations.some(
    (violation) =>
      violation.emergencyBanner &&
      draft.selectedViolationIds.includes(violation.id),
  );

  return (
    <AppScreen>
      <Stack.Screen options={{ title: t('complaint.violations.title') }} />
      <AppText variant="title">{t('complaint.violations.title')}</AppText>
      <AppText>{t('complaint.violations.description')}</AppText>
      {category.violations.map((violation) => (
        <ChoiceCard
          key={violation.id}
          label={t(violation.labelKey)}
          onPress={() => toggleViolation(violation.id)}
          selected={draft.selectedViolationIds.includes(violation.id)}
        />
      ))}
      {emergencySelected ? (
        <View style={styles.emergency}>
          <AppText variant="label">
            {t('complaint.violations.emergencyTitle')}
          </AppText>
          <AppText>{t('complaint.violations.emergencyBody')}</AppText>
          <AppButton
            icon="warning-outline"
            label={t('home.emergency')}
            onPress={() => router.navigate('/emergency')}
            variant="secondary"
          />
        </View>
      ) : null}
      <AppButton
        icon="arrow-forward"
        label={t('common.continue')}
        onPress={() => {
          router.navigate('/complaint/details');
        }}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  emergency: {
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.danger,
    borderRadius: 14,
    backgroundColor: colors.dangerSurface,
  },
});
