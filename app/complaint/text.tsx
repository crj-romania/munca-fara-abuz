import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { Redirect, Stack, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, TextInput } from 'react-native';

import { useComplaint } from '@/src/complaint/ComplaintProvider';
import { FREE_TEXT_LIMIT, TRANSLATION_LIMIT, getCurrentTranslation, getGoogleTranslateUrl,
  getNarrativeError, getNarrativeFields } from '@/src/complaint/freeText';
import { AppButton } from '@/src/components/AppButton';
import { AppScreen } from '@/src/components/AppScreen';
import { AppText } from '@/src/components/AppText';
import { ComplaintFieldInput } from '@/src/components/ComplaintFieldInput';
import { SectionCard } from '@/src/components/SectionCard';
import { findComplaintCategory, getComplaintContent } from '@/src/content/complaintContent';
import { useContent } from '@/src/content/ContentProvider';
import { colors } from '@/src/theme/colors';
import { fontFamilyForText } from '@/src/theme/fonts';
import { deletePreviousTranslationModel, isOnDeviceTranslationAvailable, translateOnDevice } from '@/src/translation/engine';
import type { ComplaintField } from '@/src/types/content';

function NarrativeEditor({ field }: { field: ComplaintField }) {
  const { t } = useTranslation();
  const { content } = useContent();
  const { draft, setFieldValue, setTranslation } = useComplaint();
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<'downloading' | 'translating'>('downloading');
  const [manual, setManual] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const request = useRef(0);
  useEffect(() => () => { request.current += 1; }, []);
  const original = draft.values[field.id] ?? '';
  const source = content.index.languages.find(({ code }) => code === draft.textLanguage);
  const translation = getCurrentTranslation(draft, field.id);
  const romanian = draft.textLanguage === 'ro';
  const native = source ? isOnDeviceTranslationAvailable(source) : false;
  const manualVisible = !romanian && (manual || !native);

  return (
    <SectionCard>
      <AppText variant="subtitle">{t(field.labelKey)}</AppText>
      <TextInput accessibilityLabel={t(field.labelKey)} multiline maxLength={FREE_TEXT_LIMIT}
        value={original} onChangeText={(value) => {
          request.current += 1;
          setBusy(false);
          setCopied(false);
          setError(null);
          setFieldValue(field.id, value);
        }} style={{ minHeight: 150, padding: 14, borderWidth: 1, borderColor: colors.border,
          borderRadius: 12, color: colors.text, backgroundColor: colors.white, fontSize: 17,
          textAlignVertical: 'top', textAlign: source?.rtl ? 'right' : 'left',
          writingDirection: source?.rtl ? 'rtl' : 'ltr', fontFamily: fontFamilyForText(original, false) }} />
      <AppText variant="caption">{t('complaint.text.count', { count: original.length, max: FREE_TEXT_LIMIT })}</AppText>
      {romanian ? <AppText>{t('complaint.text.romanian')}</AppText> : original.trim() ? (
        <>
          {native ? <AppButton disabled={busy} label={t('complaint.text.translate')} onPress={() => {
            if (!source) return;
            const requestId = ++request.current;
            const snapshot = { original, draftId: draft.id, sourceLanguage: draft.textLanguage };
            setBusy(true);
            setManual(false);
            setError(null);
            void translateOnDevice(original, source, (nextStage) => {
              if (requestId === request.current) setStage(nextStage);
            }).then((translated) => {
              if (requestId !== request.current) return;
              setTranslation(field.id, { original: snapshot.original, sourceLanguage: snapshot.sourceLanguage, translated, engine: 'mlkit' }, snapshot.draftId);
            }).catch(() => {
              if (requestId === request.current) { setError('complaint.text.nativeError'); setManual(true); }
            }).finally(() => { if (requestId === request.current) setBusy(false); });
          }} /> : null}
          {busy ? <><ActivityIndicator /><AppText>{t(`complaint.text.${stage}`)}</AppText></> : null}
          {!manualVisible ? <AppButton variant="secondary" label={t('complaint.text.manual')} onPress={() => {
            request.current += 1;
            setBusy(false);
            setManual(true);
          }} /> : null}
          {manualVisible ? <>
            <AppText>{t(native ? 'complaint.text.manualInstructions' : 'complaint.text.nativeUnavailable')}</AppText>
            <AppText>{t('complaint.text.googlePrivacy')}</AppText>
            <AppButton variant="secondary" label={t('complaint.text.copy')} onPress={() => {
              void Clipboard.setStringAsync(original).then(() => setCopied(true))
                .catch(() => setError('complaint.text.copyError'));
            }} />
            {copied ? <AppText variant="caption">{t('complaint.text.copied')}</AppText> : null}
            <AppButton variant="secondary" label={t('complaint.text.openGoogle')} onPress={() => {
              void Linking.openURL(getGoogleTranslateUrl(draft.textLanguage))
                .catch(() => setError('complaint.text.browserError'));
            }} />
            <AppText variant="label">{t('complaint.text.paste')}</AppText>
            <TextInput accessibilityLabel={t('complaint.text.paste')} multiline maxLength={TRANSLATION_LIMIT}
              value={translation?.engine === 'manual' ? translation.translated : ''}
              onChangeText={(translated) => setTranslation(field.id,
                { original, translated, sourceLanguage: draft.textLanguage, engine: 'manual' }, draft.id)}
              style={{ minHeight: 130, padding: 14, borderWidth: 1, borderColor: colors.border,
                borderRadius: 12, fontSize: 17, color: colors.text, backgroundColor: colors.white,
                writingDirection: 'ltr', textAlign: 'left', textAlignVertical: 'top' }} />
          </> : null}
          {translation ? <>
            <AppText variant="label">{t('complaint.text.translation')}</AppText>
            <AppText style={{ writingDirection: 'ltr', textAlign: 'left' }}>{translation.translated}</AppText>
            <AppText variant="caption">{t('complaint.text.machineNotice')}</AppText>
          </> : null}
        </>
      ) : null}
      {error ? <AppText style={{ color: colors.danger }}>{t(error)}</AppText> : null}
    </SectionCard>
  );
}

export default function ComplaintTextScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { content } = useContent();
  const { draft, setTextLanguage } = useComplaint();
  const [showErrors, setShowErrors] = useState(false);
  const category = findComplaintCategory(getComplaintContent(content), draft.categoryId);
  if (!category) return <Redirect href="/complaint" />;
  const fields = getNarrativeFields(category, draft);
  const error = getNarrativeError(category, draft);
  return (
    <AppScreen>
      <Stack.Screen options={{ title: t('complaint.text.title') }} />
      <AppText variant="title">{t('complaint.text.title')}</AppText>
      <AppText>{t(draft.selectedViolationIds.length ? 'complaint.text.optional' : 'complaint.text.required')}</AppText>
      <ComplaintFieldInput field={{ id: 'textLanguage', type: 'select', required: true,
        labelKey: 'complaint.text.language', options: content.index.languages.map((language) =>
          ({ value: language.code, labelKey: language.name })) }} value={draft.textLanguage} onChange={(code) => {
        const previous = content.index.languages.find((language) => language.code === draft.textLanguage);
        const next = content.index.languages.find((language) => language.code === code);
        setTextLanguage(code);
        if (next) void deletePreviousTranslationModel(previous, next).catch(() => {});
      }} />
      {fields.map((field) => <NarrativeEditor key={`${field.id}-${draft.textLanguage}`} field={field} />)}
      {showErrors && error ? <AppText style={{ color: colors.danger }}>{t(error)}</AppText> : null}
      <AppButton label={t('common.continue')} onPress={() => {
        if (error) { setShowErrors(true); return; }
        router.navigate('/complaint/employer');
      }} />
    </AppScreen>
  );
}
