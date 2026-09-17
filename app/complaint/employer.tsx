import { Redirect, Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useComplaint } from '@/src/complaint/ComplaintProvider';
import { AppButton } from '@/src/components/AppButton';
import { AppScreen } from '@/src/components/AppScreen';
import { AppText } from '@/src/components/AppText';
import { ChoiceCard } from '@/src/components/ChoiceCard';
import { ComplaintFieldInput } from '@/src/components/ComplaintFieldInput';
import { SectionCard } from '@/src/components/SectionCard';
import {
  findComplaintCategory, getComplaintContent, getComplaintFieldError,
  getSelectedPartyFields, getVisibleComplaintFields, isComplaintFieldRequired,
} from '@/src/content/complaintContent';
import { useContent } from '@/src/content/ContentProvider';
import { colors } from '@/src/theme/colors';

export default function ComplaintPartiesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { content } = useContent();
  const { draft, toggleParty, setFieldValue } = useComplaint();
  const [showErrors, setShowErrors] = useState(false);
  const complaint = getComplaintContent(content);
  if (!findComplaintCategory(complaint, draft.categoryId)) return <Redirect href="/complaint" />;

  return (
    <AppScreen>
      <Stack.Screen options={{ title: t('complaint.parties.title') }} />
      <AppText variant="title">{t('complaint.parties.title')}</AppText>
      <AppText>{t('complaint.parties.description')}</AppText>
      {complaint.partyTypes.map((party) => (
        <ChoiceCard key={party.id} label={t(party.labelKey)}
          selected={draft.selectedPartyIds.includes(party.id)} onPress={() => toggleParty(party.id)} />
      ))}
      {showErrors && draft.selectedPartyIds.length === 0 ? (
        <AppText style={{ color: colors.danger }}>{t('complaint.parties.required')}</AppText>
      ) : null}
      {complaint.partyTypes.filter((party) => draft.selectedPartyIds.includes(party.id)).map((party) => (
        <SectionCard key={party.id}>
          <AppText variant="subtitle">{t(party.labelKey)}</AppText>
          {getVisibleComplaintFields(party.fields, draft.values).map((field) => {
            const error = showErrors ? getComplaintFieldError(field, draft.values) : undefined;
            return <ComplaintFieldInput key={field.id}
              field={{ ...field, required: isComplaintFieldRequired(field, draft.values) }}
              value={draft.values[field.id] ?? ''}
              onChange={(value) => setFieldValue(field.id, value)} error={error ? t(error) : undefined} />;
          })}
        </SectionCard>
      ))}
      <AppButton icon="arrow-forward" label={t('common.continue')} onPress={() => {
        if (draft.selectedPartyIds.length === 0 || getSelectedPartyFields(complaint, draft)
          .some((field) => getComplaintFieldError(field, draft.values))) {
          setShowErrors(true);
          return;
        }
        router.navigate('/complaint/attachments');
      }} />
    </AppScreen>
  );
}
