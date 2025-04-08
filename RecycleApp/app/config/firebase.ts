import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAWMbaAjQZd5JOjKpmSYhdeBROsS6v4X4w",
  projectId: "greenworld-f1d4f",
  storageBucket: "greenworld-f1d4f.appspot.com",
  messagingSenderId: "742768033381",
  appId: "1:742768033381:android:8d9610f957167cdf9b508c",
  authDomain: "greenworld-f1d4f.firebaseapp.com"
};

// Uygulama zaten başlatılmışsa onu kullan, yoksa yeni başlat
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// export { auth, db };
export default { app, auth, db };