import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCcoEHjZ_WML0CALfbvoxRY1Qr9udcAMJI",
  authDomain: "deeply-90de9.firebaseapp.com",
  projectId: "deeply-90de9",
  storageBucket: "deeply-90de9.firebasestorage.app",
  messagingSenderId: "604287607462",
  appId: "1:604287607462:web:b5fc2d308c177cfc4c4a67",
  measurementId: "G-PP6S66EVQP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

// Initialize Analytics (only in web environments)
let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { auth, firestore, storage, analytics };
