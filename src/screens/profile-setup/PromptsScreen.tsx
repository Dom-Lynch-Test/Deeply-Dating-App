import React, { useState } from 'react';
import { View, StyleSheet, Text, TextInput, ScrollView } from 'react-native';
import ProfileSetupLayout from '../../components/profile-setup/ProfileSetupLayout';
import { useProfile } from '../../context/ProfileContext';
import { MAX_PROMPT_LENGTH } from '../../types/profile';

const PromptsScreen: React.FC = () => {
  const { state, dispatch } = useProfile();
  const [valuePrompt, setValuePrompt] = useState(state.prompts.value);
  const [partnerPrompt, setPartnerPrompt] = useState(state.prompts.partner);
  const [surprisingPrompt, setSurprisingPrompt] = useState(state.prompts.surprising);
  
  const handleNext = () => {
    // Save all prompts to state
    dispatch({ 
      type: 'SET_PROMPT_VALUE', 
      payload: valuePrompt.trim() 
    });
    dispatch({ 
      type: 'SET_PROMPT_PARTNER', 
      payload: partnerPrompt.trim() 
    });
    dispatch({ 
      type: 'SET_PROMPT_SURPRISING', 
      payload: surprisingPrompt.trim() 
    });
    
    dispatch({ type: 'NEXT_STEP' });
  };
  
  const allPromptsValid = 
    valuePrompt.trim().length > 0 && 
    partnerPrompt.trim().length > 0 && 
    surprisingPrompt.trim().length > 0;
  
  return (
    <ProfileSetupLayout
      title="About You"
      subtitle="Answer these prompts to help others get to know you"
      nextDisabled={!allPromptsValid}
      onNext={handleNext}
    >
      <ScrollView style={styles.container}>
        <View style={styles.promptContainer}>
          <Text style={styles.promptTitle}>
            One value I'll never compromise on is...
          </Text>
          <TextInput
            style={styles.promptInput}
            value={valuePrompt}
            onChangeText={setValuePrompt}
            placeholder="Share a core value that defines you"
            multiline
            maxLength={MAX_PROMPT_LENGTH}
          />
          <Text style={styles.characterCount}>
            {valuePrompt.length}/{MAX_PROMPT_LENGTH}
          </Text>
        </View>
        
        <View style={styles.promptContainer}>
          <Text style={styles.promptTitle}>
            In a partner, I appreciate most...
          </Text>
          <TextInput
            style={styles.promptInput}
            value={partnerPrompt}
            onChangeText={setPartnerPrompt}
            placeholder="What qualities matter most to you?"
            multiline
            maxLength={MAX_PROMPT_LENGTH}
          />
          <Text style={styles.characterCount}>
            {partnerPrompt.length}/{MAX_PROMPT_LENGTH}
          </Text>
        </View>
        
        <View style={styles.promptContainer}>
          <Text style={styles.promptTitle}>
            Something surprising about me is...
          </Text>
          <TextInput
            style={styles.promptInput}
            value={surprisingPrompt}
            onChangeText={setSurprisingPrompt}
            placeholder="Share something unexpected or unique"
            multiline
            maxLength={MAX_PROMPT_LENGTH}
          />
          <Text style={styles.characterCount}>
            {surprisingPrompt.length}/{MAX_PROMPT_LENGTH}
          </Text>
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Why these prompts matter:</Text>
          <Text style={styles.infoText}>
            • Your answers will be shown as swipable cards
          </Text>
          <Text style={styles.infoText}>
            • They help create meaningful connections beyond photos
          </Text>
          <Text style={styles.infoText}>
            • Be authentic - your unique perspective is what makes you stand out
          </Text>
        </View>
      </ScrollView>
    </ProfileSetupLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  promptContainer: {
    marginBottom: 25,
  },
  promptTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  promptInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 5,
  },
  infoContainer: {
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    marginVertical: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
});

export default PromptsScreen;
