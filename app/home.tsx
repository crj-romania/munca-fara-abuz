import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppButton } from '@/src/components/AppButton';
import { AppScreen } from '@/src/components/AppScreen';
import { AppText } from '@/src/components/AppText';
import { HomeAction } from '@/src/components/HomeAction';
import { SectionCard } from '@/src/components/SectionCard';
import { useContent } from '@/src/content/ContentProvider';

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { content } = useContent();

  return (
    <AppScreen>
      <AppText variant="title">{t('home.title')}</AppText>
      <HomeAction
        icon="book-outline"
        label={t('home.info')}
        onPress={() => router.push('/info')}
      />
      <HomeAction
        icon="document-text-outline"
        label={t('home.problem')}
        onPress={() => router.push('/complaint')}
      />
      <HomeAction
        danger
        icon="warning-outline"
        label={t('home.emergency')}
        onPress={() => router.push('/emergency')}
      />

      <AppButton
        icon="settings-outline"
        label={t('home.settings')}
        onPress={() => router.push('/settings')}
        variant="secondary"
      />
      <AppButton
        icon="folder-open-outline"
        label={t('home.documents')}
        onPress={() => router.push('/documents')}
        variant="secondary"
      />

      <SectionCard>
        <AppText variant="caption">{t('home.disclaimer')}</AppText>
        <AppText variant="caption">
          {t('home.legalUpdatedAt', {
            date: content.index.legalUpdatedAt,
          })}
        </AppText>
      </SectionCard>
    </AppScreen>
  );
}
