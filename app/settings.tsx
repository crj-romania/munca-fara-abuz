import { useTranslation } from 'react-i18next';

import { AppScreen } from '@/src/components/AppScreen';
import { AppText } from '@/src/components/AppText';
import { LanguageGrid } from '@/src/components/LanguageGrid';
import { SectionCard } from '@/src/components/SectionCard';
import { useContent } from '@/src/content/ContentProvider';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { content } = useContent();

  return (
    <AppScreen>
      <AppText variant="subtitle">{t('settings.language')}</AppText>
      <LanguageGrid />

      <SectionCard>
        <AppText variant="subtitle">{t('settings.about.title')}</AppText>
        <AppText>{t('settings.about.body')}</AppText>
      </SectionCard>

      <SectionCard>
        <AppText variant="subtitle">{t('settings.privacy.title')}</AppText>
        <AppText>{t('settings.privacy.placeholder')}</AppText>
      </SectionCard>

      <SectionCard>
        <AppText variant="label">{t('settings.contentVersion')}</AppText>
        <AppText>{content.index.contentVersion}</AppText>
      </SectionCard>
    </AppScreen>
  );
}

