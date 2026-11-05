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

async function run() {
  const snap = await getDoc(doc(db, "socialAudit", "baghpat-2026-27"));
  const records = snap.data()?.records || [];
  const niwada = records.find((r: any) => r.gpNameUnicode?.includes("निवाड़ा"));
  console.log("Niwada record:", JSON.stringify(niwada, null, 2));

  // Also check all 10 amended records in Firestore
  console.log("\nAll amended records in Firestore:");
  const amended = records.filter((r: any) => r.isAmended);
  for (const r of amended) {
    console.log(`GP: ${r.gpNameUnicode}, meetingDate: ${r.meetingDate}, origDate: ${r.originalMeetingDate}, status: ${r.status}, completedDate: ${r.completedDate}`);
  }
}
run().catch(console.error);
