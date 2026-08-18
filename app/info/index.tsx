import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppScreen } from '@/src/components/AppScreen';
import { AppText } from '@/src/components/AppText';
import { ContactPrompt } from '@/src/components/ContactPrompt';
import { ContentListItem } from '@/src/components/ContentListItem';
import { useContent } from '@/src/content/ContentProvider';
import { getInfoContent } from '@/src/content/phase2Content';
import { buildInfoHref } from '@/src/navigation/infoRoutes';

export default function InfoCategoriesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { content } = useContent();
  const info = getInfoContent(content);

  return (
    <AppScreen>
      <Stack.Screen options={{ title: t('info.title') }} />
      <AppText variant="title">{t('info.title')}</AppText>
      <AppText>{t('info.list.title')}</AppText>
      {info.categories.map((category) => (
        <ContentListItem
          icon={category.icon as ComponentProps<typeof Ionicons>['name']}
          key={category.id}
          label={t(category.labelKey)}
          onPress={() => router.push(buildInfoHref([category.id]))}
        />
      ))}
      <ContactPrompt />
    </AppScreen>
  );
}
