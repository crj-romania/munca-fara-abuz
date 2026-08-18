import * as Linking from 'expo-linking';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppButton } from '@/src/components/AppButton';
import { AppScreen } from '@/src/components/AppScreen';
import { AppText } from '@/src/components/AppText';
import { SectionCard } from '@/src/components/SectionCard';
import { useContent } from '@/src/content/ContentProvider';
import {
  getEmergencyContent,
  isPlaceholderValue,
} from '@/src/content/phase2Content';

function contactUrl(action: 'call' | 'url', value: string): string {
  if (action === 'call') {
    return `tel:${value.replace(/[^\d+]/g, '')}`;
  }
  return value;
}

export default function EmergencyScreen() {
  const { t } = useTranslation();
  const { content } = useContent();
  const emergency = getEmergencyContent(content);

  return (
    <AppScreen>
      <Stack.Screen options={{ title: t(emergency.titleKey) }} />
      <AppText variant="title">{t(emergency.titleKey)}</AppText>
      <AppText>{t(emergency.bodyKey)}</AppText>
      {emergency.contacts.map((contact) => {
        const unavailable = isPlaceholderValue(contact.value);
        return (
          <SectionCard key={contact.id}>
            <AppText variant="subtitle">{t(contact.labelKey)}</AppText>
            <AppText>{t(contact.descriptionKey)}</AppText>
            <AppButton
              disabled={unavailable}
              icon="call-outline"
              label={
                unavailable
                  ? t('contact.unavailable')
                  : `${t('emergency.call')} ${contact.value}`
              }
              onPress={() => {
                if (!unavailable) {
                  void Linking.openURL(contactUrl(contact.action, contact.value));
                }
              }}
              variant={contact.primary ? 'primary' : 'secondary'}
            />
          </SectionCard>
        );
      })}
    </AppScreen>
  );
}
