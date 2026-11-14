import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { track } from '@/src/analytics/analytics';
import { useComplaint } from '@/src/complaint/ComplaintProvider';
import { AppScreen } from '@/src/components/AppScreen';
import { AppText } from '@/src/components/AppText';
import { ContentListItem } from '@/src/components/ContentListItem';
import { SectionCard } from '@/src/components/SectionCard';
import {
  getComplaintContent,
  getInitialCategoryValues,
  isPhase3CategoryAvailable,
} from '@/src/content/complaintContent';
import { useContent } from '@/src/content/ContentProvider';

export default function ComplaintCategoryScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { content, currentLanguage } = useContent();
  const { startComplaint } = useComplaint();
  const complaint = getComplaintContent(content);

  return (
    <AppScreen>
      <Stack.Screen options={{ title: t('complaint.category.title') }} />
      <AppText variant="title">{t('complaint.category.title')}</AppText>
      <AppText>{t('complaint.category.description')}</AppText>
      {complaint.categories.map((category) => {
        const available = isPhase3CategoryAvailable(category);
        if (!available) {
          return (
            <SectionCard key={category.id}>
              <AppText variant="label">{t(category.labelKey)}</AppText>
              <AppText variant="caption">
                {t('complaint.category.translationRequired')}
              </AppText>
            </SectionCard>
          );
        }
        return (
          <ContentListItem
            icon="document-text-outline"
            key={category.id}
            label={t(category.labelKey)}
            onPress={() => {
              track('complaint_started', { categoryId: category.id });
              startComplaint(category.id, category.suggestedPartyIds, currentLanguage.code,
                getInitialCategoryValues(category));
              // What happened comes first; personal details are asked only afterwards.
              router.navigate(category.violations.length ? '/complaint/violations' : '/complaint/details');
            }}
          />
        );
      })}
    </AppScreen>
  );
}
