import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useProfile } from '../context/ProfileContext';

// Import all profile setup screens
import DisplayNameScreen from '../screens/profile-setup/DisplayNameScreen';
import GenderScreen from '../screens/profile-setup/GenderScreen';
import AgeScreen from '../screens/profile-setup/AgeScreen';
import PreferredAgeRangeScreen from '../screens/profile-setup/PreferredAgeRangeScreen';
import LocationScreen from '../screens/profile-setup/LocationScreen';
import RelationshipIntentScreen from '../screens/profile-setup/RelationshipIntentScreen';
import PhotosScreen from '../screens/profile-setup/PhotosScreen';
import PromptsScreen from '../screens/profile-setup/PromptsScreen';
import ProfileReviewScreen from '../screens/profile-setup/ProfileReviewScreen';

// Define the stack navigator param list
export type ProfileSetupStackParamList = {
  DisplayName: undefined;
  Gender: undefined;
  Age: undefined;
  PreferredAgeRange: undefined;
  Location: undefined;
  RelationshipIntent: undefined;
  Photos: undefined;
  Prompts: undefined;
  ProfileReview: undefined;
};

const Stack = createNativeStackNavigator<ProfileSetupStackParamList>();

const ProfileSetupNavigator: React.FC = () => {
  const { state } = useProfile();
  
  // Map step number to screen name
  const getScreenForStep = (step: number): keyof ProfileSetupStackParamList => {
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
  
  // Get the initial route name based on the current step
  const initialRouteName = getScreenForStep(state.currentStep);
  
  return (
    <Stack.Navigator 
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: false, // Disable swipe back
      }}
    >
      <Stack.Screen name="DisplayName" component={DisplayNameScreen} />
      <Stack.Screen name="Gender" component={GenderScreen} />
      <Stack.Screen name="Age" component={AgeScreen} />
      <Stack.Screen name="PreferredAgeRange" component={PreferredAgeRangeScreen} />
      <Stack.Screen name="Location" component={LocationScreen} />
      <Stack.Screen name="RelationshipIntent" component={RelationshipIntentScreen} />
      <Stack.Screen name="Photos" component={PhotosScreen} />
      <Stack.Screen name="Prompts" component={PromptsScreen} />
      <Stack.Screen name="ProfileReview" component={ProfileReviewScreen} />
    </Stack.Navigator>
  );
};

export default ProfileSetupNavigator;
