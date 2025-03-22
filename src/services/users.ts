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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Flag to determine if we should use local storage fallback
let useLocalStorageFallback = false;

// Collection references
const usersCollection = collection(firestore, 'users');

// Local storage keys
const USER_PROFILE_KEY_PREFIX = 'deeply_user_profile_';

// Test Firebase connection
const testFirestoreConnection = async (): Promise<boolean> => {
  try {
    // Try to access a test document
    const testRef = doc(firestore, 'connection_test', 'test');
    await getDoc(testRef);
    console.log('[DEBUG] Firestore connection test successful');
    useLocalStorageFallback = false;
    return true;
  } catch (error) {
    console.error('[ERROR] Firestore connection test failed:', error);
    useLocalStorageFallback = true;
    return false;
  }
};

// Save profile to local storage
const saveProfileToLocalStorage = async (userId: string, data: any): Promise<void> => {
  try {
    const storageKey = `${USER_PROFILE_KEY_PREFIX}${userId}`;
    const profileData = {
      ...data,
      id: userId,
      updatedAt: new Date().toISOString(),
    };
    
    await AsyncStorage.setItem(storageKey, JSON.stringify(profileData));
    console.log('[DEBUG] Profile saved to local storage successfully');
  } catch (error) {
    console.error('[ERROR] Error saving profile to local storage:', error);
    throw error;
  }
};

// Get profile from local storage
const getProfileFromLocalStorage = async (userId: string): Promise<UserProfile | null> => {
  try {
    const storageKey = `${USER_PROFILE_KEY_PREFIX}${userId}`;
    const profileData = await AsyncStorage.getItem(storageKey);
    
    if (profileData) {
      return JSON.parse(profileData) as UserProfile;
    }
    
    return null;
  } catch (error) {
    console.error('[ERROR] Error getting profile from local storage:', error);
    return null;
  }
};

// Create a new user profile
export const createUserProfile = async (
  userId: string, 
  data: Partial<UserProfile>
) => {
  try {
    // First try Firebase
    try {
      if (!useLocalStorageFallback) {
        await testFirestoreConnection();
      }
      
      if (!useLocalStorageFallback) {
        const userRef = doc(firestore, 'users', userId);
        await setDoc(userRef, {
          ...data,
          id: userId,
          createdAt: data.createdAt || new Date(),
          updatedAt: new Date(),
          isProfileComplete: false,
          displayNameChangedOnce: false
        });
        console.log('[DEBUG] User profile created in Firebase successfully');
        return userId;
      }
    } catch (error) {
      console.error('[ERROR] Error creating user profile in Firebase:', error);
      useLocalStorageFallback = true;
    }
    
    // Fallback to local storage
    if (useLocalStorageFallback) {
      await saveProfileToLocalStorage(userId, {
        ...data,
        createdAt: data.createdAt || new Date().toISOString(),
        isProfileComplete: false,
        displayNameChangedOnce: false
      });
      return userId;
    }
    
    throw new Error('Failed to create user profile');
  } catch (error) {
    console.error('[ERROR] Error creating user profile:', error);
    throw error;
  }
};

// Get a user profile by ID
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    // First try Firebase
    try {
      if (!useLocalStorageFallback) {
        await testFirestoreConnection();
      }
      
      if (!useLocalStorageFallback) {
        const userRef = doc(firestore, 'users', userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          return { id: userId, ...userSnap.data() } as UserProfile;
        }
      }
    } catch (error) {
      console.error('[ERROR] Error getting user profile from Firebase:', error);
      useLocalStorageFallback = true;
    }
    
    // Fallback to local storage
    if (useLocalStorageFallback) {
      return await getProfileFromLocalStorage(userId);
    }
    
    return null;
  } catch (error) {
    console.error('[ERROR] Error getting user profile:', error);
    throw error;
  }
};

// Update a user profile
export const updateUserProfile = async (userId: string, data: Partial<UserProfile>) => {
  try {
    // First try Firebase
    try {
      if (!useLocalStorageFallback) {
        await testFirestoreConnection();
      }
      
      if (!useLocalStorageFallback) {
        const userRef = doc(firestore, 'users', userId);
        await updateDoc(userRef, {
          ...data,
          updatedAt: new Date()
        });
        console.log('[DEBUG] User profile updated in Firebase successfully');
        return userId;
      }
    } catch (error) {
      console.error('[ERROR] Error updating user profile in Firebase:', error);
      useLocalStorageFallback = true;
    }
    
    // Fallback to local storage
    if (useLocalStorageFallback) {
      // Get existing profile first
      const existingProfile = await getProfileFromLocalStorage(userId);
      
      // Merge with new data
      const mergedData = {
        ...existingProfile,
        ...data,
      };
      
      await saveProfileToLocalStorage(userId, mergedData);
      console.log('[DEBUG] User profile updated in local storage successfully');
      return userId;
    }
    
    throw new Error('Failed to update user profile');
  } catch (error) {
    console.error('[ERROR] Error updating user profile:', error);
    throw error;
  }
};

// Complete a user profile
export const completeUserProfile = async (userId: string): Promise<void> => {
  try {
    // First try Firebase
    try {
      if (!useLocalStorageFallback) {
        await testFirestoreConnection();
      }
      
      if (!useLocalStorageFallback) {
        const userRef = doc(firestore, 'users', userId);
        await updateDoc(userRef, {
          isProfileComplete: true,
          updatedAt: new Date()
        });
        console.log('[DEBUG] User profile marked as complete in Firebase');
        return;
      }
    } catch (error) {
      console.error('[ERROR] Error completing user profile in Firebase:', error);
      useLocalStorageFallback = true;
    }
    
    // Fallback to local storage
    if (useLocalStorageFallback) {
      const profile = await getProfileFromLocalStorage(userId);
      if (profile) {
        await saveProfileToLocalStorage(userId, {
          ...profile,
          isProfileComplete: true,
          updatedAt: new Date().toISOString()
        });
        console.log('[DEBUG] User profile marked as complete in local storage');
        return;
      } else {
        throw new Error('Profile not found in local storage');
      }
    }
    
    throw new Error('Failed to complete user profile');
  } catch (error) {
    console.error('[ERROR] Error completing user profile:', error);
    throw error;
  }
};

// Check if user profile is complete
export const isProfileComplete = async (userId: string): Promise<boolean> => {
  try {
    const profile = await getUserProfile(userId);
    return profile?.isProfileComplete || false;
  } catch (error) {
    console.error('[ERROR] Error checking profile completion:', error);
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
    // First try Firebase
    try {
      if (!useLocalStorageFallback) {
        await testFirestoreConnection();
      }
      
      if (!useLocalStorageFallback) {
        // Start with a query for opposite gender
        let matchQuery = query(
          usersCollection,
          where('gender', '==', criteria.gender === 'male' ? 'female' : 'male'),
          where('isProfileComplete', '==', true)
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
            matches.push({ ...userData, id: doc.id } as UserProfile);
          }
        });
        
        return matches;
      }
    } catch (error) {
      console.error('[ERROR] Error getting potential matches from Firebase:', error);
      useLocalStorageFallback = true;
    }
    
    // Fallback to local storage
    if (useLocalStorageFallback) {
      // Get all profiles from local storage
      const allProfiles: UserProfile[] = [];
      
      const keys = await AsyncStorage.getAllKeys();
      for (const key of keys) {
        if (key.startsWith(USER_PROFILE_KEY_PREFIX)) {
          const profileData = await AsyncStorage.getItem(key);
          if (profileData) {
            allProfiles.push(JSON.parse(profileData) as UserProfile);
          }
        }
      }
      
      // Filter profiles based on criteria
      const matches: UserProfile[] = [];
      for (const profile of allProfiles) {
        if (profile.gender === (criteria.gender === 'male' ? 'female' : 'male') &&
            profile.isProfileComplete &&
            profile.id !== userId) {
          // Filter by age if criteria provided
          const ageMatches = !criteria.minAge || !criteria.maxAge || 
            (profile.age >= criteria.minAge && profile.age <= criteria.maxAge);
          
          if (ageMatches) {
            matches.push(profile);
          }
        }
      }
      
      return matches;
    }
    
    throw new Error('Failed to get potential matches');
  } catch (error) {
    console.error('[ERROR] Error getting potential matches:', error);
    throw error;
  }
};
