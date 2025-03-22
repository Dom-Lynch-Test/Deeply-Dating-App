import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import ProfileSetupLayout from '../../components/profile-setup/ProfileSetupLayout';
import { useProfile } from '../../context/ProfileContext';
import { RELATIONSHIP_INTENT } from '../../types/profile';

const RelationshipIntentScreen: React.FC = () => {
  const { dispatch } = useProfile();
  
  const handleNext = () => {
    dispatch({ type: 'NEXT_STEP' });
  };
  
  return (
    <ProfileSetupLayout
      title="Relationship Intent"
      subtitle="Deeply is designed for people seeking meaningful connections"
      onNext={handleNext}
    >
      <View style={styles.container}>
        <View style={styles.intentContainer}>
          <Text style={styles.intentText}>{RELATIONSHIP_INTENT}</Text>
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>What this means:</Text>
          <Text style={styles.infoText}>
            • You're looking for a committed, long-term relationship
          </Text>
          <Text style={styles.infoText}>
            • You'll be matched with others who share this goal
          </Text>
          <Text style={styles.infoText}>
            • Our algorithm prioritizes compatibility for lasting connections
          </Text>
          <Text style={styles.infoText}>
            • We focus on values and personality over casual swiping
          </Text>
        </View>
        
        <Text style={styles.note}>
          Deeply is exclusively for those seeking serious relationships.
          If you're looking for something casual, this may not be the right app for you.
        </Text>
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
  intentContainer: {
    backgroundColor: '#FFF0F5',
    borderWidth: 1,
    borderColor: '#FF3B6F',
    borderRadius: 10,
    padding: 20,
    marginVertical: 30,
    width: '90%',
    alignItems: 'center',
  },
  intentText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF3B6F',
  },
  infoContainer: {
    width: '90%',
    padding: 20,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    marginBottom: 20,
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
  note: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default RelationshipIntentScreen;
