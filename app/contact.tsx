import * as Linking from 'expo-linking';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppButton } from '@/src/components/AppButton';
import { AppScreen } from '@/src/components/AppScreen';
import { AppText } from '@/src/components/AppText';
import { SectionCard } from '@/src/components/SectionCard';
import { useContent } from '@/src/content/ContentProvider';
import {
  findInstitution,
  getInstitutionsContent,
  isPlaceholderValue,
} from '@/src/content/phase2Content';

export default function ContactScreen() {
  const { t } = useTranslation();
  const { content } = useContent();
  const foundation = findInstitution(getInstitutionsContent(content), 'foundation');
  const whatsapp = foundation?.whatsapp;
  const email = foundation?.emails['*'];
  const whatsappUnavailable = isPlaceholderValue(whatsapp);
  const emailUnavailable = isPlaceholderValue(email);

  return (
    <AppScreen>
      <Stack.Screen options={{ title: t('contact.title') }} />
      <AppText variant="title">{t('contact.title')}</AppText>
      <AppText>{t('contact.body')}</AppText>
      <SectionCard>
        <AppText variant="subtitle">{t('contact.title')}</AppText>
        <AppText>{t('contact.limits')}</AppText>
      </SectionCard>
      <AppButton
        disabled={whatsappUnavailable}
        icon="logo-whatsapp"
        label={
          whatsappUnavailable
            ? t('contact.unavailable')
            : t('contact.whatsapp')
        }
        onPress={() => {
          if (!whatsappUnavailable && whatsapp) {
            void Linking.openURL(`https://wa.me/${whatsapp.replace(/\D/g, '')}`);
          }
        }}
      />
      <AppButton
        disabled={emailUnavailable}
        icon="mail-outline"
        label={
          emailUnavailable ? t('contact.unavailable') : t('contact.email')
        }
        onPress={() => {
          if (!emailUnavailable && email) {
            void Linking.openURL(`mailto:${email}`);
          }
        }}
        variant="secondary"
      />
    </AppScreen>
  );
}
