import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBUTqMQPaWvSEYq-kVR198Zgvp_ZZUX3So",
  authDomain: "superapp-37db4.firebaseapp.com",
  projectId: "superapp-37db4",
  storageBucket: "superapp-37db4.appspot.com",
  messagingSenderId: "488411585201",
  appId: "1:488411585201:web:51a3138f763f1842156090",
  measurementId: "G-SJY3Z4VDPE"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, "us-central1");
export const analytics = (() => {
  try {
    if (typeof window === 'undefined') return null;
    if (!firebaseConfig.measurementId) return null;
    return getAnalytics(app);
  } catch {
    return null;
  }
})();

export const storage = getStorage(app);
export default app;
