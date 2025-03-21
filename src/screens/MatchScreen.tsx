import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ProfileCard from '../components/ProfileCard';
import { UserProfile } from '../types';
import { useAuth } from '../context/AuthContext';

// Mock data for testing
const mockProfiles: UserProfile[] = [
  {
    id: '1',
    name: 'Sarah',
    age: 28,
    gender: 'female',
    photos: ['https://randomuser.me/api/portraits/women/68.jpg'],
    bio: 'Looking for a meaningful connection with someone who values deep conversations and shared experiences.',
    interests: ['Reading', 'Hiking', 'Photography', 'Travel'],
    location: {
      latitude: 25.276987,
      longitude: 55.296249
    },
    lookingFor: 'male',
    seriousnessScore: 8.5
  },
  {
    id: '2',
    name: 'Michael',
    age: 32,
    gender: 'male',
    photos: ['https://randomuser.me/api/portraits/men/32.jpg'],
    bio: 'Software engineer by day, amateur chef by night. Seeking someone to share good food and meaningful conversations with.',
    interests: ['Cooking', 'Technology', 'Fitness', 'Movies'],
    location: {
      latitude: 25.204849,
      longitude: 55.270782
    },
    lookingFor: 'female',
    seriousnessScore: 7.8
  },
  {
    id: '3',
    name: 'Emma',
    age: 30,
    gender: 'female',
    photos: ['https://randomuser.me/api/portraits/women/44.jpg'],
    bio: 'Art curator with a passion for literature and cultural experiences. Looking for someone who appreciates the finer things in life.',
    interests: ['Art', 'Literature', 'Museums', 'Wine Tasting'],
    location: {
      latitude: 25.197197,
      longitude: 55.274376
    },
    lookingFor: 'male',
    seriousnessScore: 9.2
  }
];

const MatchScreen = () => {
  const [profiles, setProfiles] = useState<UserProfile[]>(mockProfiles);
  const { user, userProfile, logout } = useAuth();

  const handleLike = (id: string) => {
    console.log(`Liked profile ${id}`);
    // In a real app, this would send the like to the backend
    // and potentially create a match if mutual
    setProfiles(profiles.filter(profile => profile.id !== id));
  };

  const handleSkip = (id: string) => {
    console.log(`Skipped profile ${id}`);
    // In a real app, this would record the skip in the backend
    setProfiles(profiles.filter(profile => profile.id !== id));
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Navigation will be handled by the auth state listener
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Deeply</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.profileInfo}>
        <Text style={styles.welcomeText}>
          Welcome, {user?.displayName || 'User'}!
        </Text>
        {userProfile && (
          <Text style={styles.profileText}>
            Profile completion: {userProfile.profileCompleted ? 'Complete' : 'Incomplete'}
          </Text>
        )}
      </View>

      {profiles.length > 0 ? (
        <FlatList
          data={profiles}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProfileCard 
              profile={item} 
              onLike={handleLike} 
              onSkip={handleSkip} 
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No more matches for today</Text>
          <Text style={styles.emptySubtext}>Check back tomorrow for new quality matches</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    position: 'relative',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    position: 'absolute',
    right: 20,
    top: 20,
    padding: 8,
    backgroundColor: '#FF4D8D',
    borderRadius: 20,
  },
  logoutText: {
    color: 'white',
    fontWeight: '600',
  },
  profileInfo: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  welcomeText: {
    fontSize: 18,
    color: '#333',
  },
  profileText: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  listContainer: {
    paddingVertical: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default MatchScreen;
