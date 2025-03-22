import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Text } from 'react-native';
import ProfileSetupLayout from '../../components/profile-setup/ProfileSetupLayout';
import { useProfile } from '../../context/ProfileContext';

const DisplayNameScreen: React.FC = () => {
  const { state, dispatch } = useProfile();
  const [name, setName] = useState(state.displayName);
  
  const handleNext = () => {
    if (name.trim().length > 0) {
      dispatch({ type: 'SET_DISPLAY_NAME', payload: name.trim() });
      dispatch({ type: 'NEXT_STEP' });
    }
  };
  
  return (
    <ProfileSetupLayout
      title="What's your first name?"
      subtitle="This is how you'll appear to others on Deeply"
      showBackButton={false}
      nextDisabled={name.trim().length === 0}
      onNext={handleNext}
    >
      <View style={styles.container}>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Your first name"
          autoFocus
          maxLength={20}
          autoCapitalize="words"
        />
        <Text style={styles.note}>
          You'll only be able to change your name once after initial setup.
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
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    fontSize: 18,
    paddingVertical: 10,
    marginBottom: 20,
  },
  note: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default DisplayNameScreen;
