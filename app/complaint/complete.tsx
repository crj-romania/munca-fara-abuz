import { Redirect, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useComplaint } from '@/src/complaint/ComplaintProvider';
import { AppButton } from '@/src/components/AppButton';
import { AppScreen } from '@/src/components/AppScreen';
import { AppText } from '@/src/components/AppText';
import { SectionCard } from '@/src/components/SectionCard';

export default function ComplaintCompleteScreen() {
  const router = useRouter();
  const { action } = useLocalSearchParams<{ action?: string }>();
  const { t } = useTranslation();
  const { generated, clearComplaint } = useComplaint();

  if (!generated) {
    return <Redirect href="/home" />;
  }

  const titleKey =
    action === 'email'
      ? 'complaint.complete.emailTitle'
      : 'complaint.complete.savedTitle';
  const bodyKey =
    action === 'email'
      ? 'complaint.complete.emailBody'
      : 'complaint.complete.savedBody';

  return (
    <AppScreen>
      <Stack.Screen
        options={{ headerBackVisible: false, title: t(titleKey) }}
      />
      <AppText variant="title">{t(titleKey)}</AppText>
      <SectionCard>
        <AppText>{t(bodyKey)}</AppText>
        <AppText>{t('complaint.complete.localCopy')}</AppText>
      </SectionCard>
      <AppButton
        icon="folder-open-outline"
        label={t('home.documents')}
        onPress={() => {
          clearComplaint();
          router.replace('/documents');
        }}
      />
      <AppButton
        icon="home-outline"
        label={t('complaint.complete.home')}
        onPress={() => {
          clearComplaint();
          router.dismissTo('/home');
        }}
        variant="secondary"
      />
    </AppScreen>
  );
}
