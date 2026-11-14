import * as Linking from 'expo-linking';
import { useTranslation } from 'react-i18next';

import { AppScreen } from '@/src/components/AppScreen';
import { AppText } from '@/src/components/AppText';
import { AppButton } from '@/src/components/AppButton';
import { DeleteAllData } from '@/src/components/DeleteAllData';
import { LanguageGrid } from '@/src/components/LanguageGrid';
import { SectionCard } from '@/src/components/SectionCard';
import { StatisticsSetting } from '@/src/components/StatisticsConsent';
import { APP_VERSION_LABEL } from '@/src/config/build';
import { CONTENT_BASE_URL } from '@/src/config/content';
import { useContent } from '@/src/content/ContentProvider';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { content } = useContent();
  // The public (Romanian/English) policy is published next to the remote content.
  const privacyUrl = CONTENT_BASE_URL ? `${CONTENT_BASE_URL.replace(/\/+$/, '')}/privacy/` : '';

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
        <AppText>{t('settings.privacy.summary')}</AppText>
        {privacyUrl ? (
          <AppButton icon="open-outline" label={t('settings.privacy.open')} variant="secondary"
            onPress={() => void Linking.openURL(privacyUrl).catch(() => {})} />
        ) : null}
      </SectionCard>

      <StatisticsSetting />

      <DeleteAllData />

      <SectionCard>
        <AppText variant="label">{t('settings.contentVersion')}</AppText>
        <AppText>{content.index.contentVersion}</AppText>
        {APP_VERSION_LABEL ? (
          <>
            <AppText variant="label">{t('settings.appVersion')}</AppText>
            <AppText>{APP_VERSION_LABEL}</AppText>
          </>
        ) : null}
      </SectionCard>
    </AppScreen>
  );
}

