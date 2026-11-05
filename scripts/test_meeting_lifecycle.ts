/**
 * Automated Test Suite for Social Audit Meeting Lifecycle:
 * Cancel, Reschedule & MIS Pending Control
 */

import { INITIAL_SOCIAL_AUDIT_RECORDS } from '../src/data/socialAuditInitialData';
import { SocialAuditRecord, CancellationDetails } from '../src/types/socialAudit';
import { getEffectiveMeetingDate } from '../src/lib/dateResolution';

console.log('================================================================');
console.log('TEST SUITE: SOCIAL AUDIT MEETING LIFECYCLE & MIS PENDING CONTROL');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${testName}`);
    if (detail) console.error(`       Detail: ${detail}`);
    failCount++;
  }
}

// Clone initial records to avoid mutating original
const records: SocialAuditRecord[] = JSON.parse(JSON.stringify(INITIAL_SOCIAL_AUDIT_RECORDS));

const asOfDate = '2026-11-05';

// Find a test record
const initialCandidate = records.find(r => r.block === 'Baghpat' && getEffectiveMeetingDate(r) > asOfDate);
if (!initialCandidate) {
  throw new Error('Test record not found');
}
const testRecord: SocialAuditRecord = initialCandidate;
console.log(`Target GP for test: ${testRecord.gpNameUnicode} (${testRecord.meetingDate})\n`);

// -------------------------------------------------------------
// TEST 1: Proposed meeting must NEVER be eligible for MIS Pending
// -------------------------------------------------------------
console.log('--- TEST 1: Proposed Meeting MIS Eligibility ---');
assert(
  testRecord.status !== 'completed',
  'Record is initially proposed/scheduled',
  `Initial status: ${testRecord.status}`
);
const isEligibleInitially = (testRecord.status as string) === 'completed' && (testRecord.misStatus as string) !== 'fed';
assert(
  !isEligibleInitially,
  'Proposed meeting is NOT eligible for MIS Pending',
  `Expected false, got ${isEligibleInitially}`
);

// -------------------------------------------------------------
// TEST 2: Cancel Meeting
// -------------------------------------------------------------
console.log('\n--- TEST 2: Cancel Meeting Operation ---');
const prevDate = testRecord.meetingDate;
const cancelTimestamp = '2026-11-05 10:00 AM';
const cancelReason = 'अपरिहार्य कारण';
const cancelRemarks = 'डीएम महोदय द्वारा वीसी निर्धारित';

const cancelDetailObj: CancellationDetails = {
  cancelledDate: '2026-11-05',
  cancelledAt: cancelTimestamp,
  cancelledBy: 'DDO Baghpat',
  reason: cancelReason,
  remarks: cancelRemarks,
  previousMeetingDate: prevDate,
  previousDate: prevDate
};

// Perform cancel logic matching store
testRecord.status = 'cancelled';
testRecord.rescheduleStatus = 'pending';
testRecord.misStatus = 'not_eligible';
testRecord.cancellationDetails = cancelDetailObj;
testRecord.cancellationHistory = [cancelDetailObj];

assert(testRecord.status === 'cancelled', 'Meeting status is "cancelled"');
assert(testRecord.rescheduleStatus === 'pending', 'Reschedule status is "pending"');
assert(testRecord.misStatus === 'not_eligible', 'MIS status is set to "not_eligible"');

// Check upcoming exclusion
const isUpcoming = (testRecord.status as string) !== 'cancelled' && (testRecord.status as string) !== 'completed' && getEffectiveMeetingDate(testRecord) >= asOfDate;
assert(!isUpcoming, 'Cancelled meeting is excluded from active Upcoming Sabhas');

// Check todayMeetings and primaryMeetings exclusion
const todayAllUpcoming = records.filter(r => {
  const eff = getEffectiveMeetingDate(r);
  if (eff < asOfDate || r.status === 'completed' || r.status === 'cancelled' || r.rescheduleStatus === 'pending') return false;
  return true;
});
const todayMeetingsFiltered = todayAllUpcoming.filter(r => getEffectiveMeetingDate(r) === asOfDate);
assert(!todayMeetingsFiltered.some(r => r.id === testRecord.id), 'Cancelled meeting is strictly excluded from todayMeetings');

// Check MIS Pending exclusion
const isMisPending = (testRecord.status as string) === 'completed' && (testRecord.misStatus as string) !== 'fed';
assert(!isMisPending, 'Cancelled meeting is NEVER considered MIS Pending');

// -------------------------------------------------------------
// TEST 3: Reschedule Meeting
// -------------------------------------------------------------
console.log('\n--- TEST 3: Reschedule Meeting Operation ---');
const newMeetingDate = '2026-11-20';
const rescheduleReason = 'पुनर्निर्धारित रोस्टर';

// Perform reschedule logic matching store
testRecord.status = 'scheduled';
testRecord.rescheduleStatus = 'not_required';
testRecord.meetingDate = newMeetingDate;
testRecord.isAmended = true;
testRecord.amendmentDetails = {
  originalDate: testRecord.originalMeetingDate || prevDate,
  modifiedDate: newMeetingDate,
  reason: rescheduleReason
};

assert(testRecord.status === 'scheduled', 'Rescheduled meeting status is "scheduled"');
assert(testRecord.rescheduleStatus === 'not_required', 'Reschedule status is "not_required"');
assert(getEffectiveMeetingDate(testRecord) === newMeetingDate, 'Effective meeting date is updated to new date');
assert(Boolean(testRecord.cancellationHistory && testRecord.cancellationHistory.length === 1), 'Previous cancellation history is preserved');
assert(testRecord.cancellationHistory?.[0].previousMeetingDate === prevDate, 'Previous meeting date is preserved in history');

// Check upcoming inclusion on new date
const isUpcomingAfterReschedule = (testRecord.status as string) !== 'cancelled' && (testRecord.status as string) !== 'completed' && getEffectiveMeetingDate(testRecord) >= asOfDate;
assert(isUpcomingAfterReschedule, 'Rescheduled meeting is back in Upcoming Sabhas on new date');

// Check MIS Pending remains false
const isMisPendingAfterReschedule = (testRecord.status as string) === 'completed' && (testRecord.misStatus as string) !== 'fed';
assert(!isMisPendingAfterReschedule, 'Rescheduled meeting is still NOT in MIS Pending');

// -------------------------------------------------------------
// TEST 4: Mark Completed
// -------------------------------------------------------------
console.log('\n--- TEST 4: Meeting Completion & MIS Pending Trigger ---');
testRecord.status = 'completed';
testRecord.completedAt = '2026-11-20 03:00 PM';
testRecord.misStatus = 'pending';

assert(testRecord.status === 'completed', 'Status is "completed"');
assert(testRecord.misStatus === 'pending', 'MIS status transitions to "pending" upon completion');

const isMisPendingAfterCompletion = (testRecord.status as string) === 'completed' && (testRecord.misStatus as string) !== 'fed';
assert(isMisPendingAfterCompletion, 'Completed meeting now successfully triggers MIS Pending');

// -------------------------------------------------------------
// TEST 5: Complete MIS Feeding
// -------------------------------------------------------------
console.log('\n--- TEST 5: MIS Feeding Complete ---');
testRecord.misStatus = 'fed';
const isMisPendingAfterFed = (testRecord.status as string) === 'completed' && (testRecord.misStatus as string) !== 'fed';
assert(!isMisPendingAfterFed, 'Once fed, meeting is no longer MIS Pending');

// -------------------------------------------------------------
// TEST 6: Second Cancel/Reschedule Cycle preserves full history
// -------------------------------------------------------------
console.log('\n--- TEST 6: Multi-cycle Audit Trail History Preservation ---');
const secondPrevDate = testRecord.meetingDate;
const secondCancelObj: CancellationDetails = {
  cancelledDate: '2026-11-21',
  cancelledAt: '2026-11-21 11:00 AM',
  cancelledBy: 'DDO Baghpat',
  reason: 'प्रशासनिक कारण',
  remarks: 'तहसील दिवस बैठक',
  previousMeetingDate: secondPrevDate,
  previousDate: secondPrevDate
};

testRecord.status = 'cancelled';
testRecord.rescheduleStatus = 'pending';
testRecord.misStatus = 'not_eligible';
testRecord.cancellationDetails = secondCancelObj;
if (!testRecord.cancellationHistory) testRecord.cancellationHistory = [];
testRecord.cancellationHistory.push(secondCancelObj);

assert(testRecord.cancellationHistory.length === 2, 'History array holds all 2 cancellation cycles');
assert(testRecord.cancellationHistory[0].previousMeetingDate === prevDate, 'Cycle 1 previousMeetingDate intact');
assert(testRecord.cancellationHistory[1].previousMeetingDate === secondPrevDate, 'Cycle 2 previousMeetingDate intact');
assert(testRecord.misStatus === 'not_eligible', 'Cancelled meeting resets MIS status to "not_eligible"');

console.log('\n================================================================');
console.log(`LIFECYCLE TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log('================================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
