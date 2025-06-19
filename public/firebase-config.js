// firebase-config.js (Contoh)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, getDoc, doc, setDoc, where, getDocs } from "https://www.www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getDatabase, ref, push, onValue, ServerValue } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, uploadBytesResumable } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, updateProfile, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js"; // Import Auth modules

const firebaseConfig = {
  apiKey: "AIzaSyDgJ...",
  authDomain: "funhub-app.firebaseapp.com",
  projectId: "funhub-app",
  storageBucket: "funhub-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const rtdb = getDatabase(app);
const storage = getStorage(app);
const auth = getAuth(app); // Inisialisasi Auth

// Expose Firebase objects globally for script.js
window.firebase = {
    app: app,
    firestore: { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, getDoc, doc, setDoc, where, getDocs, FieldValue: { serverTimestamp } },
    database: { ref, push, onValue, ServerValue },
    storage: { ref: storageRef, uploadBytes, getDownloadURL, uploadBytesResumable }, // Sertakan uploadBytesResumable
    auth: { onAuthStateChanged, signInWithEmailAndPassword, signOut, updateProfile, EmailAuthProvider, reauthenticateWithCredential, updatePassword } // Sertakan Auth methods
};
window.db = db;
window.rtdb = rtdb;
window.firestore = window.firebase.firestore;
window.realtimeDb = window.firebase.database;
window.storage = storage;
window.auth = auth; // Expose auth instance
