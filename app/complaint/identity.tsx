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

export default function ComplaintIdentityScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { content } = useContent();
  const { draft } = useComplaint();
  const complaint = getComplaintContent(content);
  const category = findComplaintCategory(complaint, draft.categoryId);

  if (!category) {
    return <Redirect href="/complaint" />;
  }

  return (
    <AppScreen>
      <Stack.Screen options={{ title: t('complaint.identity.title') }} />
      <ComplaintFieldsStep
        descriptionKey="complaint.identity.description"
        fields={getPhase3Fields(complaint.commonFields)}
        onContinue={() => router.navigate('/complaint/status')}
        titleKey="complaint.identity.title"
      />
    </AppScreen>
  );
}
