import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
    apiKey: "AIzaSyBUTqMQPaWvSEYq-kVR198Zgvp_ZZUX3So",
    authDomain: "superapp-37db4.firebaseapp.com",
    projectId: "superapp-37db4",
    storageBucket: "superapp-37db4.appspot.com",
    messagingSenderId: "488411585201",
    appId: "1:488411585201:web:51a3138f763f1842156090",
    measurementId: "G-SJY3Z4VDPE"
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);

// Firestore ve Auth servislerini başlat
const db = getFirestore(app);
const auth = getAuth(app);

// Analytics'i başlat (sadece tarayıcıda)
let analytics = null;
if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
}

export { app, db, auth, analytics }; 