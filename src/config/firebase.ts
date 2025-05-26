import { initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
    apiKey: "AIzaSyBUTqMQPaWvSEYq-kVR198Zgvp_ZZUX3So",
    authDomain: "superapp-37db4.firebaseapp.com",
    projectId: "superapp-37db4",
    storageBucket: "superapp-37db4.appspot.com",
    messagingSenderId: "488411585201",
    appId: "1:488411585201:web:51a3138f763f1842156090",
    measurementId: "G-SJY3Z4VDPE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
let analytics = null;
let db = null;
let auth = null;

if (typeof window !== 'undefined') {
    try {
        // Initialize Firestore with persistent cache
        db = getFirestore(app);
        
        // Initialize analytics only if supported
        isSupported().then(yes => {
            if (yes) {
                analytics = getAnalytics(app);
            }
        });

        // Initialize Auth
        auth = getAuth(app);
    } catch (error) {
        console.error('Error initializing Firebase services:', error);
    }
}

export { app, analytics, db, auth };
