import { Redirect, Stack, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator } from 'react-native';

import { useComplaint } from '@/src/complaint/ComplaintProvider';
import {
  MAX_ATTACHMENTS,
  MAX_TOTAL_SIZE,
  pickComplaintAttachments,
  pickComplaintPhotos,
  takeComplaintPhoto,
} from '@/src/complaint/attachments';
import type { ComplaintAttachment } from '@/src/complaint/types';
import { AttachmentList, formatAttachmentSize } from '@/src/components/AttachmentList';
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

  const add = async (pick: typeof pickComplaintAttachments) => {
    if (selectionInFlight.current) {
      return;
    }
    selectionInFlight.current = true;
    setSelecting(true);
    setErrorKey(null);
    try {
      const selected = await pick(draft.attachments);
      if (selected.length > 0) {
        addAttachments(selected, draft.id);
      }
    } catch (error) {
      const key = error instanceof Error ? error.message : '';
      setErrorKey(/^attachment\.error\.(selection|tooMany|tooLarge|totalSize|type|unavailable|missing|camera)$/.test(key)
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
  const totalSize = draft.attachments.reduce((sum, item) => sum + item.size, 0);
  const full = draft.attachments.length >= MAX_ATTACHMENTS;

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
        disabled={selecting || full}
        icon="camera-outline"
        label={t('attachment.camera')}
        onPress={() => void add(takeComplaintPhoto)}
        variant="secondary"
      />
      <AppButton
        disabled={selecting || full}
        icon="images-outline"
        label={t('attachment.gallery')}
        onPress={() => void add(pickComplaintPhotos)}
        variant="secondary"
      />
      <AppButton
        disabled={selecting || full}
        icon="attach-outline"
        label={t('attachment.add')}
        onPress={() => void add(pickComplaintAttachments)}
        variant="secondary"
      />
      {selecting ? <><ActivityIndicator /><AppText variant="caption">{t('attachment.processing')}</AppText></> : null}
      {errorKey ? (
        <AppText style={{ color: colors.danger }} variant="caption">
          {t(errorKey)}
        </AppText>
      ) : null}
      {draft.attachments.length ? (
        <AppText variant="label">
          {t('attachment.summary', {
            count: draft.attachments.length,
            max: MAX_ATTACHMENTS,
            size: formatAttachmentSize(totalSize),
            maxSize: formatAttachmentSize(MAX_TOTAL_SIZE),
          })}
        </AppText>
      ) : null}
      <AttachmentList attachments={draft.attachments} onRemove={remove} />
      <AppButton
        icon="arrow-forward"
        disabled={selecting}
        label={t('common.continue')}
        onPress={() => router.navigate('/complaint/review')}
      />
    </AppScreen>
  );
}
