/* eslint-disable @typescript-eslint/no-require-imports -- Isolated CommonJS harness intercepts Firebase and compiles project TS modules. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (name, parent, ...rest) {
  return originalResolve.call(this, name.startsWith('@/') ? path.join(root, 'src', name.slice(2)) : name, parent, ...rest);
};
require.extensions['.ts'] = (mod, filename) => mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX }
}).outputText, filename);
require.extensions['.tsx'] = require.extensions['.ts'];
const originalLoad = Module._load;
let download, cloudWrites = 0, renderMode = false;
let workbookMode = false, hookStateIndex = 0, hookRefIndex = 0, workbookApi;
const hookChanges = [];
const MockWorkbook = () => null;
Module._load = function (name, parent, ...rest) {
  if (renderMode && name === 'react') return {
    ...React,
    useState: value => {
      const index = hookStateIndex++;
      const initial = typeof value === 'function' ? value() : value;
      return [workbookMode && index === 0 ? true : workbookMode && index === 5 ? 'unsaved' : initial, value => hookChanges.push({ index, value })];
    },
    useMemo: run => run(), useEffect: () => {}, useCallback: run => run,
    useRef: initial => ({ current: workbookMode && hookRefIndex++ === 0 ? workbookApi : initial }),
  };
  if (workbookMode && name === '@fortune-sheet/react') return { Workbook: MockWorkbook };
  if (workbookMode && name.endsWith('.css')) return {};
  if (renderMode && name === '@/stores/socialAuditStore') return { useSocialAuditStore: selector => selector ? selector(store.getState()) : store.getState() };
  if (name === 'file-saver') return { saveAs: blob => { download = blob; } };
  if (name === '@/lib/socialAuditFirebase') return {
    saveSocialAuditToFirestore: async () => { cloudWrites++; return true; },
    loadSocialAuditFromFirestore: async () => { throw Error('Unexpected remote read'); },
    subscribeToSocialAuditFirestore: () => { throw Error('Unexpected remote subscription'); },
  };
  return originalLoad.call(this, name, parent, ...rest);
};
const memory = new Map();
global.localStorage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value), removeItem: key => memory.delete(key) };
global.window = { confirm: () => true, navigator: { userAgent: 'isolated-test' } };
const alerts = [];
global.alert = message => alerts.push(message);
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const ExcelJS = require('exceljs');
const { INITIAL_SOCIAL_AUDIT_RECORDS: roster } = require('../src/data/socialAuditInitialData.ts');
const { INITIAL_NSAP_DATA_RECORDS: initial } = require('../src/data/nsapDataInitial.ts');
const { getNSAPVerification, sumNSAPUnverified } = require('../src/lib/nsapVerification.ts');
const service = require('../src/components/socialAudit/workbook/nsapWorkbookService.ts');
const exporter = require('../src/components/socialAudit/workbook/nsapWorkbookExport.ts');
const { useSocialAuditStore: store } = require('../src/stores/socialAuditStore.ts');
const Card = require('../src/components/socialAudit/NSAPGramPanchayatCard.tsx').default;
const gp = roster.find(record => record.id === 'baraut-13');
const sample = { ...initial.find(record => record.rosterRecordId === gp.id), totalBeneficiaries: 83, verifiedDirect: 57, verifiedFamily: 5, verifiedTotal: 62, unverifiedCount: 6 };
let checks = 0;
function check(name, action) { action(); checks++; console.log(`PASS ${name}`); }
async function main() {
  check('83 - 62 = 21, regardless of old count or beneficiary detail rows', () => {
    assert.equal(getNSAPVerification(sample).unverified, 21);
    assert.equal(getNSAPVerification({ ...sample, beneficiaries: [] }).unverified, 21);
    assert.equal(getNSAPVerification({ ...sample, unverifiedCount: 999 }).unverified, 21);
  });
  check('Recorded verified total, including zero, is never replaced by direct + family', () => {
    assert.equal(getNSAPVerification({ ...sample, verifiedTotal: 0 }).unverified, 83);
    assert.equal(getNSAPVerification({ ...sample, verifiedTotal: 60 }).unverified, 23);
    assert.equal(getNSAPVerification({ ...sample, totalBeneficiaries: 0, verifiedTotal: 0 }).unverified, 0);
  });
  check('Invalid source counts remain visible, never clamped into a healthy zero', () => {
    assert.equal(getNSAPVerification({ ...sample, verifiedTotal: 100 }).unverified, null);
    assert.equal(getNSAPVerification({ ...sample, totalBeneficiaries: 83.5 }).valid, false);
    assert.equal(sumNSAPUnverified([sample, { ...sample, verifiedTotal: 100 }]), null);
    assert.equal(sumNSAPUnverified([sample, sample]), 42);
  });
  const sheets = service.buildNSAPWorkbookData({ records: [gp], nsapRecords: [sample], fontMode: 'unicode' });
  check('GP worksheet and summary both show 21 while preserving names and IDs', () => {
    assert.equal(service.getCellValue(sheets[0], 5, 7), '21');
    assert.equal(service.getCellValue(sheets[1], 5, 7), '21');
    const extracted = service.extractNSAPDataFromWorkbook(sheets, [sample], [gp]);
    assert.equal(extracted[0].unverifiedCount, 21);
    assert.equal(extracted[0].id, sample.id);
    assert.equal(extracted[0].meetingDate, sample.meetingDate);
    assert.deepEqual(extracted[0].beneficiaries.map(b => b.registrationId).sort(), sample.beneficiaries.map(b => b.registrationId).sort());
  });
  check('Reordered sheets cannot exchange GP data', () => {
    const second = roster.find(record => record.id === 'baghpat-1');
    const other = { ...sample, id: 'second', rosterRecordId: second.id, totalBeneficiaries: 200, verifiedTotal: 100, beneficiaries: [] };
    const data = service.buildNSAPWorkbookData({ records: [gp, second], nsapRecords: [sample, other], fontMode: 'unicode' });
    [data[1], data[2]] = [data[2], data[1]];
    const output = service.extractNSAPDataFromWorkbook(data, [sample, other], [gp, second]);
    assert.equal(output.find(record => record.rosterRecordId === gp.id).unverifiedCount, 21);
    assert.equal(output.find(record => record.rosterRecordId === second.id).unverifiedCount, 100);
  });
  check('All 110 named beneficiaries survive saving; their row count does not set unverified total', () => {
    const large = { ...sample, beneficiaries: Array.from({ length: 110 }, (_, i) => ({ id: `named-${i}`, nameUnicode: `नाम ${i}`, registrationId: `00-TEST/${i}`, category: 'unverified', categoryHindi: 'असत्यापित' })) };
    const built = service.buildNSAPWorkbookData({ records: [gp], nsapRecords: [large], fontMode: 'unicode' });
    const extracted = service.extractNSAPDataFromWorkbook(built, [large], [gp])[0];
    assert.equal(extracted.beneficiaries.length, 110);
    assert.equal(extracted.unverifiedCount, 21);
    assert.deepEqual(extracted.beneficiaries.map(b => b.registrationId), large.beneficiaries.map(b => b.registrationId));
  });
  check('Explicit zero and clearing a GP do not restore stale saved counts', () => {
    const zero = { ...sample, verifiedTotal: 0 };
    const built = service.buildNSAPWorkbookData({ records: [gp], nsapRecords: [zero], fontMode: 'unicode' });
    assert.equal(service.extractNSAPDataFromWorkbook(built, [sample], [gp])[0].unverifiedCount, 83);
    const cleared = service.buildNSAPWorkbookData({ records: [gp], nsapRecords: [], fontMode: 'unicode' });
    assert.equal(service.extractNSAPDataFromWorkbook(cleared, [sample], [gp])[0].totalBeneficiaries, 0);
  });
  check('Cards render all three counts and direct workbook editing action', () => {
    const html = renderToStaticMarkup(React.createElement(Card, { record: sample, index: 0, fontViewMode: 'unicode', isEditMode: true, onView() {}, onOpenWorkbook() {}, onPaste() {} }));
    assert.match(html, /असत्यापित/); assert.match(html, />21</); assert.match(html, />83</); assert.match(html, />62</); assert.match(html, /एक्सेल में एडिट/);
    assert.doesNotMatch(html, /0 मृतक.*अलर्ट/);
  });
  store.setState({ records: roster, nsapRecords: [sample], isEditMode: true, asOfDate: '2099-12-31' });
  check('Card navigation selects the correct GP target without changing data', () => {
    const before = JSON.stringify(store.getState().nsapRecords), writes = cloudWrites;
    store.getState().openNsapWorkbook(gp.id);
    assert.equal(store.getState().activeTab, 'nsap-workbook');
    assert.equal(store.getState().nsapWorkbookTargetId, gp.id);
    assert.equal(JSON.stringify(store.getState().nsapRecords), before); assert.equal(cloudWrites, writes);
    store.getState().clearNsapWorkbookTarget();
    assert.equal(store.getState().nsapWorkbookTargetId, null);
  });
  check('Actual NSAP page card opens its own GP workbook sheet', () => {
    renderMode = true;
    store.setState({ nsapRecords: [sample], selectedBRP: 'all', selectedBlock: 'all', liveDelhiDate: '2026-11-07' });
    const NSAPDataTab = require('../src/components/socialAudit/NSAPDataTab.tsx').default;
    const find = node => {
      if (!node || typeof node !== 'object') return;
      if (node.type === Card) return node;
      for (const child of React.Children.toArray(node.props?.children)) { const match = find(child); if (match) return match; }
    };
    const card = find(NSAPDataTab());
    assert.ok(card, 'Recorded GP card exists');
    assert.equal(card.props.record.rosterRecordId, gp.id);
    card.props.onOpenWorkbook();
    assert.equal(store.getState().nsapWorkbookTargetId, gp.id);
    renderMode = false;
  });
  check('Actual workbook dropdown saves pending edits and synchronizes the active sheet', () => {
    renderMode = true; workbookMode = true; hookStateIndex = 0; hookRefIndex = 0;
    let activated;
    workbookApi = { getAllSheets: () => sheets, activateSheet: options => { activated = options.id; } };
    const WorkbookPage = require('../src/components/socialAudit/workbook/NSAPWorkbook.tsx').default;
    const find = (node, predicate) => {
      if (!node || typeof node !== 'object') return;
      if (predicate(node)) return node;
      for (const child of React.Children.toArray(node.props?.children)) { const match = find(child, predicate); if (match) return match; }
    };
    const tree = WorkbookPage();
    const engine = find(tree, node => node.type === MockWorkbook);
    assert.ok(engine);
    assert.equal(engine.props.allowEdit, true);
    assert.equal(engine.props.data.find(sheet => sheet.status === 1).id, `sheet-${gp.id}`);
    find(tree, node => node.type === 'select').props.onChange({ target: { value: '0' } });
    assert.equal(activated, 'sheet-summary');
    assert.ok(hookChanges.some(change => change.index === 4 && change.value === 0));
    assert.equal(store.getState().nsapRecords[0].unverifiedCount, 21);
    store.setState({ isEditMode: false }); hookStateIndex = 0; hookRefIndex = 0;
    const lockedEngine = find(WorkbookPage(), node => node.type === MockWorkbook);
    assert.equal(lockedEngine.props.allowEdit, false);
    assert.equal(lockedEngine.props.hooks.beforeUpdateCell(5, 2), false);
    store.setState({ isEditMode: true });
    renderMode = false; workbookMode = false;
  });
  check('Saving edits and adding named beneficiaries retain derived count', () => {
    assert.equal(store.getState().setNsapRecords([sample]), true);
    assert.equal(store.getState().nsapRecords[0].unverifiedCount, 21);
    store.getState().addNsapBeneficiary(sample.id, { nameUnicode: 'नया नाम', registrationId: '000001', category: 'unverified', categoryHindi: 'असत्यापित' });
    assert.equal(store.getState().nsapRecords[0].unverifiedCount, 21);
    store.getState().updateNsapRecord(sample.id, { verifiedTotal: 70 });
    assert.equal(store.getState().nsapRecords[0].unverifiedCount, 13);
    assert.equal(store.getState().updateNsapRecord(sample.id, { verifiedTotal: 100 }), false);
    assert.equal(store.getState().nsapRecords[0].unverifiedCount, 13);
  });
  renderMode = true;
  const NSAPDataTab = require('../src/components/socialAudit/NSAPDataTab.tsx').default;
  store.setState({ nsapRecords: [{ ...sample, beneficiaries: [{ ...sample.beneficiaries[0], nameUnicode: 'd`".kk, नाम' }] }] });
  const findCSVButton = node => {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'button' && node.props.onClick?.name === 'handleExportCSV') return node;
    for (const child of React.Children.toArray(node.props?.children)) { const match = findCSVButton(child); if (match) return match; }
  };
  global.document = { createElement: () => ({ click() {} }) };
  const oldCreate = URL.createObjectURL, oldRevoke = URL.revokeObjectURL;
  URL.createObjectURL = blob => { download = blob; return 'blob:test'; };
  URL.revokeObjectURL = () => {};
  findCSVButton(NSAPDataTab()).props.onClick();
  const csv = await download.text();
  check('Beneficiary CSV escapes quote and comma characters without losing source text', () => {
    assert.ok(csv.includes('"d`"".kk, नाम"'));
  });
  URL.createObjectURL = oldCreate; URL.revokeObjectURL = oldRevoke;
  renderMode = false;
  let printed = '';
  global.window.open = () => ({ document: { write: html => { printed = html; }, close() {} } });
  exporter.printNSAPActiveSheet({ data: [[], [{ v: 21, m: '6' }, { v: 'नाम <स्रोत>' }]] });
  check('Workbook print uses current cell values and preserves literal source characters', () => {
    assert.match(printed, />21<\/td>/);
    assert.ok(printed.includes('नाम &lt;स्रोत&gt;'));
  });
  await exporter.exportNSAPWorkbookToExcel(sheets, 'test-only', 'unicode');
  const output = new ExcelJS.Workbook();
  await output.xlsx.load(await download.arrayBuffer());
  check('Exported GP and summary contain subtraction formulas and cached result 21', () => {
    for (const sheet of output.worksheets) {
      assert.equal(sheet.getCell('H6').result, 21);
      assert.match(sheet.getCell('H6').formula, /C6-F6/);
    }
  });
  const exportedFile = { arrayBuffer: () => download.arrayBuffer() };
  const imported = await exporter.importNSAPWorkbookFromExcel(exportedFile, [gp], [sample]);
  check('Export/reimport preserves 83, 62 and derived 21 with stable record identity', () => {
    assert.equal(imported.success, true);
    assert.equal(imported.updatedRecords[0].unverifiedCount, 21);
    assert.equal(imported.updatedRecords[0].verifiedTotal, 62);
    assert.equal(imported.updatedRecords[0].id, sample.id);
  });
  if (process.argv[2]) {
    const bytes = fs.readFileSync(process.argv[2]);
    const hash = require('node:crypto').createHash('sha256').update(bytes).digest('hex');
    const result = await exporter.importNSAPWorkbookFromExcel({ arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) }, roster, initial);
    check('Original user workbook matches all 19 GP sheets, including different header row layouts', () => {
      assert.equal(result.success, true, result.message);
      assert.equal(result.sheetsCount, 19);
      assert.equal(result.updatedRecords.find(record => record.rosterRecordId === 'baraut-13').unverifiedCount, 21);
      assert.equal(result.updatedRecords.find(record => record.rosterRecordId === 'baghpat-30').verifiedTotal, 147);
      assert.equal(getNSAPVerification(result.updatedRecords.find(record => record.rosterRecordId === 'baghpat-16')).valid, false);
      assert.equal(new Set(result.updatedRecords.map(record => record.rosterRecordId)).size, 19);
      const name = result.updatedRecords.find(record => record.rosterRecordId === 'baghpat-1').beneficiaries.find(record => record.registrationId === '31651001342');
      assert.equal(name.nameKrutiDev, 'm"kk');
      const duplicate = result.updatedRecords.find(record => record.rosterRecordId === 'baghpat-5').beneficiaries.filter(record => record.registrationId === '31651001478');
      assert.equal(duplicate.length, 2);
      assert.equal(new Set(duplicate.map(record => record.id)).size, 2);
      assert.equal(require('node:crypto').createHash('sha256').update(fs.readFileSync(process.argv[2])).digest('hex'), hash);
    });
  }
  console.log(`\n${checks} NSAP checks passed. Firebase mocked; original workbook unchanged.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
