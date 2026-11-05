/**
 * Team Member Extraction and Filter Utilities for Social Audit.
 * Handles parsing, matching, and extracting individual team members
 * across SocialAuditRecord and VRPMember datasets.
 */

import { SocialAuditRecord, VRPMember } from '@/types/socialAudit';

export interface TeamMemberOption {
  id: string; // Normalized name
  name: string; // Hindi or English display name
  phone?: string;
  totalGPs: number;
  block?: string;
}

/**
 * Checks whether a SocialAuditRecord matches the selected team member filter.
 * If selectedMember is 'all' or empty, returns true.
 */
export function matchesTeamMember(record: SocialAuditRecord, selectedMember: string): boolean {
  if (!selectedMember || selectedMember === 'all') return true;

  const target = selectedMember.trim().toLowerCase();
  if (!target) return true;

  const unicode = (record.teamMembersUnicode || '').toLowerCase();
  const raw = (record.teamMembersRaw || '').toLowerCase();
  const kruti = (record.teamMembersKrutiDev || '').toLowerCase();

  // Direct containment
  if (unicode.includes(target) || raw.includes(target) || kruti.includes(target)) {
    return true;
  }

  // Check individual words if target has multiple words (e.g. "सुधीर कुमार")
  const targetWords = target.split(/\s+/).filter(w => w.length > 2);
  if (targetWords.length > 1) {
    const allWordsMatch = targetWords.every(word => unicode.includes(word) || raw.includes(word));
    if (allWordsMatch) return true;
  }

  return false;
}

/**
 * Extracts unique team member options from records and active VRP list.
 */
export function extractTeamMemberOptions(
  records: SocialAuditRecord[],
  vrpMembers: VRPMember[] = []
): TeamMemberOption[] {
  const memberCounts = new Map<string, { count: number; displayName: string; phone?: string; block?: string }>();

  // 1. Populate known active VRPs
  vrpMembers.forEach((vrp) => {
    const displayName = vrp.nameHindi || vrp.name;
    const key = (vrp.nameHindi || vrp.name).trim();
    if (!key) return;

    if (!memberCounts.has(key)) {
      memberCounts.set(key, {
        count: 0,
        displayName,
        phone: vrp.mobileNo,
        block: vrp.assignedBlock || undefined
      });
    }
  });

  // 2. Count occurrences in SocialAuditRecord.teamMembersUnicode
  records.forEach((r) => {
    const text = r.teamMembersUnicode || '';
    if (!text) return;

    // Check each known member
    memberCounts.forEach((val, key) => {
      if (text.includes(key)) {
        val.count += 1;
        if (!val.block && r.block) {
          val.block = r.block;
        }
      }
    });

    // Also parse bracketed entries like "सुधीर कुमार (नेथला)"
    // Matches word sequences before parentheses
    const regex = /([\u0900-\u097F\sA-Za-z]+)\s*(?:[\(¼][^\)½]*[\)½]|$)/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const parsedName = match[1].replace(/[\(\)¼½]/g, '').trim();
      if (parsedName.length >= 3 && !parsedName.includes('नेथला') && !parsedName.includes('शिकोहपुर')) {
        // Find if this parsedName matches an existing member
        let found = false;
        memberCounts.forEach((val, key) => {
          if (key.includes(parsedName) || parsedName.includes(key)) {
            found = true;
          }
        });

        if (!found && parsedName.length > 3) {
          memberCounts.set(parsedName, {
            count: 1,
            displayName: parsedName,
            block: r.block
          });
        }
      }
    }
  });

  // Recount accurate matches across all records for all items
  const options: TeamMemberOption[] = [];
  memberCounts.forEach((val, key) => {
    const actualCount = records.filter(r => matchesTeamMember(r, key)).length;
    if (actualCount > 0 || (val.count > 0)) {
      options.push({
        id: key,
        name: val.displayName,
        phone: val.phone,
        totalGPs: actualCount > 0 ? actualCount : val.count,
        block: val.block
      });
    }
  });

  // Sort descending by total GPs assigned, then alphabetically
  return options.sort((a, b) => b.totalGPs - a.totalGPs || a.name.localeCompare(b.name, 'hi'));
}

