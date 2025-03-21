import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { signInWithGoogle } from '../services/auth';
import { useAuth } from '../context/AuthContext';

// Register for redirect
WebBrowser.maybeCompleteAuthSession();

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({ 
  onSuccess, 
  onError 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Request configuration - using a simpler approach
  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      // For now, let's show an alert since we can't fully implement Google Auth in this environment
      Alert.alert(
        "Google Sign-In",
        "In a real app, this would open the Google authentication flow. For now, this is just a placeholder."
      );
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      if (onError && error instanceof Error) {
        onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handleSignIn}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color="#FFF" />
      ) : (
        <View style={styles.buttonContent}>
          <View style={styles.googleIconPlaceholder} />
          <Text style={styles.buttonText}>Sign in with Google</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#4285F4',
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconPlaceholder: {
    width: 24,
    height: 24,
    marginRight: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GoogleSignInButton;
