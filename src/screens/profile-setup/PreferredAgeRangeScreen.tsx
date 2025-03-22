import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform } from 'react-native';
import ProfileSetupLayout from '../../components/profile-setup/ProfileSetupLayout';
import { useProfile } from '../../context/ProfileContext';
import { MIN_AGE, MAX_AGE, MAX_AGE_RANGE } from '../../types/profile';

// Custom slider component that works in both web and native
const CustomSlider: React.FC<{
  minimumValue: number;
  maximumValue: number;
  value: number;
  step: number;
  onValueChange: (value: number) => void;
  minimumTrackTintColor: string;
  maximumTrackTintColor: string;
  style?: any;
}> = ({ 
  minimumValue, 
  maximumValue, 
  value, 
  step, 
  onValueChange, 
  minimumTrackTintColor, 
  maximumTrackTintColor,
  style 
}) => {
  const totalSteps = (maximumValue - minimumValue) / step;
  const percentComplete = ((value - minimumValue) / (maximumValue - minimumValue)) * 100;
  
  const handlePress = (event: any) => {
    const { locationX, target } = event.nativeEvent;
    target.measure((x: number, y: number, width: number, height: number) => {
      const percentage = locationX / width;
      const newValue = Math.round((minimumValue + (maximumValue - minimumValue) * percentage) / step) * step;
      onValueChange(Math.max(minimumValue, Math.min(maximumValue, newValue)));
    });
  };

  // For web, use the HTML input range slider
  if (Platform.OS === 'web') {
    return (
      <input
        type="range"
        min={minimumValue}
        max={maximumValue}
        value={value}
        step={step}
        onChange={(e) => onValueChange(Number(e.target.value))}
        style={{
          width: '100%',
          height: 40,
          ...style
        }}
      />
    );
  }

  // For native, use a custom implementation with TouchableOpacity
  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handlePress}
      style={[styles.sliderTrack, { backgroundColor: maximumTrackTintColor }, style]}
    >
      <View 
        style={[
          styles.sliderFill, 
          { 
            backgroundColor: minimumTrackTintColor,
            width: `${percentComplete}%` 
          }
        ]} 
      />
      <View 
        style={[
          styles.sliderThumb, 
          { 
            left: `${percentComplete}%`,
            transform: [{ translateX: -10 }] // Half the width of the thumb
          }
        ]} 
      />
    </TouchableOpacity>
  );
};

const PreferredAgeRangeScreen: React.FC = () => {
  const { state, dispatch } = useProfile();
  const [minAge, setMinAge] = useState(state.preferredAgeMin);
  const [maxAge, setMaxAge] = useState(state.preferredAgeMax);
  
  // Ensure the age range doesn't exceed MAX_AGE_RANGE
  useEffect(() => {
    if (maxAge - minAge > MAX_AGE_RANGE) {
      setMaxAge(minAge + MAX_AGE_RANGE);
    }
  }, [minAge]);
  
  useEffect(() => {
    if (maxAge - minAge > MAX_AGE_RANGE) {
      setMinAge(maxAge - MAX_AGE_RANGE);
    }
  }, [maxAge]);
  
  const handleNext = () => {
    dispatch({ 
      type: 'SET_PREFERRED_AGE_RANGE', 
      payload: { min: minAge, max: maxAge } 
    });
    dispatch({ type: 'NEXT_STEP' });
  };
  
  return (
    <ProfileSetupLayout
      title="Preferred Age Range"
      subtitle={`You can match with people ${minAge}-${maxAge} years old`}
      onNext={handleNext}
    >
      <View style={styles.container}>
        <View style={styles.rangeContainer}>
          <Text style={styles.rangeLabel}>Minimum Age: {minAge}</Text>
          <CustomSlider
            style={styles.slider}
            minimumValue={MIN_AGE}
            maximumValue={state.age}
            step={1}
            value={minAge}
            onValueChange={setMinAge}
            minimumTrackTintColor="#FF3B6F"
            maximumTrackTintColor="#ccc"
          />
        </View>
        
        <View style={styles.rangeContainer}>
          <Text style={styles.rangeLabel}>Maximum Age: {maxAge}</Text>
          <CustomSlider
            style={styles.slider}
            minimumValue={state.age}
            maximumValue={MAX_AGE}
            step={1}
            value={maxAge}
            onValueChange={setMaxAge}
            minimumTrackTintColor="#FF3B6F"
            maximumTrackTintColor="#ccc"
          />
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            You'll be shown potential matches within this age range. You can always change this later.
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
  },
  rangeContainer: {
    marginBottom: 30,
  },
  rangeLabel: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: '500',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  infoContainer: {
    marginTop: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  sliderTrack: {
    height: 4,
    borderRadius: 2,
    position: 'relative',
  },
  sliderFill: {
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  sliderThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF3B6F',
    position: 'absolute',
    top: -8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
});

export default PreferredAgeRangeScreen;
