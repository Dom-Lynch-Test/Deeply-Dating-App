import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';

// Import screens
import WelcomeScreen from '../screens/WelcomeScreen';
import MatchScreen from '../screens/MatchScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';

// Import navigators
import ProfileSetupNavigator from './ProfileSetupNavigator';

// Import auth context and profile context
import { useAuth } from '../context/AuthContext';
import { ProfileProvider } from '../context/ProfileContext';

// Import user services
import { isProfileComplete } from '../services/users';

// Define the stack navigator param list
export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  SignUp: undefined;
  ProfileSetup: undefined;
  Match: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Auth stack - screens for unauthenticated users
const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
};

// App stack - screens for authenticated users
const AppStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Match" component={MatchScreen} />
      {/* Add more authenticated screens here */}
    </Stack.Navigator>
  );
};

// Main navigation component
const Navigation = () => {
  const { user, isLoading } = useAuth();
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  // Set a timeout to prevent getting stuck in loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      if ((isLoading || checkingProfile) && !loadingTimeout) {
        console.warn('Loading timeout reached, forcing navigation to continue');
        setLoadingTimeout(true);
      }
    }, 5000); // 5 second timeout
    
    return () => clearTimeout(timer);
  }, [isLoading, checkingProfile, loadingTimeout]);
  
  useEffect(() => {
    const checkProfileStatus = async () => {
      if (user) {
        try {
          setCheckingProfile(true);
          setProfileError(null);
          const isComplete = await isProfileComplete(user.uid);
          setProfileComplete(isComplete);
        } catch (error) {
          console.error('Error checking profile status:', error);
          setProfileError('Failed to check profile status');
          // In development, assume profile is not complete to allow setup flow
          if (process.env.NODE_ENV !== 'production') {
            console.warn('Continuing to profile setup despite error in development mode');
            setProfileComplete(false);
          }
        } finally {
          setCheckingProfile(false);
        }
      }
    };
    
    checkProfileStatus();
  }, [user]);
  
  // If we're loading but hit the timeout, continue to auth flow
  if ((isLoading || checkingProfile) && !loadingTimeout) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF3B6F" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }
  
  // If there's a profile error in production, show it
  if (profileError && process.env.NODE_ENV === 'production') {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{profileError}</Text>
      </View>
    );
  }
  
  return (
    <NavigationContainer>
      {!user ? (
        <AuthStack />
      ) : !profileComplete ? (
        <ProfileProvider>
          <ProfileSetupNavigator />
        </ProfileProvider>
      ) : (
        <AppStack />
      )}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  },
});

export default Navigation;
