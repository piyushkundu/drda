/* eslint-disable @typescript-eslint/no-require-imports -- Isolated project TS harness; no cloud writes. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const root = path.resolve(__dirname, '..');
const ts = require('typescript');
const originalResolve = Module._resolveFilename;
const bundled = 'C:/Users/piyus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
Module._resolveFilename = function(name, parent, ...rest) {
  if (name.startsWith('@/')) name = path.join(root, 'src', name.slice(2));
  if (['docx', 'jszip'].includes(name) && fs.existsSync(path.join(bundled, name))) name = path.join(bundled, name);
  return originalResolve.call(this, name, parent, ...rest);
};
for (const extension of ['.ts','.tsx']) require.extensions[extension] = (mod, filename) => mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX } }).outputText, filename);
const model = require('../src/lib/socialAuditReports.ts');
const exportsLib = require('../src/lib/exportSocialAuditReports.ts');
const JSZip = require('jszip');
const ExcelJS = require('exceljs');
const { INITIAL_SOCIAL_AUDIT_RECORDS: roster } = require('../src/data/socialAuditInitialData.ts');
const { INITIAL_NSAP_DATA_RECORDS: nsap } = require('../src/data/nsapDataInitial.ts');
const base = roster[0];
const first = { ...base, id:'gp-1', gpNameUnicode:'पहली पंचायत', meetingDate:'2026-09-12', originalMeetingDate:undefined, isAmended:false, status:'scheduled', misStatus:'fed', misFedDate:'2026-11-02', panchayatNirnayStatus:'captured', panchayatNirnayCapturedDate:'2026-11-01', hasNSAP:true, hasMGNREGA:true, hasPMAYG:true, brpName:'पहले बीआरपी', brpPhone:'9000000001' };
const second = { ...first, id:'gp-2', gpNameUnicode:'दूसरी पंचायत', meetingDate:'2026-10-20', brpName:'दूसरे बीआरपी', brpPhone:'9000000002' };
const future = { ...first, id:'gp-future', gpNameUnicode:'भविष्य पंचायत', meetingDate:'2026-11-20' };
const detail = { ...nsap[0], id:'nsap-gp-1', rosterRecordId:first.id, gpNameUnicode:first.gpNameUnicode, meetingDate:'2026-09-12', totalBeneficiaries:83, verifiedTotal:62, verifiedDirect:57, verifiedFamily:5, financialIrregularityAmount:undefined, beneficiaries:[{id:'ben-1',nameUnicode:'नाम',registrationId:'00-AB/12',category:'deceased',categoryHindi:'मृतक'}] };
const input = { records:[first,second,future], nsapRecords:[detail], asOfDate:'2026-11-07', today:'2026-11-07' };
let count = 0;
const check = (name, action) => { action(); count++; console.log('PASS '+name); };
const value = (mpr, key) => Object.values(mpr.fields).flat().find(field => field.key === key).value;
async function main() {
  const before=JSON.stringify(input);
  const referencePath=process.argv.find(arg=>arg.toLowerCase().endsWith('.docx'));
  if(referencePath){
    const baseline=require('../src/data/monthlyReportWordBaseline.ts').MONTHLY_WORD_BASELINES;
    const originalXml=await (await JSZip.loadAsync(fs.readFileSync(referencePath))).file('word/document.xml').async('string');
    const tables=originalXml.match(/<w:tbl(?=[\s>])[^>]*>[\s\S]*?<\/w:tbl>/g);
    const cells=index=>(tables[index].match(/<w:tr(?=[\s>])[^>]*>[\s\S]*?<\/w:tr>/g)||[]).map(row=>(row.match(/<w:tc(?=[\s>])[^>]*>[\s\S]*?<\/w:tc>/g)||[]).map(cell=>[...cell.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)].map(match=>match[1]).join('').trim()));
    const num=text=>text&&!/^(&#160;|&nbsp;|\s)*$/.test(text)?Number(text):null;
    const pmayKeys=['pmay_findings','pmay_resolved_meeting','pmay_unresolved','pmay_resolved_total','pmay_misused','pmay_recovered','pmay_fir','pmay_action'];
    const mgnregaKeys=['mgnrega_completed','mgnrega_uploaded','mgnrega_no_records','mgnrega_supervisor_absent','mgnrega_findings','mgnrega_resolved','mgnrega_unresolved','mgnrega_financial','mgnrega_deviation','mgnrega_recovered','mgnrega_fir','mgnrega_action'];
    check('Retained October and September housing/MGNREGA values exactly match the original Word',()=>{
      for(const [source,pmayIndex,mgnregaIndex] of [[baseline[1],0,1],[baseline[0],4,3]]){
        const pmay=cells(pmayIndex),mgnrega=cells(mgnregaIndex);
        assert.equal(source.values.pmay_completed,num(pmay[1].at(-1)));assert.equal(source.values.pmay_houses,num(pmay[2].at(-1)));
        ['pmay_sc','pmay_st','pmay_minority','pmay_disabled','pmay_other'].forEach((key,index)=>assert.equal(source.values[key],num(pmay[5][index+1]),key));
        pmayKeys.forEach((key,index)=>assert.equal(source.values[key],num(pmay[index+6].at(-1)),key));
        mgnregaKeys.forEach((key,index)=>assert.equal(source.values[key],num(mgnrega[index+2].at(-1)),key));
      }
      const nsap=cells(2);['proposed_fy','proposed','completed','total','direct','family','ineligible','deceased','financial'].forEach((key,index)=>{
        assert.equal(baseline[1].values['nsap_'+key],num(nsap[index+1].at(-1)));
        assert.equal(baseline[1].values['nfbs_'+key],num(nsap[index+11].at(-1)));
      });
    });
  }
  const september=model.buildMonthlyReport(input,'2026-09');
  const october=model.buildMonthlyReport(input,'2026-10');
  check('Monthly totals use the selected month end and each actual work date', () => {
    assert.equal(september.period.cutoff,'2026-09-30');
    assert.equal(value(september,'pmay_completed'),2);
    assert.equal(value(october,'pmay_completed'),4);
    assert.equal(value(october,'mgnrega_uploaded'),0);
    assert.equal(value(model.buildMonthlyReport(input,'2026-11'),'mgnrega_uploaded'),2);
  });
  check('Old reference date and real today both cap progress; future month is rejected', () => {
    assert.equal(model.buildMonthlyReport({...input,asOfDate:'2026-10-15'},'2026-10').period.cutoff,'2026-10-15');
    assert.equal(model.buildMonthlyReport({...input,asOfDate:'2099-12-31'},'2026-11').period.cutoff,'2026-11-07');
    assert.throws(()=>model.buildMonthlyReport(input,'2026-12'));
    assert.throws(()=>model.buildMonthlyReport(input,'2025-10'));
  });
  check('Dated Word fallbacks retain complete housing, explicit zeros and original blanks', () => {
    assert.equal(value(september,'pmay_houses'),3);
    assert.equal(value(october,'pmay_houses'),4);
    assert.equal(value(october,'pmay_findings'),11);
    assert.equal(value(october,'pmay_resolved_meeting'),7);
    assert.equal(value(october,'pmay_unresolved'),4);
    assert.equal(value(october,'mgnrega_calendar'),55);
    assert.equal(value(october,'mgnrega_findings'),201);
    assert.equal(value(october,'nfbs_total'),0);
    assert.equal(value(october,'pmay_sc'),null);
    assert.equal(october.fields.pmay.find(field=>field.key==='pmay_houses').origin,'word');
    assert.equal(october.fields.pmay.find(field=>field.key==='pmay_houses').dataThrough,'2026-10-31');
    assert.equal(value(model.buildMonthlyReport(input,'2026-08'),'pmay_houses'),null);
    assert.equal(value(september,'nsap_total'),83);
    assert.equal(value(september,'nsap_direct'),57);
  });
  check('Available website totals carry coverage and data dates, while conflicts remain labelled', () => {
    assert.equal(october.coverage.completed,2); assert.equal(october.coverage.recorded,1);
    assert.equal(value(october,'nsap_total'),83);
    assert.ok(october.fields.nsap.find(field=>field.key==='nsap_total').coverage.includes('1/2'));
    assert.equal(october.websiteDataThrough,'2026-09-12');
    assert.equal(october.websiteCompleteThrough,'2026-09-12');
    assert.ok(model.buildMonthlyReport({...input,nsapRecords:[{...detail,verifiedTotal:100}]},'2026-09').notes.some(note=>note.includes('विरोध')));
    assert.equal(value(model.buildMonthlyReport({...input,nsapRecords:[{...detail,financialIrregularityAmount:0}]},'2026-09'),'nsap_financial'),0);
    assert.equal(model.buildMonthlyReport({...input,nsapRecords:[detail,{...detail,id:'duplicate'}]},'2026-09').fields.nsap.find(field=>field.key==='nsap_total').origin,'word');
    assert.equal(value(model.buildMonthlyReport({...input,records:[...input.records,{...first,id:'outside-year',meetingDate:'2099-01-01'}]},'2026-09'),'nsap_proposed_fy'),3);
  });
  const manual={values:{pmay_houses:6,pmay_sc:0,mgnrega_findings:205,nsap_family:null},completeThrough:{pmay:'2026-10-31'},updatedAt:'2026-11-07T06:00:00Z'};
  const edited=model.buildMonthlyReport(input,'2026-11',manual);
  check('Per-month manual values, explicit zero and deliberate blank override source fallback',()=>{
    assert.equal(value(edited,'pmay_houses'),6);assert.equal(value(edited,'pmay_sc'),0);assert.equal(value(edited,'nsap_family'),null);
    assert.equal(edited.fields.pmay.find(field=>field.key==='pmay_houses').origin,'manual');
    assert.equal(value(model.buildMonthlyReport(input,'2026-10'),'pmay_houses'),4);
    assert.equal(model.validateMonthlyReportDraft('2026-11',manual,'2026-11-07'),undefined);
    assert.ok(model.validateMonthlyReportDraft('2026-11',{...manual,values:{pmay_houses:-1}},'2026-11-07'));
    assert.ok(model.validateMonthlyReportDraft('2026-11',{...manual,values:{pmay_houses:1.5}},'2026-11-07'));
    assert.ok(model.validateMonthlyReportDraft('2026-11',{...manual,completeThrough:{pmay:'2026-11-30'}},'2026-11-07'));
  });
  check('BRP, block, scheme, status filters restrict matching NSAP data and source is unchanged', () => {
    const report=model.buildSocialAuditReport('nsap_beneficiary',{...input,filters:{brp:first.brpPhone}});
    assert.equal(report.tables[0].rows.length,1); assert.equal(report.tables[0].rows[0][6],21);
    assert.equal(model.buildSocialAuditReport('nsap_beneficiary',{...input,filters:{brp:second.brpPhone}}).tables[0].rows.length,0);
    assert.equal(model.buildSocialAuditReport('all_status',{...input,filters:{status:'upcoming'}}).tables[0].rows.length,1);
    assert.equal(JSON.stringify(input),before);
  });
  check('Every catalogue entry has its own report tables with consistent column counts', () => {
    for (const report of model.REPORT_CATALOG.filter(report=>report.id!=='monthly_mpr')) {
      const data=model.buildSocialAuditReport(report.id,input);
      assert.ok(data.tables.length,report.id);
      data.tables.forEach(table=>table.rows.forEach(row=>assert.equal(row.length,table.headers.length,report.id)));
    }
    assert.equal(model.REPORT_CATALOG.length,17);
  });
  check('Hindi text converts to Kruti Dev while Latin IDs, English and dates remain exact', () => {
    assert.equal(exportsLib.reportTextRuns('00-AB/12')[0].font,'Arial');
    assert.equal(exportsLib.reportTextRuns('00-AB/12')[0].text,'00-AB/12');
    assert.ok(exportsLib.reportTextRuns('जनपद बागपत 2026').some(run=>run.font==='Kruti Dev 010'));
    assert.ok(exportsLib.reportTextRuns('जनपद बागपत 2026').every(run=>!/[\u0900-\u097f]/.test(run.text)));
  });
  const template=fs.readFileSync(path.join(root,'public/templates/social-audit-mpr-2026.docx'));
  const generated=await exportsLib.createMonthlyMprDocx(template,september);
  const archive=await JSZip.loadAsync(generated), source=await JSZip.loadAsync(template);
  const xml=await archive.file('word/document.xml').async('string');
  check('Monthly DOCX resolves every slot; all untouched package parts remain byte-identical', () => {
    assert.doesNotMatch(xml,/\{\{/); assert.doesNotMatch(xml,/October 2026|September 2026.*October/);
    assert.match(xml,/September 2026/); assert.match(xml,/>83<\/w:t>/); assert.match(xml,/Kruti Dev 010/);
    assert.doesNotMatch(xml.replace(/<[^>]+>/g,''),/vDVwcj|vDVqcj|October 2026/);
    assert.equal((xml.match(/<w:tbl>/g)||[]).length,3);
  });
  for(const name of Object.keys(source.files).filter(name=>name!=='word/document.xml'&&!source.files[name].dir)) assert.deepEqual(await archive.file(name).async('uint8array'),await source.file(name).async('uint8array'),name);
  const editedDocx=await exportsLib.createMonthlyMprDocx(template,edited);
  const editedXml=await (await JSZip.loadAsync(editedDocx)).file('word/document.xml').async('string');
  check('Word includes manual edits plus an encoded source/date appendix without changing primary tables',()=>{
    assert.match(editedXml,/>6<\/w:t>/);
    assert.ok(editedXml.includes(require('../src/lib/fontConversion/unicodeToKrutiDev.ts').unicodeToKrutiDev('पुराना Word डेटा').split(' ')[0]));
    assert.equal((editedXml.match(/<w:tbl>/g)||[]).length,3);
    assert.equal((editedXml.match(/<w:pageBreakBefore\/>/g)||[]).length>=3,true);
  });
  check('Partial current-month report visibly states the actual cutoff',()=>{
    assert.equal(exportsLib.reportPrintHtml(model.monthlyReportDocument(october),'data:font/ttf;base64,TEST').includes('Kruti Dev 010'),true);
  });
  const beneficiary=model.buildSocialAuditReport('nsap_beneficiary',input);
  const excel=await exportsLib.createReportExcel(beneficiary);
  const workbook=new ExcelJS.Workbook();await workbook.xlsx.load(excel);
  check('NSAP Excel exports 21 remaining, exact registration string and real Kruti Dev runs',()=>{
    assert.equal(workbook.worksheets[0].getCell('G6').value,21);
    assert.equal(workbook.worksheets[1].getCell('E6').value,'00-AB/12');
    assert.equal(workbook.worksheets[1].getCell('E6').numFmt,'@');
    assert.ok(workbook.worksheets[0].getCell('B5').value.richText.some(run=>run.font.name==='Kruti Dev 010'));
  });
  const brp=model.buildSocialAuditReport('brp_wise',input);
  const docx=await exportsLib.createReportDocx(brp);
  const brpArchive=await JSZip.loadAsync(docx), brpXml=await brpArchive.file('word/document.xml').async('string');
  check('BRP Word and print use converted Hindi rather than font-label-only Unicode',()=>{
    assert.match(brpXml,/Kruti Dev 010/);assert.doesNotMatch(brpXml,/[\u0900-\u097f]/);
    const html=exportsLib.reportPrintHtml(brp,'data:font/ttf;base64,TEST');assert.match(html,/@font-face/);assert.doesNotMatch(html,/<aside|social-audit-sidebar/);
  });
  // Exercise the real component's selection, preview and download callbacks.
  const React=require('react');
  const load=Module._load;
  let stateIndex=0, downloaded, filename, conversionInput, conversions=0;
  Module._load=function(name,parent,...rest){
    if(name==='react')return {...React,useState:initial=>{const index=stateIndex++;return[index===5?'2026-09':typeof initial==='function'?initial():initial,()=>{}]},useMemo:run=>run(),useEffect:()=>{}};
    if(name==='@/stores/socialAuditStore')return {useSocialAuditStore:selector=>{const state={...input,liveDelhiDate:input.today,selectedBRP:'all',monthlyReportDrafts:{},isEditMode:false,currentUser:{role:'ddo',name:'Test'},setIsEditMode:()=>true};return selector?selector(state):state}};
    if(name==='file-saver')return {saveAs:(blob,name)=>{downloaded=blob;filename=name}};
    return load.call(this,name,parent,...rest);
  };
  const fontBytes=fs.readFileSync(path.join(root,'public/fonts/KrutiDev010.ttf'));
  global.fetch=async (url,options)=>{
    let bytes=String(url).includes('/fonts/')?fontBytes:template;
    if(String(url)==='/api/social-audit/reports/pdf'){
      conversions++;conversionInput=Buffer.from(options.body);
      assert.equal(options.method,'POST');
      assert.equal(options.headers['Content-Type'],'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      bytes=Buffer.from('%PDF-1.7\nMOCK NATIVE CONVERTER');
    }
    return {ok:true,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};
  };
  const Page=require('../src/components/socialAudit/ReportDetailPage.tsx').default;
  const find=(node,predicate)=>{
    if(!node||typeof node!=='object')return;
    if(predicate(node))return node;
    for(const child of React.Children.toArray(node.props?.children)){const match=find(child,predicate);if(match)return match}
  };
  for(const meta of model.REPORT_CATALOG){
    stateIndex=0;
    const tree=Page({reportId:meta.id});
    const button=find(tree,node=>node.type==='button'&&node.props.onClick?.name==='handleExportWord');
    assert.ok(button);assert.equal(Boolean(button.props.disabled),false);
    await button.props.onClick();
    assert.ok(filename.includes(meta.id),meta.id);
    const wordDownload=Buffer.from(await downloaded.arrayBuffer());
    const output=await JSZip.loadAsync(wordDownload);
    assert.ok(output.file('word/document.xml'));
    await find(tree,node=>node.type==='button'&&node.props.onClick?.name==='handleExportPdf').props.onClick();
    assert.ok(filename.endsWith('.pdf'),meta.id);
    assert.equal(Buffer.from(await downloaded.arrayBuffer()).subarray(0,5).toString(),'%PDF-');
    assert.deepEqual(conversionInput,wordDownload,`${meta.id}: PDF receives the exact downloaded Word bytes`);
    const previousConversions=conversions;
    await find(tree,node=>node.type==='button'&&node.props.onClick?.name==='handleExportPdf').props.onClick();
    assert.equal(conversions,previousConversions,'same report snapshot reuses its converted PDF');
  }
  check('All 17 dedicated reports use byte-identical Word input for PDF; repeated downloads reuse conversion',()=>assert.ok(filename.includes('nsap_quality')));
  stateIndex=0;
  const Catalogue=require('../src/components/socialAudit/ReportCenterTab.tsx').default;
  const catalogue=Catalogue();
  check('Every report card navigates to its own URL; catalogue has no inline export controls',()=>{
    for(const meta of model.REPORT_CATALOG)assert.ok(find(catalogue,node=>node.props?.href===`/social-audit/reports/${meta.id}`),meta.id);
    assert.equal(find(catalogue,node=>node.type==='button'&&node.props.onClick?.name==='handleExportWord'),undefined);
  });
  Module._load=load;
  if(process.argv.includes('--write-qa')){
    const out=path.join(root,'scratch/mpr-report-review');fs.mkdirSync(out,{recursive:true});
    fs.writeFileSync(path.join(out,'sample-monthly.docx'),generated);
    fs.writeFileSync(path.join(out,'sample-brp.docx'),docx);
    fs.writeFileSync(path.join(out,'sample-monthly.json'),JSON.stringify(september,null,2));
    fs.writeFileSync(path.join(out,'sample-edited-monthly.docx'),editedDocx);
  }
  console.log(`\n${count} report checks passed. No cloud writes.`);
}
main().catch(error=>{console.error(error);process.exitCode=1});
