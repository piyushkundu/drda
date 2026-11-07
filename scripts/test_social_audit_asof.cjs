// Isolated tests: all storage/network boundaries are in-memory mocks.
/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS loader intercepts TS imports to guarantee Firebase stays mocked. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  return originalResolve.call(this, request.startsWith('@/') ? path.join(root, 'src', request.slice(2)) : request, parent, ...rest);
};
require.extensions['.ts'] = (mod, filename) => mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX }
}).outputText, filename);
require.extensions['.tsx'] = require.extensions['.ts'];
let cloudWrites = 0, confirmations = [], acceptWarning = false;
let renderMode = false, download;
const React = require('react');
const originalLoad = Module._load;
Module._load = function (request, parent, ...rest) {
  if (renderMode && request === 'react') return { ...React, useState: value => [typeof value === 'function' ? value() : value, () => {}], useMemo: run => run(), useEffect: () => {} };
  if (renderMode && request === '@/stores/socialAuditStore') return { useSocialAuditStore: selector => selector ? selector(store.getState()) : store.getState() };
  if (renderMode && request === 'file-saver') return { saveAs: blob => { download = blob; } };
  if (request === '@/lib/socialAuditFirebase') return {
    loadSocialAuditFromFirestore: async () => { throw new Error('Unexpected remote read'); },
    subscribeToSocialAuditFirestore: () => { throw new Error('Unexpected remote subscription'); },
    saveSocialAuditToFirestore: async () => { cloudWrites++; return true; }
  };
  return originalLoad.call(this, request, parent, ...rest);
};
const storage = new Map();
global.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) };
global.window = { navigator: { userAgent: 'isolated-test' }, confirm: message => { confirmations.push(message); return acceptWarning; } };
global.alert = () => { throw new Error('Unexpected alert'); };
const { INITIAL_SOCIAL_AUDIT_RECORDS: records } = require('../src/data/socialAuditInitialData.ts');
const { INITIAL_NSAP_DATA_RECORDS: nsap } = require('../src/data/nsapDataInitial.ts');
const { INITIAL_VRP_RECORDS: vrps } = require('../src/data/vrpInitialData.ts');
const { useSocialAuditStore: store } = require('../src/stores/socialAuditStore.ts');
const { socialAuditRecordAsOf, nsapRecordsAsOf, reportingDate, confirmHistoricalEdit } = require('../src/lib/socialAuditAsOf.ts');
const { calculateNSAPReportSummary } = require('../src/lib/nsapReportHelper.ts');
const { isMeetingCompletedEffective, getProgressCutoffDate, getEffectiveMeetingDate } = require('../src/lib/dateResolution.ts');
const { getDelhiDateString } = require('../src/lib/delhiTime.ts');
let checks = 0;
function check(name, run) { run(); checks++; console.log(`PASS ${name}`); }
async function main() {
  const record = { ...records[0], status: 'scheduled', isAmended: false, amendmentDetails: undefined, originalMeetingDate: undefined,
    meetingDate: '2026-10-08', panchayatNirnayStatus: 'captured', panchayatNirnayCapturedDate: '2026-11-02', misStatus: 'fed', misFedDate: '2026-11-01', misAuditedCount: 1 };
  const untouched = structuredClone(record);
  check('October report excludes November feeding and Nirnay capture without mutating source', () => {
    const view = socialAuditRecordAsOf(record, '2026-10-31', '2026-11-07');
    assert.equal(view.misStatus, 'pending');
    assert.equal(view.panchayatNirnayStatus, 'pending');
    assert.equal(view.misAuditedCount, 0);
    assert.deepEqual(record, untouched);
  });
  check('Cutoff is inclusive and each module uses its own work date', () => {
    const view = socialAuditRecordAsOf(record, '2026-11-01', '2026-11-07');
    assert.equal(view.misStatus, 'fed');
    assert.equal(view.panchayatNirnayStatus, 'pending');
    assert.equal(socialAuditRecordAsOf(record, '2026-11-02', '2026-11-07').panchayatNirnayStatus, 'captured');
  });
  check('Unrecorded work dates are not invented for historical progress', () => {
    const undated = { ...record, misFedDate: undefined, panchayatNirnayCapturedDate: undefined };
    assert.equal(socialAuditRecordAsOf(undated, '2026-10-31', '2026-11-07').misStatus, 'pending');
    assert.equal(socialAuditRecordAsOf(undated, '2026-11-07', '2026-11-07').misStatus, 'fed');
  });
  check('IST date boundary and impossible calendar dates', () => {
    assert.equal(reportingDate('2026-10-31T20:00:00Z'), '2026-11-01');
    assert.equal(reportingDate('2026-02-31'), undefined);
    assert.equal(reportingDate(''), undefined);
    assert.equal(reportingDate('2026-10-1.5'), undefined);
  });
  check('NSAP uses work date, not a later data-entry timestamp', () => {
    const list = [{ ...nsap[0], meetingDate: '2026-10-31', recordedDate: '2026-11-06T10:00:00Z' },
      { ...nsap[1], meetingDate: '2026-11-01' }, { ...nsap[2], meetingDate: '', recordedDate: '' }];
    const view = nsapRecordsAsOf(list, '2026-10-31');
    assert.equal(view.length, 1);
    assert.equal(view[0].id, list[0].id);
    assert.equal(list.length, 3);
  });
  check('Later cancellation does not remove a GP from an earlier report', () => {
    const cancelled = { ...record, status: 'cancelled', rescheduleStatus: 'pending', misStatus: 'not_eligible', misFedDate: '2026-10-10', cancellationDetails: { cancelledDate: '2026-11-05', cancelledAt: '2026-11-05T10:00:00Z', reason: 'test', previousMeetingDate: record.meetingDate } };
    const october = socialAuditRecordAsOf(cancelled, '2026-10-31', '2026-11-07');
    assert.equal(october.status, 'scheduled');
    assert.equal(october.misStatus, 'fed');
    assert.equal(calculateNSAPReportSummary([cancelled], '2026-10-31').totals.completedUpToDate, 1);
    assert.equal(calculateNSAPReportSummary([cancelled], '2026-11-05').totals.completedUpToDate, 0);
    assert.equal(cancelled.status, 'cancelled');
  });
  check('Completed status cannot bypass a future effective meeting date', () => {
    assert.equal(isMeetingCompletedEffective({ ...record, status: 'completed', meetingDate: '2026-11-10' }, '2026-10-31'), false);
  });
  check('Existing official NSAP baseline remains 47 proposed / 11 by 8 October', () => {
    const result = calculateNSAPReportSummary(records, '2026-10-08');
    assert.equal(result.totals.totalProposedFY, 47);
    assert.equal(result.totals.completedUpToDate, 11);
  });
  check('Future selection preserves existing progress without completing upcoming meetings', () => {
    const existing = records.filter(r => r.status !== 'cancelled' && getEffectiveMeetingDate(r) <= '2026-11-07').length;
    const forecast = records.filter(r => isMeetingCompletedEffective(r, '2026-11-20', '2026-11-07')).length;
    assert.equal(forecast, existing);
    assert.equal(isMeetingCompletedEffective({ ...record, meetingDate: '2026-11-10' }, '2026-11-20', '2026-11-07'), false);
  });
  check('Meeting remains uncompleted after its scheduled date until manual confirmation', () => {
    const future = { ...record, meetingDate: '2026-11-10' };
    for (const status of ['scheduled', 'proposed', 'in_progress', 'amended', 'postponed']) {
      assert.equal(isMeetingCompletedEffective({ ...future, status }, '2026-11-20', '2026-11-15'), false);
    }
    assert.equal(isMeetingCompletedEffective({ ...future, status: 'completed', completedDate: '2026-11-12' }, '2026-11-20', '2026-11-15'), true);
    assert.equal(isMeetingCompletedEffective({ ...future, status: 'completed', completedDate: '2026-11-12' }, '2026-11-11', '2026-11-15'), false);
    assert.equal(isMeetingCompletedEffective({ ...future, status: 'completed', completedDate: '2026-11-12' }, '2026-11-20', '2026-11-07'), false);
  });
  check('Amended meetings require confirmation on their effective date', () => {
    const amended = { ...record, isAmended: true, meetingDate: '2026-10-01', amendmentDetails: { originalDate: '2026-10-01', modifiedDate: '2026-11-13' } };
    assert.equal(isMeetingCompletedEffective(amended, '2026-11-20', '2026-11-15'), false);
    assert.equal(isMeetingCompletedEffective({ ...amended, status: 'completed', completedDate: '2026-11-13' }, '2026-11-20', '2026-11-15'), true);
    assert.equal(isMeetingCompletedEffective({ ...amended, status: 'cancelled' }, '2026-11-20', '2026-11-15'), false);
  });
  check('Future MIS, Nirnay and NSAP work is excluded even with a later report date', () => {
    const future = { ...record, misFedDate: '2026-11-10', panchayatNirnayCapturedDate: '2026-11-10' };
    const view = socialAuditRecordAsOf(future, '2026-11-20', '2026-11-07');
    assert.equal(view.misStatus, 'pending');
    assert.equal(view.panchayatNirnayStatus, 'pending');
    assert.equal(nsapRecordsAsOf([{ ...nsap[0], meetingDate: '2026-11-10' }], '2026-11-20', '2026-11-07').length, 0);
    assert.equal(getProgressCutoffDate('2026-11-20', '2026-11-07'), '2026-11-07');
  });
  const reset = () => {
    store.setState({ records: [structuredClone(record)], nsapRecords: [structuredClone(nsap[0])], vrpMembers: [structuredClone(vrps[0])], activityLogs: [],
      asOfDate: '2020-01-01', isLiveSync: false, isEditMode: true, selectedRecordForEdit: null, selectedGPForProfile: null });
    confirmations = []; cloudWrites = 0; acceptWarning = false;
  };
  const data = () => JSON.stringify({ records: store.getState().records, nsap: store.getState().nsapRecords, vrps: store.getState().vrpMembers, logs: store.getState().activityLogs });
  const cases = [
    ['updateRecord', s => s.updateRecord(record.id, { notes: 'change' })],
    ['addRecord', s => s.addRecord(record)], ['deleteRecord', s => s.deleteRecord(record.id)],
    ['markCompleted', s => s.markCompleted(record.id, true)],
    ['cancelMeeting', s => s.cancelMeeting(record.id, 'test')],
    ['rescheduleMeeting', s => s.rescheduleMeeting(record.id, '2026-12-01')],
    ['updatePanchayatNirnayStatus', s => s.updatePanchayatNirnayStatus(record.id, 'pending')],
    ['updateMisStatus', s => s.updateMisStatus(record.id, 'pending')],
    ['syncNirnayFromPayload', s => s.syncNirnayFromPayload({ capturedGps: [] })],
    ['syncMisFromPayload', s => s.syncMisFromPayload({ auditedGps: [] })],
    ['resetToBaseline', s => s.resetToBaseline()],
    ['setNsapRecords', s => s.setNsapRecords([])], ['addNsapRecord', s => s.addNsapRecord(nsap[1])],
    ['updateNsapRecord', s => s.updateNsapRecord(nsap[0].id, { totalBeneficiaries: 1 })],
    ['deleteNsapRecord', s => s.deleteNsapRecord(nsap[0].id)],
    ['addNsapBeneficiary', s => s.addNsapBeneficiary(nsap[0].id, { nameUnicode: 'test', registrationId: 'TEST', category: 'deceased', categoryHindi: 'मृतक' })],
    ['addNsapBeneficiariesBatch', s => s.addNsapBeneficiariesBatch(nsap[0].id, [])],
    ['deleteNsapBeneficiary', s => s.deleteNsapBeneficiary(nsap[0].id, nsap[0].beneficiaries[0].id)],
    ['assignVRPMember', s => s.assignVRPMember(vrps[0].id, 'Baraut')],
    ['unassignVRPMember', s => s.unassignVRPMember(vrps[0].id)],
    ['addVRPMember', s => s.addVRPMember(vrps[0])],
    ['updateVRPMember', s => s.updateVRPMember(vrps[0].id, { name: 'test' })],
    ['deleteVRPMember', s => s.deleteVRPMember(vrps[0].id)],
    ['resetVRPMembersToBaseline', s => s.resetVRPMembersToBaseline()],
    ['forceSyncToFirebase', s => s.forceSyncToFirebase()],
  ];
  for (const [name, run] of cases) {
    reset(); const before = data();
    const result = await run(store.getState());
    assert.equal(confirmations.length, 1, `${name}: warning shown`);
    assert.match(confirmations[0], /01\/01\/2020/);
    assert.equal(data(), before, `${name}: cancel preserves data and logs`);
    assert.equal(cloudWrites, 0, `${name}: cancel does not write to cloud`);
    if (name === 'setNsapRecords') assert.equal(result, false);
    checks++; console.log(`PASS ${name}: cancelled historical change leaves data untouched`);
  }
  reset();
  const before = data();
  store.getState().setAsOfDate('2026-10-31');
  store.getState().tickDelhiClock();
  check('Selecting a historical date does not mutate/save data or jump back to today', () => {
    assert.equal(store.getState().asOfDate, '2026-10-31');
    assert.equal(data(), before); assert.equal(cloudWrites, 0); assert.equal(confirmations.length, 0);
    store.getState().setAsOfDate('');
    assert.equal(store.getState().asOfDate, '2026-10-31');
  });
  acceptWarning = true;
  store.getState().updateRecord(record.id, { notes: 'approved correction' });
  check('Continue permits the explicitly confirmed change', () => {
    assert.equal(store.getState().records[0].notes, 'approved correction');
    assert.equal(confirmations.length, 1);
  });
  confirmations = [];
  store.getState().setLiveSync(true);
  const today = getDelhiDateString();
  check('Return to today restores live mode and requires no historical warning', () => {
    assert.equal(store.getState().asOfDate, today);
    assert.equal(store.getState().isLiveSync, true);
    assert.equal(confirmHistoricalEdit(today, today), true);
    assert.equal(confirmations.length, 0);
  });
  check('Future reporting date cannot unlock completion before the real meeting date', () => {
    reset();
    const realToday = getDelhiDateString();
    const tomorrow = new Date(`${realToday}T00:00:00Z`);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const tomorrowString = tomorrow.toISOString().slice(0, 10);
    store.setState({ records: [{ ...record, meetingDate: tomorrowString }], asOfDate: '2099-12-31' });
    const before = data();
    assert.equal(store.getState().canCompleteMeeting(store.getState().records[0]).canComplete, false);
    const alertBefore = global.alert;
    const alerts = [];
    global.alert = message => alerts.push(message);
    try {
      assert.equal(store.getState().markCompleted(record.id, true), false);
      assert.equal(store.getState().updateRecord(record.id, { status: 'completed' }), false);
    } finally { global.alert = alertBefore; }
    assert.equal(alerts.length, 2);
    assert.equal(data(), before);
    assert.equal(cloudWrites, 0);
  });
  check('Manual completion under a future report date records the real date', () => {
    reset();
    store.setState({ asOfDate: '2099-12-31' });
    assert.equal(store.getState().markCompleted(record.id, true), true);
    assert.equal(store.getState().records[0].completedDate, getDelhiDateString());
  });
  // Invoke the real report component and export handler with isolated React hooks.
  // This proves that the shared cutoff view reaches the downloaded workbook too.
  renderMode = true;
  const ReportDetail = require('../src/components/socialAudit/ReportDetailPage.tsx').default;
  const ReportCenter = () => ReportDetail({ reportId: 'district_summary' });
  const ExcelJS = require('exceljs');
  const find = (node, predicate) => {
    if (!node || typeof node !== 'object') return undefined;
    if (predicate(node)) return node;
    for (const child of React.Children.toArray(node.props?.children)) {
      const match = find(child, predicate);
      if (match) return match;
    }
  };
  for (const [cutoff, nirnay, mis] of [['2026-10-31', 0, '0/1'], ['2026-11-02', 1, '1/1']]) {
    store.setState({ records: [record], nsapRecords: [], asOfDate: cutoff, liveDelhiDate: '2026-11-07', selectedBRP: 'all' });
    const tree = ReportCenter();
    const button = find(tree, node => node.type === 'button' && node.props.onClick?.name === 'handleExportExcel');
    assert.ok(button);
    await button.props.onClick();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await download.arrayBuffer());
    assert.equal(workbook.worksheets[0].getCell('F6').value, nirnay);
    assert.equal(workbook.worksheets[0].getCell('G6').value, mis);
    checks++; console.log(`PASS real district Excel export respects ${cutoff} for Nirnay and MIS`);
  }
  const upcomingRecord = { ...record, id: 'future-unconfirmed', meetingDate: '2099-01-01', misStatus: 'pending', panchayatNirnayStatus: 'pending' };
  store.setState({ records: [record, upcomingRecord], nsapRecords: [], asOfDate: '2099-12-31', liveDelhiDate: getDelhiDateString() });
  const ExecutiveDashboard = require('../src/components/socialAudit/ExecutiveDashboardTab.tsx').default;
  const dashboard = ExecutiveDashboard();
  const completedCard = find(dashboard, node => node.props?.className?.includes('social-audit-kpi') && node.props.onClick?.toString().includes("setActiveModal('completed')"));
  assert.ok(completedCard);
  const completedNumber = find(completedCard, node => node.type === 'span' && node.props.className?.includes('text-3xl'));
  assert.equal(completedNumber.props.children, 1);
  const exportTree = ReportCenter();
  await find(exportTree, node => node.type === 'button' && node.props.onClick?.name === 'handleExportExcel').props.onClick();
  const futureWorkbook = new ExcelJS.Workbook();
  await futureWorkbook.xlsx.load(await download.arrayBuffer());
  assert.equal(futureWorkbook.worksheets[0].getCell('D6').value, 1);
  assert.equal(futureWorkbook.worksheets[0].getCell('E6').value, 1);
  checks++; console.log('PASS actual dashboard card and Excel agree: future unconfirmed meeting is not completed');
  console.log(`\n${checks} checks passed. All Firebase calls mocked; real data unchanged.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
