import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import ProfileSetupLayout from '../../components/profile-setup/ProfileSetupLayout';
import { useProfile } from '../../context/ProfileContext';

const GenderScreen: React.FC = () => {
  const { state, dispatch } = useProfile();
  
  const handleSelectGender = (gender: 'male' | 'female') => {
    dispatch({ type: 'SET_GENDER', payload: gender });
    dispatch({ type: 'NEXT_STEP' });
  };
  
  return (
    <ProfileSetupLayout
      title="What's your gender?"
      subtitle="Deeply uses this to find the right matches for you"
      showNextButton={false}
    >
      <View style={styles.container}>
        <TouchableOpacity
          style={[
            styles.genderButton,
            state.gender === 'male' && styles.selectedButton
          ]}
          onPress={() => handleSelectGender('male')}
        >
          <Text style={[
            styles.genderText,
            state.gender === 'male' && styles.selectedText
          ]}>
            Male
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.genderButton,
            state.gender === 'female' && styles.selectedButton
          ]}
          onPress={() => handleSelectGender('female')}
        >
          <Text style={[
            styles.genderText,
            state.gender === 'female' && styles.selectedText
          ]}>
            Female
          </Text>
        </TouchableOpacity>
      </View>
    </ProfileSetupLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    alignItems: 'center',
  },
  genderButton: {
    width: '80%',
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 20,
    alignItems: 'center',
  },
  selectedButton: {
    borderColor: '#FF3B6F',
    backgroundColor: '#FFF0F5',
  },
  genderText: {
    fontSize: 18,
    color: '#333',
  },
  selectedText: {
    color: '#FF3B6F',
    fontWeight: 'bold',
  },
});

export default GenderScreen;
