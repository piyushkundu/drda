/* eslint-disable @typescript-eslint/no-require-imports -- In-memory TS/component harness. No cloud transport. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const bundled = 'C:/Users/piyus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const resolve = Module._resolveFilename;
Module._resolveFilename = function(name, parent, ...rest) {
 if(name.startsWith('@/'))name=path.join(root,'src',name.slice(2));
 if(['docx','jszip','exceljs'].includes(name)&&fs.existsSync(path.join(bundled,name)))name=path.join(bundled,name);
 return resolve.call(this,name,parent,...rest);
};
for (const extension of ['.ts','.tsx']) require.extensions[extension] = (mod, filename) => mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX } }).outputText, filename);
const { buildVrpAuditProgress, parseCalendarVrpNames, vrpProfilesForMember } = require('../src/lib/vrpAuditProgress.ts');
const { buildSocialAuditReport, REPORT_CATALOG } = require('../src/lib/socialAuditReports.ts');
const { INITIAL_SOCIAL_AUDIT_RECORDS: records } = require('../src/data/socialAuditInitialData.ts');
const { INITIAL_VRP_RECORDS: members } = require('../src/data/vrpInitialData.ts');
const base = records[0];
const make = (id, date, names, extra={}) => ({ ...base, id, gpNameUnicode:id, teamMembersUnicode:names, meetingDate:date, startDate:date, originalMeetingDate:undefined, isAmended:false, amendmentDetails:undefined, status:'scheduled', rescheduleStatus:'not_required', cancellationDetails:undefined, ...extra });
const roster = [make('old-a','2026-10-20','राम (पहला गाँव)  सीता (दूसरा गाँव)'), make('old-b','2026-10-21','सीता (दूसरा गाँव)'), make('overdue','2026-11-10','राम (पहला गाँव)'), make('future','2026-11-13','राम (पहला गाँव)')];
const vrps = [{...members[0],id:'ram',empCode:'RAM-1',name:'Ram',nameHindi:'राम',assignedBlock:null}, {...members[1],id:'sita',empCode:'SITA-1',name:'Sita',nameHindi:'सीता',assignedBlock:'Baghpat'}];
const findProfile = (progress,name) => progress.profiles.find(profile=>profile.name===name);
let count=0;
const check=(name, run)=>{run();count++;console.log(`PASS ${name}`)};
async function main(){
 const before=JSON.stringify({roster,vrps});
 check('Parser recovers every literal member in original malformed bracket examples',()=>{
  const parsed=parseCalendarVrpNames('योगिता शर्मा (अगंदपुर)   पूनम शर्मा (बिजरौल)   कपिल तोमर (आ0 खेडी   सुमन (अगंदपुर)');
  assert.deepEqual(parsed.map(p=>[p.name,p.locality]),[['योगिता शर्मा','अगंदपुर'],['पूनम शर्मा','बिजरौल'],['कपिल तोमर','आ0 खेडी'],['सुमन','अगंदपुर']]);
  assert.deepEqual(parseCalendarVrpNames('पवन शर्मा (खेडकी)  कविता (नेथला').map(p=>p.name),['पवन शर्मा','कविता']);
  assert.deepEqual(parseCalendarVrpNames('पहला नाम, दूसरा नाम').map(p=>p.name),['पहला नाम','दूसरा नाम']);
 });
 const progress=buildVrpAuditProgress(roster,vrps,'2026-11-30','2026-11-12');
 check('Per-GP names determine person counts; present team/reserve status awards no additional meetings',()=>{
  assert.deepEqual(findProfile(progress,'राम').counts,{completed:1,upcoming:1,overdue:1,cancelled:0,undated:0});
  assert.equal(findProfile(progress,'सीता').counts.completed,2);
  assert.equal(findProfile(progress,'सीता').duties.length,2);
  assert.equal(findProfile(progress,'राम').member.id,'ram');
  assert.equal(progress.completedGPs,2);
  assert.equal(progress.profiles.reduce((sum,p)=>sum+p.counts.completed,0),3);
 });
 check('Old cutoff excludes later meetings; future selection caps work at real today',()=>{
  assert.equal(buildVrpAuditProgress(roster,vrps,'2026-10-20','2026-11-12').completedGPs,1);
  assert.equal(progress.cutoff,'2026-11-12');
  assert.equal(findProfile(progress,'राम').duties.find(d=>d.record.id==='future').status,'upcoming');
  const later=buildVrpAuditProgress([make('manual','2026-11-10','राम (पहला गाँव)',{status:'completed',completedDate:'2026-11-11'})],vrps,'2026-11-12','2026-11-12');
  assert.equal(later.completedGPs,1);assert.equal(later.profiles[0].duties[0].completedDate,'2026-11-11');
 });
 check('Historical cancellation and amendment dates follow the shared as-of projection',()=>{
  const cancelled=make('cancelled','2026-10-20','राम (पहला गाँव)',{status:'cancelled',cancellationDetails:{cancelledDate:'2026-11-05',cancelledAt:'2026-11-05T10:00:00Z',previousMeetingDate:'2026-10-20',reason:'test'}});
  assert.equal(buildVrpAuditProgress([cancelled],vrps,'2026-11-01','2026-11-12').completedGPs,1);
  assert.equal(buildVrpAuditProgress([cancelled],vrps,'2026-11-07','2026-11-12').profiles[0].counts.cancelled,1);
  const amended=make('amended','2026-11-20','राम (पहला गाँव)',{isAmended:true,status:'amended',originalMeetingDate:'2026-10-20',amendmentDetails:{originalDate:'2026-10-20',modifiedDate:'2026-11-20'}});
  assert.equal(buildVrpAuditProgress([amended],vrps,'2026-11-07','2026-11-12').profiles[0].counts.upcoming,1);
 });
 check('Repeated name and repeated GP row cannot double count an individual duty',()=>{
  const record=make('duplicate','2026-10-20','राम (पहला गाँव) राम (पहला गाँव)');
  const data=buildVrpAuditProgress([record,record],vrps,'2026-11-07','2026-11-07');
  assert.equal(data.profiles[0].counts.completed,1);assert.equal(data.totalGPs,1);
 });
 check('Duplicate and shortened names never get silently attached to the wrong master employee',()=>{
  const data=buildVrpAuditProgress([make('id-check','2026-10-20','राम (पहला गाँव)')],[...vrps,{...vrps[0],id:'ram-full',nameHindi:'राम सिंह'}],'2026-11-07','2026-11-07');
  assert.equal(data.profiles[0].member,undefined);assert.equal(data.profiles[0].candidates.length,2);
  assert.equal(vrpProfilesForMember(data,'ram').length,1);
  const real=buildVrpAuditProgress(records,members,'2026-11-07','2026-11-07');
  assert.equal(findProfile(real,'विपिन कुमार').member,undefined);
  assert.equal(findProfile(real,'सतेन्द्र कुमार').member,undefined,'short exact name also competes with longer master name');
 });
 check('Missing team names and missing/rescheduled dates remain explicit',()=>{
  const data=buildVrpAuditProgress([make('no-team','2026-10-20',''),make('no-date','','राम (पहला गाँव)'),make('re-date','2026-10-20','राम (पहला गाँव)',{rescheduleStatus:'pending'})],vrps,'2026-11-07','2026-11-07');
  assert.equal(data.missingTeamGPs.length,1);assert.equal(findProfile(data,'राम').counts.undated,2);
 });
 check('Block and BRP filters restrict calendar assignments, including former/current members',()=>{
  const data=[...roster,make('other','2026-10-20','राम (पहला गाँव)',{block:'Baraut',brpPhone:'9999999999'})];
  assert.equal(buildVrpAuditProgress(data,vrps,'2026-11-12','2026-11-12',{block:'Baraut'}).totalGPs,1);
  assert.equal(buildVrpAuditProgress(data,vrps,'2026-11-12','2026-11-12',{brp:base.brpPhone}).totalGPs,4);
 });
 check('All 88 original GP teams produce 24 calendar identities without losing malformed source names',()=>{
  const data=buildVrpAuditProgress(records,members,'2026-11-07','2026-11-07');
  assert.equal(data.totalGPs,88);assert.equal(data.missingTeamGPs.length,0);assert.equal(data.profiles.length,24);
  assert.equal(findProfile(data,'कपिल तोमर').duties.length,12);assert.equal(findProfile(data,'सुमन').duties.length,14);
  assert.equal(findProfile(data,'विपिन कुमार').duties.length,10);
  assert.equal(findProfile(data,'सुधीर कुमार').duties.length,15);
 });
 const input={records:roster,nsapRecords:[],vrpMembers:vrps,asOfDate:'2026-11-30',today:'2026-11-12'};
 const summary=buildSocialAuditReport('vrp_wise',input), detail=buildSocialAuditReport('vrp_detail',input);
 check('VRP summary and detailed reports share dates/counts with the on-screen calendar projection',()=>{
  assert.equal(REPORT_CATALOG.filter(item=>item.id.startsWith('vrp')).length,2);
  const row=summary.tables[0].rows.find(row=>row[1]==='राम');assert.equal(row[6],1);assert.equal(row[7],1);assert.equal(row[8],1);
  assert.equal(detail.tables.reduce((sum,t)=>sum+t.rows.length,0),5);
  assert.ok(detail.tables.flatMap(t=>t.rows).some(row=>String(row[4]).includes('कैलेंडर आधार')));
  assert.equal(buildSocialAuditReport('vrp_wise',{...input,filters:{query:'सीता'}}).tables[0].rows.length,1);
  for(const report of [summary,detail])for(const table of report.tables)for(const row of table.rows)assert.equal(row.length,table.headers.length);
  assert.equal(JSON.stringify({roster,vrps}),before);
 });
 const React=require('react'), load=Module._load;
 const state={records:roster,vrpMembers:vrps,asOfDate:'2026-11-12',liveDelhiDate:'2026-11-12',selectedBRP:'all',selectedBlock:'all'};
 let states=[],index=0;
 Module._load=function(name,parent,...rest){
  if(name==='react')return {...React,useState:initial=>{const i=index++;if(!(i in states))states[i]=typeof initial==='function'?initial():initial;return[states[i],v=>{states[i]=typeof v==='function'?v(states[i]):v}]},useMemo:run=>run(),useEffect:()=>{}};
  if(name==='@/stores/socialAuditStore')return {useSocialAuditStore:selector=>selector?selector(state):state};
  return load.call(this,name,parent,...rest);
 };
 const Panel=require('../src/components/socialAudit/VrpAuditProgressPanel.tsx').default;
 const find=(node,predicate)=>{if(!node||typeof node!=='object')return;if(predicate(node))return node;for(const child of React.Children.toArray(node.props?.children)){const result=find(child,predicate);if(result)return result}};
 check('Member detail click renders actual GP rows and status filter selects completed meetings',()=>{
  const props={progress,memberId:null,onClearMember:()=>{}};index=0;let tree=Panel(props);
  const name=find(tree,n=>n.type==='button'&&n.props.children?.[0]==='राम');assert.ok(name);name.props.onClick();
  index=0;tree=Panel(props);let selector=find(tree,n=>n.type==='select');assert.ok(selector);selector.props.onChange({target:{value:'completed'}});
  index=0;tree=Panel(props);
  assert.ok(find(tree,n=>n.type==='button'&&n.props.children==='old-a'));
  assert.equal(find(tree,n=>n.type==='button'&&n.props.children==='future'),undefined);
 });
 check('Actual team member card opens the progress tab for that exact employee without editing records',()=>{
  vrps[1].assignedSubTeam='Team A';states=[];index=0;
  const TeamRoster=require('../src/components/socialAudit/TeamRosterTab.tsx').default;
  const tree=TeamRoster();
  const button=find(tree,n=>n.type==='button'&&find(n,child=>child.type==='span'&&child.props.children==='ऑडिट / ग्राम सभा विवरण →'));
  assert.ok(button);button.props.onClick();index=0;
  const next=TeamRoster();const panel=find(next,n=>n.type===Panel);assert.ok(panel);assert.equal(panel.props.memberId,'sita');
  assert.equal(state.records,roster);
 });
 Module._load=load;
 const {createReportDocx,createReportExcel}=require('../src/lib/exportSocialAuditReports.ts');
 const ExcelJS=require('exceljs');
 const workbook=new ExcelJS.Workbook();await workbook.xlsx.load(await createReportExcel(summary));
 check('VRP Excel preserves exact employee strings and matches displayed completed/upcoming counts',()=>{
  summary.tables[0].rows.forEach((row,index)=>{
   assert.equal(workbook.worksheets[0].getCell(index+6,5).value,row[4]);
   assert.equal(workbook.worksheets[0].getCell(index+6,7).value,row[6]);
   assert.equal(workbook.worksheets[0].getCell(index+6,8).value,row[7]);
  });
 });
 const zip=await require('jszip').loadAsync(await createReportDocx(detail));
 const xml=await zip.file('word/document.xml').async('string');
 const footer=await Object.values(zip.files).find(file=>/^word\/footer\d+\.xml$/.test(file.name)).async('string');
 check('Long duty registers repeat member identity and column headers, with page numbers in Word/PDF',()=>{
  assert.equal((xml.match(/<w:tblHeader\b/g)||[]).length,detail.tables.length*2);
  assert.match(footer,/PAGE/);assert.match(footer,/NUMPAGES/);
 });
 if(process.argv.includes('--write-qa')){
  const livePath=path.join(root,'scratch/vrp-live-input.json');
  const data=fs.existsSync(livePath)?JSON.parse(fs.readFileSync(livePath,'utf8')):{records,vrpMembers:members};
  for(const id of ['vrp_wise','vrp_detail']){
   const report=buildSocialAuditReport(id,{...data,nsapRecords:[],asOfDate:'2026-11-07',today:'2026-11-07'});
   fs.writeFileSync(path.join(root,'scratch',id+'.docx'),await createReportDocx(report));
   fs.writeFileSync(path.join(root,'scratch',id+'.xlsx'),await createReportExcel(report));
  }
 }
 console.log(`\n${count} VRP checks passed. No database imports or writes.`);
}
main().catch(error=>{console.error(error);process.exitCode=1});
