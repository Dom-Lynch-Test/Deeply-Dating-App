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
import { UserProfile } from '../types/profile';

// Collection references
const usersCollection = collection(firestore, 'users');

// Create a new user profile
export const createUserProfile = async (
  userId: string, 
  data: Partial<UserProfile>
) => {
  try {
    const userRef = doc(firestore, 'users', userId);
    await setDoc(userRef, {
      ...data,
      id: userId,
      createdAt: data.createdAt || new Date(),
      updatedAt: new Date(),
      profileComplete: false,
      displayNameChangedOnce: false
    });
    return userId;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

// Get a user profile by ID
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return { id: userId, ...userSnap.data() } as UserProfile;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

// Update a user profile
export const updateUserProfile = async (userId: string, data: Partial<UserProfile>) => {
  try {
    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, {
      ...data,
      updatedAt: new Date()
    });
    return userId;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Complete user profile setup
export const completeUserProfile = async (userId: string, profileData: Partial<UserProfile>) => {
  try {
    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, {
      ...profileData,
      profileComplete: true,
      updatedAt: new Date()
    });
    return userId;
  } catch (error) {
    console.error('Error completing user profile:', error);
    throw error;
  }
};

// Check if user profile is complete
export const isProfileComplete = async (userId: string): Promise<boolean> => {
  try {
    const profile = await getUserProfile(userId);
    return profile?.profileComplete || false;
  } catch (error) {
    console.error('Error checking profile completion:', error);
    return false;
  }
};

// Get potential matches based on criteria
export const getPotentialMatches = async (
  userId: string, 
  criteria: {
    gender?: 'male' | 'female';
    minAge?: number;
    maxAge?: number;
    maxDistance?: number;
  }
) => {
  try {
    // Start with a query for opposite gender
    let matchQuery = query(
      usersCollection,
      where('gender', '==', criteria.gender === 'male' ? 'female' : 'male'),
      where('profileComplete', '==', true)
    );
    
    const matchesSnap = await getDocs(matchQuery);
    const matches: UserProfile[] = [];
    
    matchesSnap.forEach((doc) => {
      const userData = doc.data() as UserProfile;
      
      // Filter by age if criteria provided
      const userAge = userData.age;
      const ageMatches = !criteria.minAge || !criteria.maxAge || 
        (userAge >= criteria.minAge && userAge <= criteria.maxAge);
      
      // Add to matches if all criteria match
      if (ageMatches && doc.id !== userId) {
        matches.push({ id: doc.id, ...userData } as UserProfile);
      }
    });
    
    return matches;
  } catch (error) {
    console.error('Error getting potential matches:', error);
    throw error;
  }
};
