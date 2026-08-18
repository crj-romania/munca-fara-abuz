import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/src/components/AppButton';
import { AppScreen } from '@/src/components/AppScreen';
import { AppText } from '@/src/components/AppText';
import { CollapsibleSection } from '@/src/components/CollapsibleSection';
import { ContactPrompt } from '@/src/components/ContactPrompt';
import { ContentListItem } from '@/src/components/ContentListItem';
import { SectionCard } from '@/src/components/SectionCard';
import { useContent } from '@/src/content/ContentProvider';
import {
  findInstitution,
  getInfoContent,
  getInstitutionsContent,
  isInfoBranch,
  isPlaceholderValue,
  resolveInfoPath,
} from '@/src/content/phase2Content';
import { buildInfoHref } from '@/src/navigation/infoRoutes';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

function normalizePath(path: string | string[] | undefined): string[] {
  if (Array.isArray(path)) {
    return path.filter(Boolean);
  }
  return path ? path.split('/').filter(Boolean) : [];
}

export default function InfoPathScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { path } = useLocalSearchParams<{ path?: string | string[] }>();
  const { content, currentLanguage } = useContent();
  const segments = normalizePath(path).map(decodeURIComponent);
  const info = getInfoContent(content);
  const node = resolveInfoPath(info, segments);

  if (!node) {
    return (
      <AppScreen>
        <Stack.Screen options={{ title: t('info.title') }} />
        <AppText variant="title">{t('info.title')}</AppText>
        <AppText>{t('info.notFound')}</AppText>
        <AppButton label={t('common.back')} onPress={() => router.back()} />
        <ContactPrompt />
      </AppScreen>
    );
  }

  const title = t(node.labelKey);

  if (isInfoBranch(node)) {
    return (
      <AppScreen>
        <Stack.Screen options={{ title }} />
        <AppText variant="title">{title}</AppText>
        <AppText>{t('info.list.title')}</AppText>
        {node.items.map((item) => (
          <ContentListItem
            icon={
              ('icon' in item && item.icon
                ? item.icon
                : 'document-text-outline') as ComponentProps<typeof Ionicons>['name']
            }
            key={item.id}
            label={t(item.labelKey)}
            onPress={() => router.push(buildInfoHref([...segments, item.id]))}
          />
        ))}
        <ContactPrompt />
      </AppScreen>
    );
  }

  const institutions = getInstitutionsContent(content);
  const relevantInstitutions = node.institutionIds
    .map((id) => findInstitution(institutions, id))
    .filter((institution) => institution !== null);

  return (
    <AppScreen>
      <Stack.Screen options={{ title }} />
      <AppText variant="title">{title}</AppText>
      <SectionCard>
        <AppText variant="subtitle">{t('info.card.title')}</AppText>
        <AppText>{t(node.bodyKey)}</AppText>
      </SectionCard>

      <SectionCard>
        <AppText variant="subtitle">{t('info.steps.title')}</AppText>
        {node.steps.map((stepKey, index) => (
          <View
            key={`${stepKey}-${index}`}
            style={[
              styles.step,
              { flexDirection: currentLanguage.rtl ? 'row-reverse' : 'row' },
            ]}
          >
            <View style={styles.stepNumber}>
              <AppText style={styles.stepNumberText} variant="label">
                {index + 1}
              </AppText>
            </View>
            <AppText style={styles.stepText}>{t(stepKey)}</AppText>
          </View>
        ))}
      </SectionCard>

      {relevantInstitutions.length > 0 ? (
        <SectionCard>
          <AppText variant="subtitle">{t('info.institutions.title')}</AppText>
          {relevantInstitutions.map((institution) => {
            const generalEmail = institution.emails['*'];
            return (
              <View key={institution.id} style={styles.institution}>
                <AppText variant="label">{t(institution.labelKey)}</AppText>
                {!isPlaceholderValue(generalEmail) ? (
                  <AppText>{generalEmail}</AppText>
                ) : null}
              </View>
            );
          })}
        </SectionCard>
      ) : null}

      <CollapsibleSection
        hideLabel={t('info.hide')}
        showLabel={t('info.show')}
        title={t('info.legalBasis.title')}
      >
        <AppText>{node.refs}</AppText>
      </CollapsibleSection>
      <ContactPrompt />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  step: {
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  stepNumber: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: colors.primary,
  },
  stepNumberText: {
    color: colors.white,
    textAlign: 'center',
  },
  stepText: {
    flex: 1,
  },
  institution: {
    gap: spacing.xs,
  },
});
