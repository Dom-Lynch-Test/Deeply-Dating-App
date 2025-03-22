import React, { useState } from 'react';
import { View, StyleSheet, Text, Image, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import ProfileSetupLayout from '../../components/profile-setup/ProfileSetupLayout';
import { useProfile } from '../../context/ProfileContext';
import { RootStackParamList } from '../../navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Match'>;

const ProfileReviewScreen: React.FC = () => {
  const { state, dispatch, saveProfile, isProfileComplete } = useProfile();
  const [submitting, setSubmitting] = useState(false);
  const navigation = useNavigation<NavigationProp>();
  
  const handleComplete = async () => {
    if (!isProfileComplete()) {
      Alert.alert(
        'Incomplete Profile',
        'Please complete all required fields before submitting.'
      );
      return;
    }
    
    try {
      setSubmitting(true);
      await saveProfile();
      
      // Navigate to the main app
      navigation.reset({
        index: 0,
        routes: [{ name: 'Match' }],
      });
    } catch (error) {
      console.error('Error completing profile:', error);
      Alert.alert(
        'Error',
        'Failed to save your profile. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleEditSection = (sectionNumber: number) => {
    dispatch({ type: 'GO_TO_STEP', payload: sectionNumber });
  };
  
  return (
    <ProfileSetupLayout
      title="Review Your Profile"
      subtitle="Make sure everything looks good before continuing"
      nextButtonText="Complete Profile"
      onNext={handleComplete}
      loading={submitting}
    >
      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Basic Info</Text>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => handleEditSection(1)}
            >
              <MaterialIcons name="edit" size={18} color="#FF3B6F" />
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>{state.displayName}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Gender:</Text>
            <Text style={styles.infoValue}>
              {state.gender.charAt(0).toUpperCase() + state.gender.slice(1)}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Age:</Text>
            <Text style={styles.infoValue}>{state.age}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Match Ages:</Text>
            <Text style={styles.infoValue}>
              {state.preferredAgeMin}–{state.preferredAgeMax}
            </Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Location</Text>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => handleEditSection(4)}
            >
              <MaterialIcons name="edit" size={18} color="#FF3B6F" />
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>City:</Text>
            <Text style={styles.infoValue}>
              {state.location?.city || 'Not set'}
            </Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Relationship Intent</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Looking for:</Text>
            <Text style={styles.infoValue}>Serious relationship</Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => handleEditSection(5)}
            >
              <MaterialIcons name="edit" size={18} color="#FF3B6F" />
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.photosContainer}>
            {state.photos.map((photo, index) => (
              <Image 
                key={index}
                source={{ uri: photo }}
                style={styles.photo}
              />
            ))}
          </View>
        </View>
        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>About You</Text>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => handleEditSection(6)}
            >
              <MaterialIcons name="edit" size={18} color="#FF3B6F" />
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.promptContainer}>
            <Text style={styles.promptTitle}>
              One value I'll never compromise on is...
            </Text>
            <Text style={styles.promptAnswer}>{state.prompts.value}</Text>
          </View>
          
          <View style={styles.promptContainer}>
            <Text style={styles.promptTitle}>
              In a partner, I appreciate most...
            </Text>
            <Text style={styles.promptAnswer}>{state.prompts.partner}</Text>
          </View>
          
          <View style={styles.promptContainer}>
            <Text style={styles.promptTitle}>
              Something surprising about me is...
            </Text>
            <Text style={styles.promptAnswer}>{state.prompts.surprising}</Text>
          </View>
        </View>
        
        <View style={styles.privacyContainer}>
          <Text style={styles.privacyText}>
            By completing your profile, you agree to our Terms of Service and Privacy Policy.
            Your data will be stored securely and used only for the purpose of finding compatible matches.
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
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editText: {
    color: '#FF3B6F',
    marginLeft: 5,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    width: 100,
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  photosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  photo: {
    width: '32%',
    aspectRatio: 3/4,
    borderRadius: 8,
    marginBottom: 5,
  },
  promptContainer: {
    marginBottom: 15,
  },
  promptTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 5,
  },
  promptAnswer: {
    fontSize: 16,
  },
  privacyContainer: {
    padding: 15,
    marginBottom: 20,
  },
  privacyText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
});

export default ProfileReviewScreen;
