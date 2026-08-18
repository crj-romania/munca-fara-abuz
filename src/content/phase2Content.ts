import type {
  ContentBundle,
  EmergencyContent,
  InfoBranch,
  InfoContent,
  InfoNode,
  Institution,
  InstitutionsContent,
} from '@/src/types/content';

export function getInfoContent(content: ContentBundle): InfoContent {
  return content.documents[content.index.files.info] as InfoContent;
}

export function getEmergencyContent(content: ContentBundle): EmergencyContent {
  return content.documents[content.index.files.emergency] as EmergencyContent;
}

export function getInstitutionsContent(
  content: ContentBundle,
): InstitutionsContent {
  return content.documents[
    content.index.files.institutions
  ] as InstitutionsContent;
}

export function isInfoBranch(node: InfoNode): node is InfoBranch {
  return 'items' in node;
}

export function resolveInfoPath(
  info: InfoContent,
  segments: string[],
): InfoNode | null {
  if (segments.length === 0) {
    return null;
  }

  let current: InfoNode | undefined = info.categories.find(
    ({ id }) => id === segments[0],
  );

  for (const segment of segments.slice(1)) {
    if (!current || !isInfoBranch(current)) {
      return null;
    }
    current = current.items.find(({ id }) => id === segment);
  }

  return current ?? null;
}

export function findInstitution(
  institutions: InstitutionsContent,
  id: string,
): Institution | null {
  return institutions.institutions.find((institution) => institution.id === id) ?? null;
}

export function isPlaceholderValue(value: string | undefined): boolean {
  return !value || /^<[^>]+>$/.test(value.trim());
}
