import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { track } from '@/src/analytics/analytics';
import { useComplaint } from '@/src/complaint/ComplaintProvider';
import { deleteAllComplaintData } from '@/src/complaint/documents';
import { AppButton } from '@/src/components/AppButton';
import { AppText } from '@/src/components/AppText';
import { SectionCard } from '@/src/components/SectionCard';
import { colors } from '@/src/theme/colors';

// One clearly visible way to remove every complaint, attachment and unfinished
// draft from the phone (e.g. before someone else may look at it).
export function DeleteAllData({ onDeleted }: { onDeleted?: () => void }) {
  const { t } = useTranslation();
  const { clearComplaint } = useComplaint();
  const [status, setStatus] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');

  const run = () => {
    setStatus('busy');
    clearComplaint();
    void deleteAllComplaintData()
      .then(() => {
        track('data_deleted');
        setStatus('done');
        onDeleted?.();
      })
      .catch(() => setStatus('error'));
  };

  return (
    <SectionCard>
      <AppText variant="subtitle">{t('deleteAll.title')}</AppText>
      <AppText>{t('deleteAll.description')}</AppText>
      <AppButton
        disabled={status === 'busy'}
        icon="trash-outline"
        label={t('deleteAll.button')}
        onPress={() => {
          Alert.alert(t('deleteAll.confirmTitle'), t('deleteAll.confirmBody'), [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('deleteAll.button'), style: 'destructive', onPress: run },
          ]);
        }}
        variant="danger"
      />
      {status === 'done' ? <AppText variant="caption">{t('deleteAll.done')}</AppText> : null}
      {status === 'error' ? (
        <AppText style={{ color: colors.danger }} variant="caption">{t('deleteAll.error')}</AppText>
      ) : null}
    </SectionCard>
  );
}
