import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCUV_Zd-qZqcom3S1vMB2NpwDTzhRr9_Fs",
  authDomain: "personal-messenger-9e2c0.firebaseapp.com",
  projectId: "personal-messenger-9e2c0",
  storageBucket: "personal-messenger-9e2c0.firebasestorage.app",
  messagingSenderId: "329199745944",
  appId: "1:329199745944:web:d44c224770c9be7ae789ed",
  measurementId: "G-XE7F0HMZQJ"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
const analytics = getAnalytics(app);
