import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import ProfileSetupLayout from '../../components/profile-setup/ProfileSetupLayout';
import { useProfile } from '../../context/ProfileContext';
import { getCurrentLocation } from '../../services/location';

const LocationScreen: React.FC = () => {
  const { state, dispatch } = useProfile();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const detectLocation = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const location = await getCurrentLocation();
      
      dispatch({
        type: 'SET_LOCATION',
        payload: location
      });
      
    } catch (err) {
      console.error('Error detecting location:', err);
      setError('Failed to detect your location. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Auto-detect location when screen loads
  useEffect(() => {
    if (!state.location) {
      detectLocation();
    }
  }, []);
  
  const handleNext = () => {
    if (state.location) {
      dispatch({ type: 'NEXT_STEP' });
    }
  };
  
  return (
    <ProfileSetupLayout
      title="Your Location"
      subtitle="We'll use this to find matches near you"
      nextDisabled={!state.location}
      onNext={handleNext}
    >
      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF3B6F" />
            <Text style={styles.loadingText}>Detecting your location...</Text>
          </View>
        ) : state.location ? (
          <View style={styles.locationContainer}>
            <Text style={styles.locationText}>
              Your location: {state.location.city}
            </Text>
            <Text style={styles.locationNote}>
              We only use city-level accuracy for matching
            </Text>
          </View>
        ) : (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={detectLocation}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Why we need your location:</Text>
          <Text style={styles.infoText}>
            • Find potential matches in your area
          </Text>
          <Text style={styles.infoText}>
            • Show you how far away your matches are
          </Text>
          <Text style={styles.infoText}>
            • We never share your exact location with other users
          </Text>
        </View>
      </View>
    </ProfileSetupLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  locationContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  locationText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  locationNote: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  errorContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#D32F2F',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#FF3B6F',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoContainer: {
    width: '90%',
    padding: 20,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    marginTop: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
});

export default LocationScreen;
