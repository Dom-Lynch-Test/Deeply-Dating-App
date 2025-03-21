import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithCredential,
  UserCredential
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { createUserProfile } from './users';

// Sign up with email and password
export const signUp = async (name: string, email: string, password: string) => {
  try {
    // Create the user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update the user's display name
    await updateProfile(user, {
      displayName: name
    });
    
    // Create a user profile in Firestore
    await createUserProfile(user.uid, {
      name,
      email,
      createdAt: new Date()
    });
    
    return user;
  } catch (error: any) {
    console.error('Error signing up:', error);
    throw error;
  }
};

// Sign in with email and password
export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    console.error('Error signing in:', error);
    throw error;
  }
};

// Sign in with Google
export const signInWithGoogle = async (idToken: string) => {
  try {
    // Create a Google credential with the token
    const googleCredential = GoogleAuthProvider.credential(idToken);
    
    // Sign in with credential
    const userCredential = await signInWithCredential(auth, googleCredential);
    const user = userCredential.user;
    
    // Check if this is a new user (first time sign in)
    // Note: Firebase v9 typings don't include additionalUserInfo, but it's still available
    const isNewUser = (userCredential as any).additionalUserInfo?.isNewUser;
    
    if (isNewUser) {
      // Create a user profile in Firestore
      await createUserProfile(user.uid, {
        name: user.displayName || 'Google User',
        email: user.email || '',
        createdAt: new Date(),
        // Add user photo URL to the photos array
        photos: user.photoURL ? [user.photoURL] : undefined
      });
    }
    
    return user;
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

// Sign out
export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Reset password
export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error('Error resetting password:', error);
    throw error;
  }
};
