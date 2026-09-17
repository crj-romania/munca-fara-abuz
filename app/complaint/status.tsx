import { Redirect, Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useComplaint } from '@/src/complaint/ComplaintProvider';
import { AppScreen } from '@/src/components/AppScreen';
import { ComplaintFieldsStep } from '@/src/components/ComplaintFieldsStep';
import { findComplaintCategory, getComplaintContent } from '@/src/content/complaintContent';
import { useContent } from '@/src/content/ContentProvider';

export default function ComplaintWorkScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { content } = useContent();
  const { draft } = useComplaint();
  const complaint = getComplaintContent(content);
  const category = findComplaintCategory(complaint, draft.categoryId);
  if (!category) return <Redirect href="/complaint" />;

  return (
    <AppScreen>
      <Stack.Screen options={{ title: t('complaint.work.title') }} />
      <ComplaintFieldsStep
        titleKey="complaint.work.title"
        descriptionKey="complaint.work.description"
        fields={complaint.workFields}
        onContinue={() => router.navigate(category.violations.length ? '/complaint/violations' : '/complaint/details')}
      />
    </AppScreen>
  );
}
