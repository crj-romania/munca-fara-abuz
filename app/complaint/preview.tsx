import { CommonActions } from '@react-navigation/native';
import * as MailComposer from 'expo-mail-composer';
import { Redirect, Stack, useNavigation, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useComplaint } from '@/src/complaint/ComplaintProvider';
import {
  assertComplaintFilesAvailable,
  openComplaintAttachment,
  openComplaintDocument,
  shareComplaintAttachment,
  shareComplaintDocument,
} from '@/src/complaint/documents';
import { generateComplaintPdf } from '@/src/complaint/pdf';
import { AppButton } from '@/src/components/AppButton';
import { AppScreen } from '@/src/components/AppScreen';
import { AppText } from '@/src/components/AppText';
import { AttachmentList } from '@/src/components/AttachmentList';
import { SectionCard } from '@/src/components/SectionCard';
import {
  findComplaintCategory,
  getComplaintContent,
} from '@/src/content/complaintContent';
import { useContent } from '@/src/content/ContentProvider';
import { getInstitutionsContent } from '@/src/content/phase2Content';
import { colors } from '@/src/theme/colors';

export default function ComplaintPreviewScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { content } = useContent();
  const { draft, generated, completeGeneration } = useComplaint();
  const [generationError, setGenerationError] = useState(false);
  const [generationAttempt, setGenerationAttempt] = useState(0);
  const [actionErrorKey, setActionErrorKey] = useState<string | null>(null);
  const generationStarted = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const complaint = getComplaintContent(content);
  const category = findComplaintCategory(complaint, draft.categoryId);

  useEffect(() => {
    if (generated || !category || generationStarted.current) {
      return;
    }
    generationStarted.current = true;
    const draftSnapshot = draft;
    void generateComplaintPdf({
      complaint,
      category,
      draft: draftSnapshot,
      institutions: getInstitutionsContent(content),
      ro: content.strings.ro ?? {},
      categoryLabel: t(category.labelKey),
      textLanguage: content.index.languages.find(({ code }) => code === draftSnapshot.textLanguage),
    })
      .then((document) => {
        if (!mounted.current || !completeGeneration(document, draftSnapshot)) return;
        // The form has been cleared: Back must not revisit its obsolete steps.
        const state = navigation.getState();
        const preview = state?.routes.find((route) => route.name === 'complaint/preview');
        if (state && preview) {
          const home = state.routes.find((route) => route.name === 'home');
          navigation.dispatch(CommonActions.reset({
            ...state,
            index: 1,
            routes: [home ?? { name: 'home' }, preview],
          }));
        }
      })
      .catch(() => {
        if (!mounted.current) return;
        generationStarted.current = false;
        setGenerationError(true);
      });
  }, [
    category,
    generationAttempt,
    navigation,
    complaint,
    completeGeneration,
    content,
    draft,
    generated,
    t,
  ]);

  if (!category && !generated) {
    return <Redirect href="/complaint" />;
  }

  if (!generated) {
    return (
      <AppScreen>
        <Stack.Screen options={{ title: t('complaint.preview.title') }} />
        <AppText variant="title">{t('complaint.preview.title')}</AppText>
        {generationError ? (
          <>
            <AppText style={{ color: colors.danger }}>
              {t('complaint.preview.generationError')}
            </AppText>
            <AppButton
              label={t('common.retry')}
              onPress={() => {
                setGenerationError(false);
                generationStarted.current = false;
                setGenerationAttempt((attempt) => attempt + 1);
              }}
            />
          </>
        ) : (
          <AppText>{t('complaint.preview.generating')}</AppText>
        )}
      </AppScreen>
    );
  }

  const emailUnavailable = generated.recipients.length === 0 || !generated.templateReady;

  return (
    <AppScreen>
      <Stack.Screen
        options={{
          headerBackVisible: false,
          title: t('complaint.preview.title'),
        }}
      />
      <AppText variant="title">{t('complaint.preview.title')}</AppText>
      <AppText>{t('complaint.preview.description')}</AppText>
      <SectionCard>
        <AppText variant="subtitle">{generated.categoryLabel}</AppText>
        <AppText>
          {t('complaint.preview.destination', {
            destination: generated.destinationLabel,
          })}
        </AppText>
        <AppText variant="caption">{generated.fileName}</AppText>
      </SectionCard>
      <SectionCard>
        <AppText variant="label">{t('complaint.preview.privacyTitle')}</AppText>
        <AppText>{t('complaint.preview.dataCleared')}</AppText>
      </SectionCard>
      {generated.attachments.length ? <SectionCard>
        <AppText variant="subtitle">{t('attachment.title')}</AppText>
        <AppText>{t('attachment.separateFiles')}</AppText>
        <AttachmentList attachments={generated.attachments}
          onOpen={(attachment) => {
            setActionErrorKey(null);
            void openComplaintAttachment(attachment).catch(() => setActionErrorKey('attachment.error.unavailable'));
          }} onShare={(attachment) => {
            setActionErrorKey(null);
            void shareComplaintAttachment(attachment).catch(() => setActionErrorKey('attachment.error.unavailable'));
          }} />
      </SectionCard> : null}
      <AppButton
        icon="eye-outline"
        label={t('complaint.preview.open')}
        onPress={() => {
          setActionErrorKey(null);
          void openComplaintDocument(generated.uri).catch(() => {
            setActionErrorKey('complaint.preview.openError');
          });
        }}
        variant="secondary"
      />
      <AppButton
        disabled={emailUnavailable}
        icon="mail-outline"
        label={
          !generated.templateReady
            ? t('complaint.preview.templateUnavailable')
            : emailUnavailable
            ? t('complaint.preview.emailRecipientUnavailable')
            : t('complaint.preview.email')
        }
        onPress={() => {
          setActionErrorKey(null);
          void (async () => {
            if (!(await MailComposer.isAvailableAsync())) {
              setActionErrorKey('complaint.preview.emailUnavailable');
              return;
            }
            await assertComplaintFilesAvailable(generated.uri, generated.attachments);
            const result = await MailComposer.composeAsync({
              recipients: generated.recipients,
              subject: generated.emailSubject,
              body: generated.emailBody,
              attachments: [generated.uri, ...generated.attachments.map((attachment) => attachment.uri)],
            });
            if (result.status !== MailComposer.MailComposerStatus.CANCELLED) {
              router.replace({
                pathname: '/complaint/complete',
                params: { action: 'email' },
              });
            }
          })().catch((error) => {
            setActionErrorKey(error instanceof Error && error.message === 'attachment.error.missing'
              ? error.message : 'complaint.preview.emailError');
          });
        }}
      />
      <AppButton
        icon="download-outline"
        label={t('complaint.preview.save')}
        onPress={() => {
          setActionErrorKey(null);
          void shareComplaintDocument(generated.uri)
            .then(() => {
              router.replace({
                pathname: '/complaint/complete',
                params: { action: 'saved' },
              });
            })
            .catch(() => {
              setActionErrorKey('complaint.preview.shareError');
            });
        }}
        variant="secondary"
      />
      {actionErrorKey ? (
        <AppText style={{ color: colors.danger }} variant="caption">
          {t(actionErrorKey)}
        </AppText>
      ) : null}
      <SectionCard>
        <AppText>{t('complaint.preview.contactPrompt')}</AppText>
        <AppButton
          label={t('contact.title')}
          onPress={() => router.push('/contact')}
          variant="secondary"
        />
      </SectionCard>
    </AppScreen>
  );
}
