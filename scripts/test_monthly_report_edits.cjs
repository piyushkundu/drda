/* eslint-disable @typescript-eslint/no-require-imports -- Isolated TS harness; all Firebase writes are mocked. */
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict'),ts=require('typescript');
const root=path.resolve(__dirname,'..'),resolve=Module._resolveFilename,load=Module._load;
Module._resolveFilename=function(name,parent,...rest){return resolve.call(this,name.startsWith('@/')?path.join(root,'src',name.slice(2)):name,parent,...rest)};
require.extensions['.ts']=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,file);
const memory=new Map();
global.localStorage={getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,value),removeItem:key=>memory.delete(key)};
let allowed=true,cloud=[];
global.window={confirm:()=>allowed,navigator:{userAgent:'isolated-report-test'}};
global.alert=()=>{};
Module._load=function(name,parent,...rest){
 if(name==='@/lib/socialAuditFirebase')return {saveSocialAuditToFirestore:async(...args)=>{cloud.push(args);return true},loadSocialAuditFromFirestore:async()=>null,subscribeToSocialAuditFirestore:()=>null};
 return load.call(this,name,parent,...rest);
};
const {useSocialAuditStore:store}=require('../src/stores/socialAuditStore.ts');
const draft={values:{pmay_houses:4,pmay_sc:0,nsap_family:null},completeThrough:{pmay:'2026-10-31'},updatedAt:'ignored'};
let checks=0;const check=(name,run)=>{run();checks++;console.log('PASS '+name)};
store.setState({asOfDate:'2026-11-07',monthlyReportDrafts:{},isEditMode:false});
const original=JSON.stringify({records:store.getState().records,nsapRecords:store.getState().nsapRecords});
check('Read-only mode rejects report edits without storage, log or cloud changes',()=>{
 assert.equal(store.getState().saveMonthlyReportDraft('2026-11',draft),false);assert.equal(cloud.length,0);assert.deepEqual(store.getState().monthlyReportDrafts,{});
});
store.setState({isEditMode:true});
check('Bad counts and future completeness dates are rejected before any write',()=>{
 assert.equal(store.getState().saveMonthlyReportDraft('2026-11',{...draft,values:{pmay_houses:-1}}),false);
 assert.equal(store.getState().saveMonthlyReportDraft('2026-11',{...draft,values:{mgnrega_financial:1.123}}),false);
 assert.equal(store.getState().saveMonthlyReportDraft('2026-11',{...draft,completeThrough:{pmay:'2026-11-30'}}),false);
 assert.equal(cloud.length,0);
});
allowed=false;
check('Cancelling an old report-month warning leaves drafts and audit log untouched',()=>{
 const logs=JSON.stringify(store.getState().activityLogs);
 assert.equal(store.getState().saveMonthlyReportDraft('2026-10',draft),false);
 assert.equal(cloud.length,0);assert.deepEqual(store.getState().monthlyReportDrafts,{});assert.equal(JSON.stringify(store.getState().activityLogs),logs);
});
allowed=true;
check('Confirmed edits persist by month with zero and deliberate blank; GP source data is untouched',()=>{
 assert.equal(store.getState().saveMonthlyReportDraft('2026-10',draft),true);
 assert.equal(store.getState().monthlyReportDrafts['2026-10'].values.pmay_sc,0);
 assert.equal(store.getState().monthlyReportDrafts['2026-10'].values.nsap_family,null);
 assert.equal(store.getState().monthlyReportDrafts['2026-11'],undefined);
 assert.equal(cloud.at(-1)[7]['2026-10'].values.pmay_houses,4);
 assert.ok(JSON.parse(memory.get('social-audit-baghpat-storage')).state.monthlyReportDrafts['2026-10']);
 assert.equal(JSON.stringify({records:store.getState().records,nsapRecords:store.getState().nsapRecords}),original);
});
check('Reset clears only that month and sends an explicit empty override to cloud',()=>{
 assert.equal(store.getState().saveMonthlyReportDraft('2026-11',{...draft,values:{pmay_houses:5}}),true);
 assert.equal(store.getState().resetMonthlyReportDraft('2026-10'),true);
 assert.deepEqual(store.getState().monthlyReportDrafts['2026-10'].values,{});
 assert.equal(store.getState().monthlyReportDrafts['2026-11'].values.pmay_houses,5);
 assert.deepEqual(cloud.at(-1)[7]['2026-10'].values,{});
 assert.equal(JSON.stringify({records:store.getState().records,nsapRecords:store.getState().nsapRecords}),original);
});
// Verify the real serialization helper with a fake Firestore transport.
let payload,options;
Module._load=function(name,parent,...rest){
 if(name==='./firebase'&&parent.filename.endsWith('socialAuditFirebase.ts'))return {db:{}};
 if(name==='firebase/firestore')return {doc:()=>({}),setDoc:async(_ref,data,opts)=>{payload=data;options=opts}};
 return load.call(this,name,parent,...rest);
};
async function verify(){
 const api=require('../src/lib/socialAuditFirebase.ts');
 await api.saveSocialAuditToFirestore([],[],'2026-11-07',true,true,[],[],store.getState().monthlyReportDrafts);
 check('Firestore replaces complete top-level draft map, preserving zero/null and clearing removed fields',()=>{
   assert.deepEqual(payload.monthlyReportDrafts['2026-10'].values,{});
   assert.ok(options.mergeFields.includes('monthlyReportDrafts'));
   assert.equal(payload.monthlyReportDrafts['2026-11'].values.pmay_houses,5);
 });
 console.log(`\n${checks} monthly edit checks passed. All remote writes mocked.`);
}
verify().catch(error=>{console.error(error);process.exitCode=1});
