import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type {
  ComplaintDraft,
  ComplaintAttachment,
  ComplaintTranslation,
  GeneratedComplaint,
} from '@/src/complaint/types';
import { clearDraftAttachments, initializeComplaintAttachmentCache, removeDraftAttachment } from '@/src/complaint/attachments';

type ComplaintContextValue = {
  draft: ComplaintDraft;
  generated: GeneratedComplaint | null;
  startComplaint: (categoryId: string, suggestedPartyIds?: string[], textLanguage?: string) => void;
  toggleParty: (partyId: string) => void;
  setFieldValue: (fieldId: string, value: string) => void;
  toggleViolation: (violationId: string) => void;
  completeGeneration: (document: GeneratedComplaint, snapshot: ComplaintDraft) => boolean;
  clearComplaint: () => void;
  setTextLanguage: (language: string) => void;
  setTranslation: (fieldId: string, translation: ComplaintTranslation, draftId: string) => void;
  addAttachments: (items: ComplaintAttachment[], draftId: string) => void;
  removeAttachment: (id: string) => void;
};

const ComplaintContext = createContext<ComplaintContextValue | null>(null);

function emptyDraft(): ComplaintDraft {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    categoryId: null,
    selectedViolationIds: [],
    selectedPartyIds: [],
    textLanguage: 'en',
    translations: {},
    attachments: [],
    values: {
      singleName: 'no',
      workStartAccuracy: 'approximate',
      workEndAccuracy: 'approximate',
      expectedStartAccuracy: 'approximate',
    },
  };
}

export function ComplaintProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    void initializeComplaintAttachmentCache().catch(() => {});
  }, []);
  const [draft, setDraft] = useState<ComplaintDraft>(emptyDraft);
  const draftRef = useRef(draft);
  const updateDraft = useCallback((update: (current: ComplaintDraft) => ComplaintDraft) => {
    const next = update(draftRef.current);
    draftRef.current = next;
    setDraft(next);
  }, []);
  const [generated, setGenerated] = useState<GeneratedComplaint | null>(null);

  const startComplaint = useCallback((categoryId: string, suggestedPartyIds: string[] = [], textLanguage = 'en') => {
    void clearDraftAttachments(draftRef.current.attachments).catch(() => {});
    updateDraft(() => ({ ...emptyDraft(), categoryId, selectedPartyIds: [...suggestedPartyIds], textLanguage }));
    setGenerated(null);
  }, [updateDraft]);

  const toggleParty = useCallback((partyId: string) => {
    updateDraft((current) => ({
      ...current,
      selectedPartyIds: current.selectedPartyIds.includes(partyId)
        ? current.selectedPartyIds.filter((id) => id !== partyId)
        : [...current.selectedPartyIds, partyId],
    }));
  }, [updateDraft]);

  const setFieldValue = useCallback((fieldId: string, value: string) => {
    updateDraft((current) => ({
      ...current,
      values: { ...current.values, [fieldId]: value },
      translations: Object.fromEntries(Object.entries(current.translations).filter(([key]) => key !== fieldId)),
    }));
  }, [updateDraft]);

  const toggleViolation = useCallback((violationId: string) => {
    updateDraft((current) => {
      const selected = current.selectedViolationIds.includes(violationId);
      return {
        ...current,
        selectedViolationIds: selected
          ? current.selectedViolationIds.filter((id) => id !== violationId)
          : [...current.selectedViolationIds, violationId],
      };
    });
  }, [updateDraft]);

  const setTextLanguage = useCallback((language: string) => {
    updateDraft((current) => current.textLanguage === language ? current
      : { ...current, textLanguage: language, translations: {} });
  }, [updateDraft]);

  const setTranslation = useCallback((fieldId: string, translation: ComplaintTranslation, draftId: string) => {
    updateDraft((current) => current.id !== draftId || current.textLanguage !== translation.sourceLanguage ||
      current.values[fieldId] !== translation.original ? current
      : { ...current, translations: { ...current.translations, [fieldId]: translation } });
  }, [updateDraft]);

  const addAttachments = useCallback((items: ComplaintAttachment[], draftId: string) => {
    if (draftRef.current.id !== draftId) {
      void clearDraftAttachments(items).catch(() => {});
      return;
    }
    updateDraft((current) => ({ ...current, attachments: [...current.attachments, ...items] }));
  }, [updateDraft]);

  const removeAttachment = useCallback((id: string) => {
    const attachment = draftRef.current.attachments.find((item) => item.id === id);
    updateDraft((current) => ({ ...current, attachments: current.attachments.filter((item) => item.id !== id) }));
    if (attachment) void removeDraftAttachment(attachment).catch(() => {});
  }, [updateDraft]);

  const completeGeneration = useCallback((document: GeneratedComplaint, snapshot: ComplaintDraft) => {
    // A late result must not erase a new complaint or edits made while generating.
    if (draftRef.current !== snapshot) return false;
    // Generated PDFs persist locally. Personal form values never do.
    void clearDraftAttachments(draftRef.current.attachments).catch(() => {});
    updateDraft(() => emptyDraft());
    setGenerated(document);
    return true;
  }, [updateDraft]);

  const clearComplaint = useCallback(() => {
    void clearDraftAttachments(draftRef.current.attachments).catch(() => {});
    updateDraft(() => emptyDraft());
    setGenerated(null);
  }, [updateDraft]);

  const value = useMemo<ComplaintContextValue>(
    () => ({
      draft,
      generated,
      startComplaint,
      toggleParty,
      setFieldValue,
      toggleViolation,
      completeGeneration,
      clearComplaint,
      setTextLanguage,
      setTranslation,
      addAttachments,
      removeAttachment,
    }),
    [
      clearComplaint,
      completeGeneration,
      draft,
      generated,
      setFieldValue,
      toggleParty,
      startComplaint,
      toggleViolation,
      setTextLanguage,
      setTranslation,
      addAttachments,
      removeAttachment,
    ],
  );

  return (
    <ComplaintContext.Provider value={value}>
      {children}
    </ComplaintContext.Provider>
  );
}

export function useComplaint(): ComplaintContextValue {
  const value = useContext(ComplaintContext);
  if (!value) {
    throw new Error('useComplaint must be used inside ComplaintProvider.');
  }
  return value;
}
