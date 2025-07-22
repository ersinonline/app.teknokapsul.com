import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
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
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics as null first
let analytics = null;

// Initialize analytics without top-level await
const initAnalytics = () => {
  isSupported().then(supported => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(error => {
    console.warn('Analytics not supported in this environment:', error);
  });
};

// Initialize analytics
initAnalytics();

export { analytics };