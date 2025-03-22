export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  gender: 'male' | 'female' | '';
  age: number;
  preferredAgeRange: {
    min: number;
    max: number;
  };
  location: {
    city: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  relationshipIntent: 'Serious relationship';
  photos: string[];
  prompts: {
    value: string;
    partner: string;
    surprising: string;
  };
  isProfileComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
  displayNameChangedOnce: boolean;
}

// Constants for profile setup
export const RELATIONSHIP_INTENT = 'Serious relationship';
export const MAX_PROMPT_LENGTH = 150;
export const REQUIRED_PHOTOS_COUNT = 3;
export const MIN_AGE = 20;
export const MAX_AGE = 50;
export const MAX_AGE_RANGE = 10;

export interface ProfileSetupState {
  currentStep: number;
  displayName: string;
  gender: 'male' | 'female' | '';
  age: number;
  preferredAgeMin: number;
  preferredAgeMax: number;
  location: {
    city: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  } | null;
  relationshipIntent: string;
  photos: string[];
  prompts: {
    value: string;
    partner: string;
    surprising: string;
  };
  isSubmitting?: boolean;
  error?: string | null;
}

// Initial state for profile setup
export const INITIAL_PROFILE_SETUP_STATE: ProfileSetupState = {
  currentStep: 1,
  displayName: '',
  gender: '',
  age: 25,
  preferredAgeMin: 20,
  preferredAgeMax: 30,
  location: null,
  relationshipIntent: RELATIONSHIP_INTENT,
  photos: [],
  prompts: {
    value: '',
    partner: '',
    surprising: '',
  },
  isSubmitting: false,
  error: null,
};
