import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, setDoc, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAxQliXm59BRg9zsVpK5qthB0nowqU0GEg",
  authDomain: "lancamentomanual-6cac4.firebaseapp.com",
  projectId: "lancamentomanual-6cac4",
  storageBucket: "lancamentomanual-6cac4.firebasestorage.app",
  messagingSenderId: "710102934933",
  appId: "1:710102934933:web:a5dc954d01d40518a5c29c",
  measurementId: "G-MLLXPXR7EC"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, setDoc, doc, getDoc, updateDoc };
