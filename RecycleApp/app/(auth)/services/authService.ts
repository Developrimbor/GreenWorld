import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,  // Bu import yeterli
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../../config/firebase';

export const signUp = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error: any) {
    throw error;
  }
};

export const createUserProfile = async (userId: string, userData: {
  name: string;
  username: string;
  email: string;
}) => {
  try {
    await setDoc(doc(db, 'users', userId), {
      ...userData,
      createdAt: serverTimestamp(),
      points: 0,
      reported: 0,
      cleaned: 0,
      posts: 0
    });
  } catch (error: any) {
    throw error;
  }
};

// Aşağıdaki tekrar eden importları kaldırıyoruz
// import { signInWithEmailAndPassword } from 'firebase/auth';
// import { auth } from '../../config/firebase';

export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    throw error;
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

export const onAuthStateChanged = (callback: (user: any) => void) => {
  return firebaseAuthStateChanged(auth, callback);
};

const AuthService = {
  signUp,
  createUserProfile,
  signIn,
  signOut,
  getCurrentUser,
  onAuthStateChanged
};

export default AuthService;