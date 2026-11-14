import { useTranslation } from 'react-i18next';

import {
  analyticsAvailable,
  setAnalyticsConsent,
  useAnalyticsConsent,
} from '@/src/analytics/analytics';
import { AppButton } from '@/src/components/AppButton';
import { AppText } from '@/src/components/AppText';
import { SectionCard } from '@/src/components/SectionCard';

// Asked once, on the home screen; nothing is sent before a "yes".
export function StatisticsConsentPrompt() {
  const { t } = useTranslation();
  const { consent, loaded } = useAnalyticsConsent();
  if (!analyticsAvailable || !loaded || consent !== 'unset') return null;
  return (
    <SectionCard>
      <AppText variant="subtitle">{t('stats.title')}</AppText>
      <AppText>{t('stats.body')}</AppText>
      <AppButton icon="checkmark-outline" label={t('stats.yes')}
        onPress={() => void setAnalyticsConsent('granted')} />
      <AppButton label={t('stats.no')} variant="secondary"
        onPress={() => void setAnalyticsConsent('denied')} />
    </SectionCard>
  );
}

export function StatisticsSetting() {
  const { t } = useTranslation();
  const { consent } = useAnalyticsConsent();
  if (!analyticsAvailable) return null;
  const on = consent === 'granted';
  return (
    <SectionCard>
      <AppText variant="subtitle">{t('stats.settingsTitle')}</AppText>
      <AppText>{t(on ? 'stats.on' : 'stats.off')}</AppText>
      <AppText variant="caption">{t('stats.body')}</AppText>
      <AppButton label={t(on ? 'stats.turnOff' : 'stats.turnOn')} variant="secondary"
        onPress={() => void setAnalyticsConsent(on ? 'denied' : 'granted')} />
    </SectionCard>
  );
}
