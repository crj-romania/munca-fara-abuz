import { Redirect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppScreen } from '@/src/components/AppScreen';
import { AppText } from '@/src/components/AppText';
import { LanguageGrid } from '@/src/components/LanguageGrid';
import { useContent } from '@/src/content/ContentProvider';

export default function LanguageScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { selectedLanguage } = useContent();

  if (selectedLanguage) {
    return <Redirect href="/home" />;
  }

  return (
    <AppScreen includeTopInset>
      <AppText variant="title">{t('language.title')}</AppText>
      <AppText>{t('language.description')}</AppText>
      <LanguageGrid onApplied={() => router.replace('/home')} />
    </AppScreen>
  );
}

