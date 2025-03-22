import React, { createContext, useContext, useReducer, ReactNode, useCallback } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileSetupStackParamList } from '../navigation/ProfileSetupNavigator';
import { ProfileSetupState, UserProfile, RELATIONSHIP_INTENT, MAX_PROMPT_LENGTH, REQUIRED_PHOTOS_COUNT, INITIAL_PROFILE_SETUP_STATE } from '../types/profile';
import { createUserProfile, updateUserProfile } from '../services/users';
import { useAuth } from './AuthContext';

// Define action types
type ProfileAction =
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'GO_TO_STEP'; payload: number }
  | { type: 'SET_DISPLAY_NAME'; payload: string }
  | { type: 'SET_GENDER'; payload: '' | 'male' | 'female' }
  | { type: 'SET_AGE'; payload: number }
  | { type: 'SET_PREFERRED_AGE_RANGE'; payload: { min: number; max: number } }
  | { type: 'SET_LOCATION'; payload: { coordinates: { latitude: number; longitude: number }; city: string } }
  | { type: 'ADD_PHOTO'; payload: string }
  | { type: 'REMOVE_PHOTO'; payload: string }
  | { type: 'SET_PROMPT_VALUE'; payload: string }
  | { type: 'SET_PROMPT_PARTNER'; payload: string }
  | { type: 'SET_PROMPT_SURPRISING'; payload: string };

// Create the reducer function
const profileReducer = (state: ProfileSetupState, action: ProfileAction): ProfileSetupState => {
  switch (action.type) {
    case 'NEXT_STEP':
      return {
        ...state,
        currentStep: state.currentStep + 1,
      };
    case 'PREV_STEP':
      return {
        ...state,
        currentStep: Math.max(1, state.currentStep - 1),
      };
    case 'GO_TO_STEP':
      return {
        ...state,
        currentStep: action.payload,
      };
    case 'SET_DISPLAY_NAME':
      return {
        ...state,
        displayName: action.payload,
      };
    case 'SET_GENDER':
      return {
        ...state,
        gender: action.payload,
      };
    case 'SET_AGE':
      // Also update preferred age range based on age
      const minAge = Math.max(20, action.payload - 5);
      const maxAge = Math.min(50, action.payload + 5);
      return {
        ...state,
        age: action.payload,
        preferredAgeMin: state.preferredAgeMin || minAge,
        preferredAgeMax: state.preferredAgeMax || maxAge,
      };
    case 'SET_PREFERRED_AGE_RANGE':
      return {
        ...state,
        preferredAgeMin: action.payload.min,
        preferredAgeMax: action.payload.max,
      };
    case 'SET_LOCATION':
      return {
        ...state,
        location: action.payload,
      };
    case 'ADD_PHOTO':
      return {
        ...state,
        photos: [...state.photos, action.payload],
      };
    case 'REMOVE_PHOTO':
      return {
        ...state,
        photos: state.photos.filter(photo => photo !== action.payload),
      };
    case 'SET_PROMPT_VALUE':
      return {
        ...state,
        prompts: {
          ...state.prompts,
          value: action.payload.slice(0, MAX_PROMPT_LENGTH),
        },
      };
    case 'SET_PROMPT_PARTNER':
      return {
        ...state,
        prompts: {
          ...state.prompts,
          partner: action.payload.slice(0, MAX_PROMPT_LENGTH),
        },
      };
    case 'SET_PROMPT_SURPRISING':
      return {
        ...state,
        prompts: {
          ...state.prompts,
          surprising: action.payload.slice(0, MAX_PROMPT_LENGTH),
        },
      };
    default:
      return state;
  }
};

// Create the context
type ProfileContextType = {
  state: ProfileSetupState;
  dispatch: React.Dispatch<ProfileAction>;
  saveProfile: () => Promise<void>;
  isProfileComplete: () => boolean;
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

// Create the provider component
type ProfileProviderProps = {
  children: ReactNode;
};

export const ProfileProvider: React.FC<ProfileProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(profileReducer, INITIAL_PROFILE_SETUP_STATE);
  const { user } = useAuth();
  
  // We'll use a try-catch to handle any navigation errors
  let navigation: NativeStackNavigationProp<ProfileSetupStackParamList> | null = null;
  let routeName: string | undefined = undefined;
  
  try {
    navigation = useNavigation<NativeStackNavigationProp<ProfileSetupStackParamList>>();
    const route = useRoute();
    routeName = route.name;
  } catch (error) {
    console.error('Error accessing navigation or route:', error);
  }

  // Check if the profile is complete
  const isProfileComplete = useCallback(() => {
    const { displayName, gender, age, preferredAgeMin, preferredAgeMax, location, photos, prompts } = state;
    
    // Basic validation
    if (!displayName || !gender || !age || !preferredAgeMin || !preferredAgeMax || !location) {
      return false;
    }
    
    // Check photos
    if (photos.length !== REQUIRED_PHOTOS_COUNT) {
      return false;
    }
    
    // Check prompts
    if (!prompts.value || !prompts.partner || !prompts.surprising) {
      return false;
    }
    
    return true;
  }, [state]);

  // Save profile to Firebase
  const saveProfile = useCallback(async () => {
    if (!user) {
      console.error('No user found when trying to save profile');
      return;
    }
    
    try {
      const profileData: Partial<UserProfile> = {
        displayName: state.displayName,
        gender: state.gender,
        age: state.age,
        preferredAgeRange: {
          min: state.preferredAgeMin,
          max: state.preferredAgeMax,
        },
        location: state.location!,
        relationshipIntent: 'Serious relationship',
        photos: state.photos,
        prompts: state.prompts,
        isProfileComplete: true,
      };
      
      await updateUserProfile(user.uid, profileData);
      console.log('Profile saved successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      // Even if there's an error with Firebase, we'll allow navigation to continue in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('Continuing despite Firebase error in development mode');
        return;
      }
      throw error;
    }
  }, [state, user]);

  // Navigate to the correct screen based on the current step
  React.useEffect(() => {
    if (!navigation) {
      console.warn('Navigation is not available, skipping navigation effect');
      return;
    }
    
    try {
      const getScreenForStep = (step: number) => {
        switch (step) {
          case 1: return 'DisplayName';
          case 2: return 'Gender';
          case 3: return 'Age';
          case 4: return 'PreferredAgeRange';
          case 5: return 'Location';
          case 6: return 'RelationshipIntent';
          case 7: return 'Photos';
          case 8: return 'Prompts';
          case 9: return 'ProfileReview';
          default: return 'DisplayName';
        }
      };
      
      const screenName = getScreenForStep(state.currentStep);
      
      // Only navigate if we're not already on this screen and navigation is available
      if (routeName !== screenName && navigation) {
        navigation.navigate(screenName);
      }
    } catch (error) {
      console.error('Error in navigation effect:', error);
    }
  }, [state.currentStep, navigation, routeName]);

  return (
    <ProfileContext.Provider value={{ state, dispatch, saveProfile, isProfileComplete }}>
      {children}
    </ProfileContext.Provider>
  );
};

// Create a hook to use the profile context
export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};
