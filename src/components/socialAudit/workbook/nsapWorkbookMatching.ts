import type { SocialAuditRecord } from '@/types/socialAudit';

// Verified sheet names in the user's original NSAP workbook. These aliases use
// stable roster IDs; a shared serial number must never choose the wrong block.
const ORIGINAL_SHEET_IDS: Record<string, string> = {
  'शाहपुर पदडां': 'baghpat-1', 'धनौरा सिल्वर नगर': 'baghpat-11', 'बुढेडा': 'baghpat-8',
  'बाघू': 'baghpat-4', 'बली': 'baghpat-5', 'बावली': 'baraut-7', 'गाधी': 'baghpat-17',
  'फै0 निनाना': 'baghpat-16', 'बुढपुर': 'baraut-11', 'बिजरौल': 'baraut-12',
  'बडका': 'baraut-9', 'चौबली': 'baraut-15', 'ढिकाना': 'baraut-16',
  'ग्वालीखेडा': 'baghpat-20', 'गौरीपुर जव0न0': 'baghpat-19', 'बिराल': 'baraut-13',
  'निरोजपुर गुर्जर': 'baghpat-30', 'नैथला': 'baghpat-28', 'खेडकी': 'baghpat-25',
};

export function matchNSAPWorkbookSheet(name: string, records: SocialAuditRecord[]): SocialAuditRecord | undefined {
  const nsapRecords = records.filter(record => record.hasNSAP);
  const alias = ORIGINAL_SHEET_IDS[name.trim()];
  if (alias) return nsapRecords.find(record => record.id === alias);
  const clean = (value: string) => value.replace(/^[0-9]+\.\s*/, '').replace(/[\\/?*:[\]\s]/g, '').normalize('NFC');
  const matches = nsapRecords.filter(record => clean(`${record.sno}. ${record.gpNameUnicode}`.slice(0, 31)) === clean(name));
  return matches.length === 1 ? matches[0] : undefined;
}
