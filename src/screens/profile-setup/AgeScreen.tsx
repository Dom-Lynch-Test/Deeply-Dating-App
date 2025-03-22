import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, Platform, TouchableOpacity } from 'react-native';
import ProfileSetupLayout from '../../components/profile-setup/ProfileSetupLayout';
import { useProfile } from '../../context/ProfileContext';
import { MIN_AGE, MAX_AGE } from '../../types/profile';

const AgeScreen: React.FC = () => {
  const { state, dispatch } = useProfile();
  const [age, setAge] = useState(state.age);
  
  const handleAgeChange = (value: number) => {
    setAge(value);
  };
  
  const handleNext = () => {
    dispatch({ type: 'SET_AGE', payload: age });
    dispatch({ type: 'NEXT_STEP' });
  };
  
  // Generate age options from 20-50
  const ageOptions: number[] = [];
  for (let i = MIN_AGE; i <= MAX_AGE; i++) {
    ageOptions.push(i);
  }
  
  // Render a web-friendly select element for web platform
  const renderAgePicker = () => {
    if (Platform.OS === 'web') {
      return (
        <select
          value={age}
          onChange={(e) => handleAgeChange(Number(e.target.value))}
          style={{
            width: '100%',
            height: 50,
            fontSize: 18,
            padding: 10,
            borderRadius: 8,
            borderColor: '#ddd',
            borderWidth: 1,
            backgroundColor: '#fff'
          }}
        >
          {ageOptions.map((ageValue: number) => (
            <option key={ageValue} value={ageValue}>{ageValue}</option>
          ))}
        </select>
      );
    }
    
    // For native platforms, use a custom picker UI
    return (
      <ScrollView style={styles.customPickerContainer}>
        {ageOptions.map((ageOption: number) => (
          <TouchableOpacity
            key={ageOption}
            style={[
              styles.ageOption,
              ageOption === age && styles.selectedAgeOption
            ]}
            onPress={() => handleAgeChange(ageOption)}
          >
            <Text 
              style={[
                styles.ageOptionText,
                ageOption === age && styles.selectedAgeOptionText
              ]}
            >
              {ageOption}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };
  
  return (
    <ProfileSetupLayout
      title="How old are you?"
      subtitle="You must be between 20-50 years old to use Deeply"
      onNext={handleNext}
    >
      <View style={styles.container}>
        <View style={styles.pickerContainer}>
          {renderAgePicker()}
        </View>
        
        <Text style={styles.note}>
          We'll use this to find matches in your preferred age range
        </Text>
      </View>
    </ProfileSetupLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  pickerContainer: {
    marginBottom: 30,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f8f8f8',
  },
  customPickerContainer: {
    maxHeight: 200,
  },
  ageOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  selectedAgeOption: {
    backgroundColor: '#f0f8ff',
  },
  ageOptionText: {
    fontSize: 18,
  },
  selectedAgeOptionText: {
    fontWeight: 'bold',
    color: '#FF3B6F',
  },
  note: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    marginTop: 20,
  },
});

export default AgeScreen;
