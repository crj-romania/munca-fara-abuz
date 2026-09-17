import { Redirect, Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useComplaint } from '@/src/complaint/ComplaintProvider';
import { AppScreen } from '@/src/components/AppScreen';
import { ComplaintFieldsStep } from '@/src/components/ComplaintFieldsStep';
import {
  findComplaintCategory,
  getComplaintContent,
  getPhase3Fields,
} from '@/src/content/complaintContent';
import { useContent } from '@/src/content/ContentProvider';

export default function ComplaintDetailsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { content } = useContent();
  const { draft } = useComplaint();
  const complaint = getComplaintContent(content);
  const category = findComplaintCategory(complaint, draft.categoryId);

  if (!category) {
    return <Redirect href="/complaint" />;
  }

  const fields = getPhase3Fields(category.fields);
  if (fields.length === 0) {
    return <Redirect href="/complaint/text" />;
  }

  return (
    <AppScreen>
      <Stack.Screen options={{ title: t('complaint.details.title') }} />
      <ComplaintFieldsStep
        descriptionKey="complaint.details.description"
        fields={fields}
        onContinue={() => router.navigate('/complaint/text')}
        titleKey="complaint.details.title"
      />
    </AppScreen>
  );
}
