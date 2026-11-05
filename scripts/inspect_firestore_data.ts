import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAmZtCZh6VA_74I-lAaeh_IJhHWdv7_tMU",
  authDomain: "drda-75527.firebaseapp.com",
  projectId: "drda-75527",
  storageBucket: "drda-75527.firebasestorage.app",
  messagingSenderId: "137033606947",
  appId: "1:137033606947:web:70a03c5028082970298e96",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function inspectFirestore() {
  console.log("Fetching doc 'baghpat-2026-27' from firestore...");
  const snap = await getDoc(doc(db, "socialAudit", "baghpat-2026-27"));
  if (!snap.exists()) {
    console.log("Document does not exist in Firestore!");
    return;
  }
  const data = snap.data();
  console.log(`Document found! Version: ${data.version}, Updated at: ${data.updatedAt}`);
  const records = data.records || [];
  console.log(`Total records: ${records.length}`);
  
  // Check how many have status === 'completed'
  const completedStatus = records.filter((r: any) => r.status === 'completed');
  console.log(`Records with status === 'completed': ${completedStatus.length}`);
  
  // Check amended records
  const amended = records.filter((r: any) => r.isAmended);
  console.log(`Records with isAmended === true: ${amended.length}`);

  // Now let's test for asOfDate = '2026-10-08' and '2026-10-31'
  for (const date of ['2026-10-08', '2026-10-31']) {
    console.log(`\n--- TESTING FOR asOfDate = ${date} on FIRESTORE DATA ---`);
    
    // OLD/PREVIOUS calculation in ExecutiveDashboardTab.tsx:
    // completedRecords: r.meetingDate <= asOfDate || r.status === 'completed'
    const oldCompleted = records.filter((r: any) => r.meetingDate <= date || r.status === 'completed');
    console.log(`OLD calculation completed count: ${oldCompleted.length}`);
    
    // Original proposed:
    const origProposed = records.filter((r: any) => {
      const origDate = (r.isAmended && (r.originalMeetingDate || r.amendmentDetails?.originalDate))
        ? (r.originalMeetingDate || r.amendmentDetails?.originalDate)!
        : r.meetingDate;
      return origDate <= date;
    });
    console.log(`Original proposed count: ${origProposed.length}`);
    
    // Old amended completed:
    const oldAmendedComp = amended.filter((r: any) => r.meetingDate <= date || r.status === 'completed');
    console.log(`OLD amended completed count: ${oldAmendedComp.length}`);

    // Let's check which records have status === 'completed' and their meetingDate
    console.log(`Details of completed records that have meetingDate > ${date}:`);
    const futureCompleted = records.filter((r: any) => r.status === 'completed' && r.meetingDate > date);
    for (const r of futureCompleted) {
      console.log(`  - GP: ${r.gpNameUnicode}, meetingDate: ${r.meetingDate}, isAmended: ${r.isAmended}, origDate: ${r.originalMeetingDate}`);
    }
  }
}

inspectFirestore().catch(console.error);
