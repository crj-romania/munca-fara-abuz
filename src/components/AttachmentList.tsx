import { useTranslation } from 'react-i18next';

import type { ComplaintAttachment } from '@/src/complaint/types';
import { AppButton } from '@/src/components/AppButton';
import { AppText } from '@/src/components/AppText';
import { SectionCard } from '@/src/components/SectionCard';

type AttachmentListProps = {
  attachments: ComplaintAttachment[];
  onOpen?: (attachment: ComplaintAttachment) => void;
  onShare?: (attachment: ComplaintAttachment) => void;
  onRemove?: (attachment: ComplaintAttachment) => void;
};

function formatSize(size: number): string {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentList({
  attachments,
  onOpen,
  onShare,
  onRemove,
}: AttachmentListProps) {
  const { t } = useTranslation();

  if (attachments.length === 0) {
    return <AppText>{t('attachment.empty')}</AppText>;
  }

  return (
    <>
      {attachments.map((attachment) => (
        <SectionCard key={attachment.id}>
          <AppText variant="label">{attachment.name}</AppText>
          <AppText variant="caption">
            {attachment.mimeType} · {formatSize(attachment.size)}
          </AppText>
          {onOpen ? (
            <AppButton
              icon="eye-outline"
              label={t('attachment.open')}
              onPress={() => onOpen(attachment)}
              variant="secondary"
            />
          ) : null}
          {onShare ? (
            <AppButton
              icon="share-outline"
              label={t('attachment.share')}
              onPress={() => onShare(attachment)}
              variant="secondary"
            />
          ) : null}
          {onRemove ? (
            <AppButton
              icon="trash-outline"
              label={t('attachment.remove')}
              onPress={() => onRemove(attachment)}
              variant="secondary"
            />
          ) : null}
        </SectionCard>
      ))}
    </>
  );
}
