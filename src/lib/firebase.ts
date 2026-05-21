import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAmZtCZh6VA_74I-lAaeh_IJhHWdv7_tMU",
  authDomain: "drda-75527.firebaseapp.com",
  projectId: "drda-75527",
  storageBucket: "drda-75527.firebasestorage.app",
  messagingSenderId: "137033606947",
  appId: "1:137033606947:web:70a03c5028082970298e96",
  measurementId: "G-LEPB7HMXQP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
