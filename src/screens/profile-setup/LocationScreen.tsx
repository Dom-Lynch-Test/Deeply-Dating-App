import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import ProfileSetupLayout from '../../components/profile-setup/ProfileSetupLayout';
import { useProfile } from '../../context/ProfileContext';
import { CITY_OPTIONS, setSelectedCity as getLocationForCity } from '../../services/location';

const LocationScreen: React.FC = () => {
  const { state, dispatch } = useProfile();
  const [selectedCity, setSelectedCity] = useState<string>('');
  
  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    
    if (city) {
      const locationData = getLocationForCity(city);
      dispatch({
        type: 'SET_LOCATION',
        payload: locationData
      });
    }
  };
  
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
        <View style={styles.pickerContainer}>
          <Text style={styles.label}>Select your city:</Text>
          {Platform.OS === 'ios' ? (
            <View style={styles.iosPicker}>
              <Picker
                selectedValue={selectedCity}
                onValueChange={handleCityChange}
                style={styles.picker}
              >
                <Picker.Item label="Select a city" value="" />
                {CITY_OPTIONS.map((city) => (
                  <Picker.Item key={city} label={city} value={city} />
                ))}
              </Picker>
            </View>
          ) : (
            <View style={styles.androidPicker}>
              <Picker
                selectedValue={selectedCity}
                onValueChange={handleCityChange}
                style={styles.picker}
                dropdownIconColor="#FF3B6F"
              >
                <Picker.Item label="Select a city" value="" />
                {CITY_OPTIONS.map((city) => (
                  <Picker.Item key={city} label={city} value={city} />
                ))}
              </Picker>
            </View>
          )}
        </View>
        
        {state.location && (
          <View style={styles.locationContainer}>
            <Text style={styles.locationText}>
              Your location: {state.location.city}
            </Text>
            <Text style={styles.locationNote}>
              We only use city-level accuracy for matching
            </Text>
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
  pickerContainer: {
    width: '90%',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  iosPicker: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  androidPicker: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  locationContainer: {
    alignItems: 'center',
    marginVertical: 20,
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
