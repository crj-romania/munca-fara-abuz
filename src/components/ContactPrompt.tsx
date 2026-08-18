import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppButton } from '@/src/components/AppButton';

export function ContactPrompt() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <AppButton
      icon="help-circle-outline"
      label={t('info.contactLink')}
      onPress={() => router.push('/contact')}
      variant="secondary"
    />
  );
}
