import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAWMbaAjQZd5JOjKpmSYhdeBROsS6v4X4w",
  projectId: "greenworld-f1d4f",
  storageBucket: "greenworld-f1d4f.firebasestorage.app",
  messagingSenderId: "742768033381",
  appId: "1:742768033381:android:8d9610f957167cdf9b508c",
  authDomain: "greenworld-f1d4f.firebaseapp.com"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };