import { getCountyName } from '@/src/complaint/counties';
import type { ComplaintDraft, ComplaintRoute } from '@/src/complaint/types';
import type { ComplaintCategory, InstitutionsContent } from '@/src/types/content';

export function isUsableEmail(value: string | undefined): value is string {
  return Boolean(
    value &&
      !/^<[^>]+>$/.test(value.trim()) &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()),
  );
}

function partyRequiredForCounty(
  institutionBasis: string | undefined,
  countyField: string | undefined,
): string | undefined {
  if (countyField && /agency/i.test(countyField)) {
    return 'agency';
  }
  if (countyField && /employer/i.test(countyField)) {
    return 'employer';
  }
  if (institutionBasis === 'employer') {
    return 'employer';
  }
  return undefined;
}

function hasSelectedParty(draft: ComplaintDraft, partyId: string): boolean {
  return Array.isArray(draft.selectedPartyIds) &&
    draft.selectedPartyIds.includes(partyId);
}

export function resolveComplaintRoute(
  category: ComplaintCategory,
  draft: ComplaintDraft,
  institutions: InstitutionsContent,
): ComplaintRoute {
  // Contacting the foundation is deliberately kept separate from filing.
  const institutionIds = category.destinations.default.filter(
    (id) => id !== 'foundation',
  );
  const destinationNames: string[] = [];
  const recipients: string[] = [];
  const unresolvedInstitutionIds: string[] = [];

  for (const institutionId of institutionIds) {
    const institution = institutions.institutions.find(
      ({ id }) => id === institutionId,
    );
    if (!institution) {
      unresolvedInstitutionIds.push(institutionId);
      continue;
    }

    let countyCode: string | undefined;
    let countyResolved = true;
    if (institution.perCounty) {
      const routingField = category.routingCountyFields?.[institutionId];
      const requiredParty = partyRequiredForCounty(
        institution.countyBasis,
        routingField,
      );
      if (requiredParty && !hasSelectedParty(draft, requiredParty)) {
        countyResolved = false;
      }
      countyCode = routingField
        ? draft.values[routingField]
        : institution.countyBasis === 'employer'
        ? draft.values.employerCounty
        : draft.values.addressCounty;
      if (!countyCode || countyCode.trim().toLowerCase() === 'unknown') {
        countyResolved = false;
      }
    }

    const countyName = countyResolved ? getCountyName(countyCode) : undefined;
    if (institution.perCounty && !countyName) {
      countyResolved = false;
    }
    destinationNames.push(
      countyName && institution.perCounty
        ? `${institution.nameRo} – ${countyName}`
        : institution.nameRo,
    );

    const email = institution.perCounty
      ? countyCode && countyResolved
        ? institution.emails[countyCode] ?? institution.emails['*']
        : undefined
      : institution.emails['*'];
    if (!countyResolved || !isUsableEmail(email)) {
      unresolvedInstitutionIds.push(institutionId);
      continue;
    }
    recipients.push(email);
  }

  const unresolved = [...new Set(unresolvedInstitutionIds)];
  return {
    institutionIds,
    destinationNames,
    // A partially resolved route is unsafe: never expose only the addresses
    // that happened to resolve when another destination is missing.
    recipients: unresolved.length ? [] : [...new Set(recipients)],
    unresolvedInstitutionIds: unresolved,
  };
}
