import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AppButton } from '@/src/components/AppButton';
import { AppText } from '@/src/components/AppText';
import { ComplaintFieldInput } from '@/src/components/ComplaintFieldInput';
import { SectionCard } from '@/src/components/SectionCard';
import { useComplaint } from '@/src/complaint/ComplaintProvider';
import { getComplaintFieldError, getVisibleComplaintFields, isComplaintFieldRequired } from '@/src/content/complaintContent';
import type { ComplaintField } from '@/src/types/content';

type ComplaintFieldsStepProps = {
  titleKey: string;
  descriptionKey: string;
  fields: ComplaintField[];
  onContinue: () => void;
};

export function ComplaintFieldsStep({
  titleKey,
  descriptionKey,
  fields,
  onContinue,
}: ComplaintFieldsStepProps) {
  const { t } = useTranslation();
  const { draft, setFieldValue } = useComplaint();
  const [showErrors, setShowErrors] = useState(false);
  const visibleFields = getVisibleComplaintFields(fields, draft.values, draft.selectedViolationIds);
  const errors = new Map(visibleFields.map((field) => [field.id, getComplaintFieldError(field, draft.values, draft.selectedViolationIds)]));

  return (
    <>
      <AppText variant="title">{t(titleKey)}</AppText>
      <AppText>{t(descriptionKey)}</AppText>
      <SectionCard>
        {visibleFields.map((field) => (
          <ComplaintFieldInput
            error={
              showErrors && errors.get(field.id)
                ? t(errors.get(field.id)!)
                : undefined
            }
            field={{ ...field, required: isComplaintFieldRequired(field, draft.values, draft.selectedViolationIds) }}
            key={field.id}
            onChange={(value) => setFieldValue(field.id, value)}
            value={draft.values[field.id] ?? ''}
          />
        ))}
      </SectionCard>
      <AppButton
        icon="arrow-forward"
        label={t('common.continue')}
        onPress={() => {
          if ([...errors.values()].some(Boolean)) {
            setShowErrors(true);
            return;
          }
          onContinue();
        }}
      />
    </>
  );
}
