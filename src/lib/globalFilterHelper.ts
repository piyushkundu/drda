import { SocialAuditRecord, AuditBlock } from '@/types/socialAudit';
import { matchesBRP, BRPOption, extractBRPOptions } from './brpHelper';

export type DateRangePreset = 'all' | 'today' | 'next7' | 'next30' | 'thisMonth' | 'custom';

export interface GlobalDateRange {
  startDate: string; // YYYY-MM-DD or ''
  endDate: string;   // YYYY-MM-DD or ''
  preset: DateRangePreset;
}

export const DEFAULT_DATE_RANGE: GlobalDateRange = {
  startDate: '',
  endDate: '',
  preset: 'all',
};

/**
 * Adds N calendar days to a YYYY-MM-DD date string using local calendar arithmetic
 */
export function addDaysISO(dateStr: string, days: number): string {
  if (!dateStr) return '';
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d + days);
    const pad = (num: number) => String(num).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  } catch {
    return dateStr;
  }
}

/**
 * Returns full month boundaries [start, end] for a given YYYY-MM-DD string
 */
export function getMonthRangeISO(dateStr: string): { start: string; end: string } {
  if (!dateStr) return { start: '', end: '' };
  try {
    const [y, m] = dateStr.split('-').map(Number);
    const pad = (num: number) => String(num).padStart(2, '0');
    const lastDay = new Date(y, m, 0).getDate();
    return {
      start: `${y}-${pad(m)}-01`,
      end: `${y}-${pad(m)}-${pad(lastDay)}`,
    };
  } catch {
    return { start: dateStr, end: dateStr };
  }
}

/**
 * Computes the start and end dates for a preset given an anchor date (asOfDate)
 */
export function calculatePresetDateRange(
  preset: DateRangePreset,
  asOfDate: string
): { startDate: string; endDate: string } {
  switch (preset) {
    case 'today':
      return { startDate: asOfDate, endDate: asOfDate };
    case 'next7':
      return { startDate: asOfDate, endDate: addDaysISO(asOfDate, 7) };
    case 'next30':
      return { startDate: asOfDate, endDate: addDaysISO(asOfDate, 30) };
    case 'thisMonth': {
      const month = getMonthRangeISO(asOfDate);
      return { startDate: month.start, endDate: month.end };
    }
    case 'all':
    default:
      return { startDate: '', endDate: '' };
  }
}

/**
 * Formats a date range into a concise human-readable Hindi label
 */
export function formatRangeLabel(range: GlobalDateRange): string {
  if (range.preset === 'all' || (!range.startDate && !range.endDate)) {
    return 'सभी तिथियां';
  }
  if (range.preset === 'today') {
    return 'आज की सभाएं';
  }
  if (range.preset === 'next7') {
    return 'अगले 7 दिन';
  }
  if (range.preset === 'next30') {
    return 'अगले 30 दिन';
  }
  if (range.preset === 'thisMonth') {
    return 'इस माह';
  }

  // Custom or specific dates
  const formatShort = (dStr: string) => {
    if (!dStr) return '';
    try {
      const [y, m, d] = dStr.split('-');
      return `${d}/${m}/${y.slice(2)}`;
    } catch {
      return dStr;
    }
  };

  if (range.startDate && range.endDate) {
    if (range.startDate === range.endDate) {
      return formatShort(range.startDate);
    }
    return `${formatShort(range.startDate)} - ${formatShort(range.endDate)}`;
  }
  if (range.startDate) {
    return `≥ ${formatShort(range.startDate)}`;
  }
  if (range.endDate) {
    return `≤ ${formatShort(range.endDate)}`;
  }

  return 'कस्टम रेंज';
}

/**
 * Validates date range. Returns null if valid, or an error message string if invalid.
 */
export function validateDateRange(startDate: string, endDate: string): string | null {
  if (startDate && endDate) {
    if (startDate > endDate) {
      return 'प्रारंभ तिथि समापन तिथि से बाद की नहीं हो सकती (Start date cannot be after end date)';
    }
  }
  return null;
}

/**
 * Evaluates whether a single SocialAuditRecord passes all 3 global filters (AND logic)
 */
export function matchesGlobalFilters(
  record: SocialAuditRecord,
  selectedBRP: string,
  selectedBlock: 'all' | AuditBlock,
  dateRange?: Partial<GlobalDateRange>
): boolean {
  // 1. Block Filter
  if (selectedBlock && selectedBlock !== 'all' && record.block !== selectedBlock) {
    return false;
  }

  // 2. BRP Filter
  if (selectedBRP && selectedBRP !== 'all') {
    if (!matchesBRP(record, selectedBRP)) {
      return false;
    }
  }

  // 3. Date Range Filter (inclusive)
  if (dateRange) {
    const meetingDate = record.meetingDate;
    if (dateRange.startDate && meetingDate < dateRange.startDate) {
      return false;
    }
    if (dateRange.endDate && meetingDate > dateRange.endDate) {
      return false;
    }
  }

  return true;
}

/**
 * Applies global filters to an array of records
 */
export function filterRecordsByGlobalFilters(
  records: SocialAuditRecord[],
  selectedBRP: string,
  selectedBlock: 'all' | AuditBlock,
  dateRange?: Partial<GlobalDateRange>
): SocialAuditRecord[] {
  const isBlockFiltered = selectedBlock && selectedBlock !== 'all';
  const isBRPFiltered = selectedBRP && selectedBRP !== 'all';
  const isDateFiltered = Boolean(dateRange && (dateRange.startDate || dateRange.endDate));

  if (!isBlockFiltered && !isBRPFiltered && !isDateFiltered) {
    return records;
  }

  return records.filter((r) =>
    matchesGlobalFilters(r, selectedBRP, selectedBlock, dateRange)
  );
}

/**
 * Filters and adjusts BRP options based on the currently selected block
 */
export function getAvailableBRPOptionsForBlock(
  allBRPOptionsOrRecords: BRPOption[] | SocialAuditRecord[],
  selectedBlock: 'all' | AuditBlock
): BRPOption[] {
  const options =
    allBRPOptionsOrRecords.length > 0 && 'baghpatGPs' in allBRPOptionsOrRecords[0]
      ? (allBRPOptionsOrRecords as BRPOption[])
      : extractBRPOptions(allBRPOptionsOrRecords as SocialAuditRecord[]);

  if (!selectedBlock || selectedBlock === 'all') {
    return options;
  }

  return options.map((opt) => ({
    ...opt,
    totalGPs: selectedBlock === 'Baghpat' ? opt.baghpatGPs : opt.barautGPs,
  }));
}

/**
 * Checks if the currently selected BRP has any GPs in the newly selected block.
 * If not, returns true indicating BRP should be reset to 'all'.
 */
export function shouldResetBRPOnBlockChange(
  selectedBRP: string,
  newBlock: 'all' | AuditBlock,
  allBRPOptions: BRPOption[]
): boolean {
  if (!selectedBRP || selectedBRP === 'all' || newBlock === 'all') {
    return false;
  }
  const currentOption = allBRPOptions.find(
    (opt) => opt.id === selectedBRP || opt.phone === selectedBRP || opt.name.includes(selectedBRP)
  );
  if (!currentOption) return false;

  if (newBlock === 'Baghpat' && currentOption.baghpatGPs === 0) {
    return true;
  }
  if (newBlock === 'Baraut' && currentOption.barautGPs === 0) {
    return true;
  }
  return false;
}
