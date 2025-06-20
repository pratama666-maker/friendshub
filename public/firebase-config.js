// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, limit, arrayUnion, arrayRemove, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import {createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// Konfigurasi Firebase dari whatfun-baec7
const firebaseConfig = {
  apiKey: "AIzaSyBqZEjFY_RBUpME9r4j0-mASlJWIsJTdpE",
  authDomain: "whatfun-baec7.firebaseapp.com",
  projectId: "whatfun-baec7",
  storageBucket: "whatfun-baec7.appspot.com", // perbaiki dari .firebasestorage.app
  messagingSenderId: "320401713540",
  appId: "1:320401713540:web:ab7a70aa17e2ae2fc6d5d1",
  measurementId: "G-L1TSBSW1ME"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Export them for use in other files
export {
  app,
  auth,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword, // ← ini penting!
  db,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  storage,
  ref,
  uploadBytes,
  getDownloadURL
};
