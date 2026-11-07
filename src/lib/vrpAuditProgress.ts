import type { AuditBlock, SocialAuditRecord, VRPMember } from '@/types/socialAudit';
import { getEffectiveMeetingDate, getProgressCutoffDate, isMeetingCompletedEffective } from './dateResolution';
import { getDelhiDateString } from './delhiTime';
import { reportingDate, socialAuditRecordAsOf } from './socialAuditAsOf';
import { matchesBRP } from './brpHelper';

export type VrpDutyStatus = 'completed' | 'upcoming' | 'overdue' | 'cancelled' | 'undated';
export const VRP_DUTY_LABELS: Record<VrpDutyStatus, string> = { completed: 'सम्पन्न', upcoming: 'आगामी', overdue: 'देय, सम्पन्न शेष', cancelled: 'निरस्त', undated: 'तिथि जाँचें' };
export const normalizeVrpName = (text: string) => text.normalize('NFC').replace(/[\u200c\u200d]/g, '').replace(/न्(?=[दधतथ])/g, 'ं').replace(/\s+/g, ' ').trim().toLowerCase();

export interface CalendarVrpName { name: string; locality: string; source: string }

/** Read literal calendar entries, including the source's missing closing brackets.
 * Two-space separation recovers “कपिल तोमर (आ0 खेडी   सुमन (अगंदपुर)”.
 * No surname, phone, employee code or attendance is invented.
 */
export function parseCalendarVrpNames(text: string): CalendarVrpName[] {
  const opens = [...text.matchAll(/[(¼]/g)].map(match => match.index!);
  if (!opens.length) return text.split(/[,;\n]+|\s{2,}/).map(name => ({ name: name.trim(), locality: '', source: name.trim() })).filter(item => Boolean(item.name));
  const entries: CalendarVrpName[] = [];
  for (let i = 0; i < opens.length; i++) {
    const before = text.slice(i ? opens[i - 1] + 1 : 0, opens[i]);
    const close = Math.max(before.lastIndexOf(')'), before.lastIndexOf('½'));
    const name = (close >= 0 ? before.slice(close + 1) : i ? before.trim().split(/\s{2,}/).at(-1)! : before).replace(/^[\s,;\d.]+/, '').trim();
    const after = text.slice(opens[i] + 1, opens[i + 1] ?? text.length);
    const closing = after.search(/[)½]/);
    const gaps = [...after.matchAll(/\s{2,}/g)];
    const locality = (closing >= 0 ? after.slice(0, closing) : i < opens.length - 1 && gaps.length ? after.slice(0, gaps.at(-1)!.index) : after).trim();
    if (name) entries.push({ name, locality, source: `${name} (${locality})` });
  }
  return entries;
}

export interface VrpDuty { record: SocialAuditRecord; status: VrpDutyStatus; meetingDate: string; completedDate?: string }
export interface VrpCalendarProfile {
  id: string;
  name: string;
  locality: string;
  block: AuditBlock;
  member?: VRPMember;
  candidates: VRPMember[];
  duties: VrpDuty[];
  counts: Record<VrpDutyStatus, number>;
}
export interface VrpAuditProgress {
  cutoff: string;
  profiles: VrpCalendarProfile[];
  totalGPs: number;
  completedGPs: number;
  missingTeamGPs: SocialAuditRecord[];
}

export function buildVrpAuditProgress(records: SocialAuditRecord[], members: VRPMember[], asOfDate: string, today = getDelhiDateString(), filters: { block?: AuditBlock | 'all'; brp?: string } = {}): VrpAuditProgress {
  const cutoff = getProgressCutoffDate(asOfDate, today);
  const projected = records.map(record => socialAuditRecordAsOf(record, cutoff, today)).filter(record => (!filters.block || filters.block === 'all' || record.block === filters.block) && matchesBRP(record, filters.brp || 'all'));
  const profiles = new Map<string, VrpCalendarProfile>();
  const uniqueGPs = new Set<string>(), completedGPs = new Set<string>();
  const missingTeamGPs: SocialAuditRecord[] = [];
  for (const record of projected) {
    // Repeated rows must never award the same meeting twice to one person.
    if (uniqueGPs.has(record.id)) continue;
    uniqueGPs.add(record.id);
    const date = reportingDate(getEffectiveMeetingDate(record));
    const status: VrpDutyStatus = record.status === 'cancelled' ? 'cancelled' : isMeetingCompletedEffective(record, cutoff, today) ? 'completed' : record.rescheduleStatus === 'pending' || !date ? 'undated' : date > cutoff ? 'upcoming' : 'overdue';
    if (status === 'completed') completedGPs.add(record.id);
    const parsed = parseCalendarVrpNames(record.teamMembersUnicode || '');
    if (!parsed.length) missingTeamGPs.push(record);
    for (const person of parsed) {
      const key = `${record.block}:${normalizeVrpName(person.name)}:${normalizeVrpName(person.locality)}`;
      if (!profiles.has(key)) {
        const name = normalizeVrpName(person.name);
        const exact = members.filter(member => [member.nameHindi, member.name].some(alias => alias && normalizeVrpName(alias) === name));
        // Shortened names and duplicate master names remain review candidates.
        // Current Team A/B/C allocation never resolves historical identity.
        const candidateName = name.split(' ').map(word => word === 'सिह' ? 'सिंह' : word).join(' ');
        const candidates = members.filter(member => [member.nameHindi, member.name].some(alias => {
          const normalized = alias && normalizeVrpName(alias);
          return normalized && (normalized === name || normalized.startsWith(candidateName + ' ') || candidateName.startsWith(normalized + ' '));
        }));
        profiles.set(key, { id: key, name: person.name, locality: person.locality, block: record.block, member: exact.length === 1 && candidates.length === 1 ? exact[0] : undefined, candidates, duties: [], counts: { completed: 0, upcoming: 0, overdue: 0, cancelled: 0, undated: 0 } });
      }
      const profile = profiles.get(key)!;
      if (profile.duties.some(duty => duty.record.id === record.id)) continue;
      const recordedCompletion = reportingDate(record.completedDate);
      profile.duties.push({ record, status, meetingDate: date || '', completedDate: status === 'completed' && recordedCompletion && recordedCompletion <= cutoff ? recordedCompletion : undefined });
      profile.counts[status]++;
    }
  }
  const result = [...profiles.values()].sort((a, b) => b.counts.completed - a.counts.completed || b.duties.length - a.duties.length || a.name.localeCompare(b.name, 'hi'));
  result.forEach(profile => profile.duties.sort((a, b) => a.meetingDate.localeCompare(b.meetingDate) || a.record.gpNameUnicode.localeCompare(b.record.gpNameUnicode, 'hi')));
  return { cutoff, profiles: result, totalGPs: uniqueGPs.size, completedGPs: completedGPs.size, missingTeamGPs };
}

export function vrpProfilesForMember(progress: VrpAuditProgress, memberId: string) {
  return progress.profiles.filter(profile => profile.member?.id === memberId || !profile.member && profile.candidates.some(member => member.id === memberId));
}
