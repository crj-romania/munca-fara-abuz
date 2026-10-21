import { Redirect, Stack, useRouter, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useComplaint } from '@/src/complaint/ComplaintProvider';
import { getCountyName } from '@/src/complaint/counties';
import { getCurrentTranslation, getNarrativeError, getNarrativeFields } from '@/src/complaint/freeText';
import { AttachmentList } from '@/src/components/AttachmentList';
import { AppButton } from '@/src/components/AppButton';
import { AppScreen } from '@/src/components/AppScreen';
import { AppText } from '@/src/components/AppText';
import { SectionCard } from '@/src/components/SectionCard';
import {
  findComplaintCategory, getCategoryWorkFields, getComplaintContent, getComplaintFieldError, getVisibleComplaintFields,
} from '@/src/content/complaintContent';
import { useContent } from '@/src/content/ContentProvider';
import type { ComplaintField } from '@/src/types/content';
import { colors } from '@/src/theme/colors';

export default function ComplaintReviewScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { content } = useContent();
  const { draft } = useComplaint();
  const complaint = getComplaintContent(content);
  const category = findComplaintCategory(complaint, draft.categoryId);
  if (!category) return <Redirect href="/complaint" />;

  const sections: { title: string; route: Href; fields: ComplaintField[] }[] = [
    { title: t('complaint.identity.title'), route: '/complaint/identity', fields: complaint.commonFields },
    { title: t('complaint.work.title'), route: '/complaint/status', fields: getCategoryWorkFields(complaint, category) },
    { title: t('complaint.details.title'), route: '/complaint/details', fields: category.fields.filter((field) => field.type !== 'freetext') },
    ...complaint.partyTypes.filter((party) => draft.selectedPartyIds.includes(party.id))
      .map((party) => ({ title: t(party.labelKey), route: '/complaint/employer' as Href, fields: party.fields })),
  ];
  const narrativeError = getNarrativeError(category, draft);
  const valid = !narrativeError && draft.selectedPartyIds.length > 0 &&
    sections.every((section) => getVisibleComplaintFields(section.fields, draft.values, draft.selectedViolationIds)
      .every((field) => !getComplaintFieldError(field, draft.values, draft.selectedViolationIds)));

  function display(field: ComplaintField): string {
    const value = draft.values[field.id]?.trim() ?? '';
    if (value === 'unknown' && field.type === 'monthYear') return t('complaint.form.dateUnknown');
    if (field.type === 'county') return getCountyName(value) ?? t('complaint.form.unknownCounty');
    if (field.type === 'select') {
      const option = field.options?.find((candidate) => candidate.value === value);
      return option ? t(option.labelKey) : value;
    }
    if (field.type === 'monthYear' && /^\d{4}-\d{2}$/.test(value)) {
      return `${value.slice(5)}/${value.slice(0, 4)}`;
    }
    return value;
  }

  return (
    <AppScreen>
      <Stack.Screen options={{ title: t('complaint.review.title') }} />
      <AppText variant="title">{t('complaint.review.title')}</AppText>
      <AppText>{t('complaint.review.description')}</AppText>
      <SectionCard>
        <AppText variant="subtitle">{t(category.labelKey)}</AppText>
        {category.violations.filter((violation) => draft.selectedViolationIds.includes(violation.id))
          .map((violation) => <AppText key={violation.id}>{t(violation.labelKey)}</AppText>)}
        <AppButton label={t('complaint.review.edit')} variant="secondary"
          onPress={() => router.dismissTo(category.violations.length ? '/complaint/violations' : '/complaint/text')} />
      </SectionCard>
      {sections.filter((section) => section.fields.length > 0).map((section, index) => (
        <SectionCard key={`${section.route}-${index}`}>
          <AppText variant="subtitle">{section.title}</AppText>
          {getVisibleComplaintFields(section.fields, draft.values, draft.selectedViolationIds).map((field) => {
            const error = getComplaintFieldError(field, draft.values, draft.selectedViolationIds);
            if (!draft.values[field.id]?.trim() && !error) return null;
            return <AppText key={field.id} style={error ? { color: colors.danger } : undefined}>
              {t(field.labelKey)}: {error ? t(error) : display(field)}
            </AppText>;
          })}
          <AppButton label={t('complaint.review.edit')} variant="secondary"
            onPress={() => router.dismissTo(section.route)} />
        </SectionCard>
      ))}
      <SectionCard>
        <AppText variant="subtitle">{t('complaint.text.title')}</AppText>
        {getNarrativeFields(category, draft).filter((field) => draft.values[field.id]?.trim()).map((field) => {
          const translation = getCurrentTranslation(draft, field.id);
          return <SectionCard key={field.id}>
            <AppText variant="label">{t(field.labelKey)}</AppText>
            <AppText languageCode={draft.textLanguage}>{draft.values[field.id]}</AppText>
            {translation && translation.engine !== 'original' ? <>
              <AppText variant="label">{t('complaint.text.translation')}</AppText>
              <AppText languageCode="ro">{translation.translated}</AppText>
              <AppText variant="caption">{t('complaint.text.machineNotice')}</AppText>
            </> : null}
          </SectionCard>;
        })}
        {narrativeError ? <AppText style={{ color: colors.danger }}>{t(narrativeError)}</AppText> : null}
        <AppButton label={t('complaint.review.edit')} variant="secondary" onPress={() => router.dismissTo('/complaint/text')} />
      </SectionCard>
      <SectionCard>
        <AppText variant="subtitle">{t('attachment.title')}</AppText>
        <AttachmentList attachments={draft.attachments} />
        <AppButton label={t('complaint.review.edit')} variant="secondary" onPress={() => router.dismissTo('/complaint/attachments')} />
      </SectionCard>
      <AppButton label={t('complaint.review.generate')} disabled={!valid}
        onPress={() => router.navigate('/complaint/preview')} />
    </AppScreen>
  );
}
