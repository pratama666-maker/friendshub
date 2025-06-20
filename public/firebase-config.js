// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, limit, arrayUnion, arrayRemove, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCIDtHVWRQiB-tmOWSK4mnexR_J2SAq790",
  authDomain: "funhub-3f848.firebaseapp.com",
  databaseURL: "https://funhub-3f848-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "funhub-3f848",
  storageBucket: "funhub-3f848.firebasestorage.app",
  messagingSenderId: "922163960068",
  appId: "1:922163960068:web:ab2fd526a8ac67fe095851",
  measurementId: "G-83LMJ1RV1V"
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
  onAuthStateChanged, // Added for convenience in other modules
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
  serverTimestamp, // Added for timestamps
  storage,
  ref,
  uploadBytes,
  getDownloadURL
};
