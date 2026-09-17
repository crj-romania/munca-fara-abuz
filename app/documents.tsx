import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import {
  deleteComplaintDocument,
  listComplaintDocuments,
  openComplaintAttachment,
  openComplaintDocument,
  shareComplaintAttachment,
  shareComplaintDocument,
} from '@/src/complaint/documents';
import type { StoredComplaintDocument } from '@/src/complaint/types';
import { AttachmentList } from '@/src/components/AttachmentList';
import { AppButton } from '@/src/components/AppButton';
import { AppScreen } from '@/src/components/AppScreen';
import { AppText } from '@/src/components/AppText';
import { SectionCard } from '@/src/components/SectionCard';
import { colors } from '@/src/theme/colors';

export default function DocumentsScreen() {
  const { t } = useTranslation();
  const [documents, setDocuments] = useState<StoredComplaintDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setDocuments(await listComplaintDocuments());
      setErrorKey(null);
    } catch {
      setErrorKey('documents.loadError');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  return (
    <AppScreen>
      <Stack.Screen options={{ title: t('documents.title') }} />
      <AppText variant="title">{t('documents.title')}</AppText>
      <SectionCard>
        <AppText>{t('documents.localOnly')}</AppText>
      </SectionCard>
      {loading ? <AppText>{t('common.loading')}</AppText> : null}
      {!loading && documents.length === 0 ? (
        <AppText>{t('documents.empty')}</AppText>
      ) : null}
      {documents.map((document) => (
        <SectionCard key={document.uri}>
          <AppText variant="label">{document.fileName}</AppText>
          {document.createdAt > 0 ? (
            <AppText variant="caption">
              {new Date(document.createdAt).toLocaleDateString()}
            </AppText>
          ) : null}
          <AppButton
            icon="eye-outline"
            label={t('documents.open')}
            onPress={() => {
              setErrorKey(null);
              void openComplaintDocument(document.uri).catch(() => {
                setErrorKey('documents.openError');
              });
            }}
            variant="secondary"
          />
          {document.attachments.length > 0 ? (
            <AttachmentList
              attachments={document.attachments}
              onOpen={(attachment) => {
                setErrorKey(null);
                void openComplaintAttachment(attachment).catch(() => {
                  setErrorKey('attachment.error.missing');
                });
              }}
              onShare={(attachment) => {
                setErrorKey(null);
                void shareComplaintAttachment(attachment).catch(() => {
                  setErrorKey('attachment.error.missing');
                });
              }}
            />
          ) : null}
          <AppButton
            icon="share-outline"
            label={t('documents.share')}
            onPress={() => {
              setErrorKey(null);
              void shareComplaintDocument(document.uri).catch(() => {
                setErrorKey('documents.shareError');
              });
            }}
            variant="secondary"
          />
          <AppButton
            icon="trash-outline"
            label={t('documents.delete')}
            onPress={() => {
              Alert.alert(
                t('documents.deleteTitle'),
                t('documents.deleteConfirm'),
                [
                  { text: t('common.cancel'), style: 'cancel' },
                  {
                    text: t('documents.delete'),
                    style: 'destructive',
                    onPress: () => {
                      void deleteComplaintDocument(document.uri)
                        .then(reload)
                        .catch(() => {
                          setErrorKey('documents.deleteError');
                        });
                    },
                  },
                ],
              );
            }}
            variant="secondary"
          />
        </SectionCard>
      ))}
      {errorKey ? (
        <AppText style={{ color: colors.danger }} variant="caption">
          {t(errorKey)}
        </AppText>
      ) : null}
    </AppScreen>
  );
}
