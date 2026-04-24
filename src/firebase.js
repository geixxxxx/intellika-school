import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDpcrRNyY41eVJXLfCKJv-sT5FNPnuEEwY",
  authDomain: "intellika-school.firebaseapp.com",
  projectId: "intellika-school",
  storageBucket: "intellika-school.firebasestorage.app",
  messagingSenderId: "418791539814",
  appId: "1:418791539814:web:9112a3122451e5d6c799a7"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);