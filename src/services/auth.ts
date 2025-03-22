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
import { UserProfile } from '../types/profile';

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
      displayName: name,
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
    // Set a timeout to prevent hanging on network issues
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Login timeout - network may be unavailable')), 10000);
    });
    
    // Race the signin against the timeout
    const userCredential = await Promise.race([
      signInWithEmailAndPassword(auth, email, password),
      timeoutPromise
    ]) as UserCredential;
    
    return userCredential.user;
  } catch (error: any) {
    console.error('Error signing in:', error);
    
    // Provide more user-friendly error messages
    if (error.code === 'auth/network-request-failed' || error.message.includes('timeout')) {
      throw new Error('Network connection issue. Please check your internet connection and try again.');
    } else if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
      throw new Error('Invalid email or password. Please try again.');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many failed login attempts. Please try again later or reset your password.');
    } else {
      throw error;
    }
  }
};

// Sign in with Google
export const signInWithGoogle = async (idToken: string) => {
  try {
    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);
    const user = userCredential.user;
    
    // Check if this is a new user (first time sign in)
    // Note: Firebase v9 typings don't include additionalUserInfo, but it's still available
    const isNewUser = (userCredential as any).additionalUserInfo?.isNewUser;
    
    if (isNewUser) {
      // Create a user profile in Firestore
      await createUserProfile(user.uid, {
        displayName: user.displayName || 'Google User',
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
