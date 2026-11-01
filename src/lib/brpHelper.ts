import { SocialAuditRecord } from '@/types/socialAudit';

export interface BRPOption {
  id: string; // phone number (if available) or normalized name
  name: string; // Clean Hindi name e.g. "तेजपाल"
  phone?: string;
  totalGPs: number;
  baghpatGPs: number;
  barautGPs: number;
  isExBRP?: boolean;
}

/**
 * Normalizes BRP string by stripping phone number in parentheses and extra spaces.
 */
export function cleanBRPName(rawName: string): string {
  if (!rawName) return '';
  return rawName
    .replace(/[¼\(][0-9]{10}[½\)]/g, '')
    .replace(/[0-9]{10}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks whether a given SocialAuditRecord matches the selected BRP filter.
 * If selectedBRP === 'all' or empty, always returns true.
 */
export function matchesBRP(record: SocialAuditRecord, selectedBRP: string): boolean {
  if (!selectedBRP || selectedBRP === 'all') return true;

  const target = selectedBRP.trim();
  const phone = record.brpPhone?.trim() || '';
  const name = record.brpName?.trim() || '';
  const unicode = record.brpUnicode?.trim() || '';

  // Direct phone match
  if (phone && (phone === target || target.includes(phone))) {
    return true;
  }

  // Target matches phone
  if (/^[0-9]{10}$/.test(target)) {
    return phone === target;
  }

  // Name matches
  const cleanedTarget = cleanBRPName(target).toLowerCase();
  const cleanedName = cleanBRPName(name).toLowerCase();
  const cleanedUnicode = cleanBRPName(unicode).toLowerCase();

  if (cleanedName && (cleanedName === cleanedTarget || cleanedName.includes(cleanedTarget) || cleanedTarget.includes(cleanedName))) {
    return true;
  }

  if (cleanedUnicode && (cleanedUnicode === cleanedTarget || cleanedUnicode.includes(cleanedTarget) || cleanedTarget.includes(cleanedUnicode))) {
    return true;
  }

  return false;
}

/**
 * Dynamically extracts all unique BRP options from current records list.
 * Never hardcoded; automatically reacts to roster edits and reassignments.
 */
export function extractBRPOptions(records: SocialAuditRecord[]): BRPOption[] {
  const map = new Map<string, BRPOption>();

  records.forEach((r) => {
    const phone = r.brpPhone?.trim() || '';
    const rawName = r.brpName || r.brpUnicode || '';
    const name = cleanBRPName(rawName) || phone || 'अज्ञात बी०आर०पी०';
    
    // Stable ID: phone preferred, fallback to normalized name
    const id = phone || name;
    if (!id) return;

    if (!map.has(id)) {
      const isEx = name.includes('हरिकिशन') || phone === '8859660315';
      const displayName = isEx && !name.includes('पूर्व') ? `${name} (पूर्व बी०आर०पी०)` : name;

      map.set(id, {
        id,
        name: displayName,
        phone: phone || undefined,
        totalGPs: 0,
        baghpatGPs: 0,
        barautGPs: 0,
        isExBRP: isEx,
      });
    }

    const item = map.get(id)!;
    item.totalGPs += 1;
    if (r.block === 'Baghpat') item.baghpatGPs += 1;
    if (r.block === 'Baraut') item.barautGPs += 1;
  });

  // Sort: Active BRPs first by total GP count descending, ex-BRP at end
  return Array.from(map.values()).sort((a, b) => {
    if (a.isExBRP && !b.isExBRP) return 1;
    if (!a.isExBRP && b.isExBRP) return -1;
    return b.totalGPs - a.totalGPs;
  });
}

/**
 * Returns a human-friendly display label for the currently selected BRP.
 */
export function getBRPDisplayName(selectedBRP: string, records: SocialAuditRecord[]): string {
  if (!selectedBRP || selectedBRP === 'all') return 'सभी बी०आर०पी०';
  
  const options = extractBRPOptions(records);
  const found = options.find((opt) => opt.id === selectedBRP || opt.phone === selectedBRP || opt.name.includes(selectedBRP));
  if (found) {
    return found.phone ? `${found.name} (${found.phone})` : found.name;
  }
  return selectedBRP;
}

/**
 * Returns a set of Gram Panchayat names (Unicode) and record IDs assigned to the selected BRP.
 * Useful for filtering related entities like NSAP Beneficiaries.
 */
export function getAssignedGPRelationship(records: SocialAuditRecord[], selectedBRP: string) {
  if (!selectedBRP || selectedBRP === 'all') {
    return {
      isAll: true,
      gpNames: new Set<string>(),
      recordIds: new Set<string>(),
    };
  }

  const matchingRecords = records.filter((r) => matchesBRP(r, selectedBRP));
  const gpNames = new Set<string>();
  const recordIds = new Set<string>();

  matchingRecords.forEach((r) => {
    if (r.id) recordIds.add(r.id);
    if (r.gpNameUnicode) gpNames.add(r.gpNameUnicode.trim());
    if (r.gpNameRaw) gpNames.add(r.gpNameRaw.trim());
  });

  return {
    isAll: false,
    gpNames,
    recordIds,
    count: matchingRecords.length,
  };
}

