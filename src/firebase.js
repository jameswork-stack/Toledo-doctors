import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBYPq14JJub42T8JigNwVabxvv6MKTxm_8",
  authDomain: "toledo-doctors.firebaseapp.com",
  projectId: "toledo-doctors",
  storageBucket: "toledo-doctors.firebasestorage.app",
  messagingSenderId: "17652214810",
  appId: "1:17652214810:web:d192823453693a48a8b5a3",
  measurementId: "G-4C0W7XCVX3"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const db = getFirestore(app);
