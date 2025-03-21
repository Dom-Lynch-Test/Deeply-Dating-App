import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { firestore } from '../config/firebase';

// Collection references
const usersCollection = collection(firestore, 'users');

// Create a new user profile
export const createUserProfile = async (
  userId: string, 
  data: {
    name: string;
    email: string;
    createdAt: Date;
    gender?: string;
    birthdate?: Date;
    bio?: string;
    interests?: string[];
    photos?: string[];
    location?: {
      latitude: number;
      longitude: number;
    };
    lookingFor?: string;
    seriousnessScore?: number;
  }
) => {
  try {
    const userRef = doc(firestore, 'users', userId);
    await setDoc(userRef, {
      ...data,
      createdAt: data.createdAt || new Date(),
      updatedAt: new Date(),
    });
    return userId;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

// Get a user profile by ID
export const getUserProfile = async (userId: string) => {
  try {
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

// Update a user profile
export const updateUserProfile = async (userId: string, data: any) => {
  try {
    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, {
      ...data,
      updatedAt: new Date(),
    });
    return userId;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Get potential matches based on criteria
export const getPotentialMatches = async (
  userId: string, 
  criteria: {
    gender?: string;
    minAge?: number;
    maxAge?: number;
    maxDistance?: number;
    interests?: string[];
  }
) => {
  try {
    // This is a simplified version - in a real app, you would implement
    // more sophisticated filtering, geolocation queries, etc.
    const q = query(
      usersCollection,
      where('gender', '==', criteria.gender || 'any')
    );
    
    const querySnapshot = await getDocs(q);
    const matches: any[] = [];
    
    querySnapshot.forEach((doc) => {
      // Don't include the current user
      if (doc.id !== userId) {
        matches.push({ id: doc.id, ...doc.data() });
      }
    });
    
    return matches;
  } catch (error) {
    console.error('Error getting potential matches:', error);
    throw error;
  }
};
