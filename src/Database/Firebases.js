import { initializeApp } from "firebase/app";
import { getFirestore } from "@firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDfm96VCO4RxiofYM9QHyQ_vfBnxtXtm28",
  authDomain: "offline-app-732aa.firebaseapp.com",
  projectId: "offline-app-732aa",
  storageBucket: "offline-app-732aa.appspot.com",
  messagingSenderId: "102548286030",
  appId: "1:102548286030:web:8ada7e22d81d262354311f",
  measurementId: "G-3N5TLNJDL3",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
