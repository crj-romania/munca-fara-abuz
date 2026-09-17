import { Redirect, Stack, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useComplaint } from '@/src/complaint/ComplaintProvider';
import { pickComplaintAttachments } from '@/src/complaint/attachments';
import type { ComplaintAttachment } from '@/src/complaint/types';
import { AttachmentList } from '@/src/components/AttachmentList';
import { AppButton } from '@/src/components/AppButton';
import { AppScreen } from '@/src/components/AppScreen';
import { AppText } from '@/src/components/AppText';
import { SectionCard } from '@/src/components/SectionCard';
import { colors } from '@/src/theme/colors';

export default function ComplaintAttachmentsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { draft, addAttachments, removeAttachment } = useComplaint();
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [selecting, setSelecting] = useState(false);
  const selectionInFlight = useRef(false);

  if (!draft.categoryId) {
    return <Redirect href="/complaint" />;
  }

  const add = async () => {
    if (selectionInFlight.current) {
      return;
    }
    selectionInFlight.current = true;
    setSelecting(true);
    setErrorKey(null);
    try {
      const selected = await pickComplaintAttachments(draft.attachments);
      if (selected.length > 0) {
        addAttachments(selected, draft.id);
      }
    } catch (error) {
      const key = error instanceof Error ? error.message : '';
      setErrorKey(/^attachment\.error\.(selection|tooMany|tooLarge|totalSize|type|unavailable|missing)$/.test(key)
        ? key : 'attachment.error.selection');
    } finally {
      selectionInFlight.current = false;
      setSelecting(false);
    }
  };

  const remove = (attachment: ComplaintAttachment) => {
    setErrorKey(null);
    removeAttachment(attachment.id);
  };

  return (
    <AppScreen>
      <Stack.Screen options={{ title: t('attachment.title') }} />
      <AppText variant="title">{t('attachment.title')}</AppText>
      <AppText>{t('attachment.description')}</AppText>
      <SectionCard>
        <AppText>{t('attachment.localOnly')}</AppText>
        <AppText variant="caption">{t('attachment.limits')}</AppText>
      </SectionCard>
      <AppButton
        disabled={selecting}
        icon="attach-outline"
        label={t('attachment.add')}
        onPress={() => void add()}
        variant="secondary"
      />
      <AttachmentList attachments={draft.attachments} onRemove={remove} />
      {errorKey ? (
        <AppText style={{ color: colors.danger }} variant="caption">
          {t(errorKey)}
        </AppText>
      ) : null}
      <AppButton
        icon="arrow-forward"
        disabled={selecting}
        label={t('common.continue')}
        onPress={() => router.navigate('/complaint/review')}
      />
    </AppScreen>
  );
}
