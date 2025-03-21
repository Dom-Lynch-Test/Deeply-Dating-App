import React from 'react';
import { StyleSheet, Text, View, Image, Dimensions, TouchableOpacity } from 'react-native';
import { UserProfile } from '../types';

interface ProfileCardProps {
  profile: UserProfile;
  onLike: (id: string) => void;
  onSkip: (id: string) => void;
}

const { width } = Dimensions.get('window');

const ProfileCard = ({ profile, onLike, onSkip }: ProfileCardProps) => {
  return (
    <View style={styles.card}>
      <View style={styles.photoContainer}>
        {profile.photos.length > 0 ? (
          <Image 
            source={{ uri: profile.photos[0] }} 
            style={styles.photo} 
            resizeMode="cover"
          />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.placeholderText}>No Photo</Text>
          </View>
        )}
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{profile.name}, {profile.age}</Text>
        
        {profile.seriousnessScore !== undefined && (
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>Seriousness Score</Text>
            <Text style={styles.score}>{profile.seriousnessScore}/10</Text>
          </View>
        )}
        
        <Text style={styles.bio}>{profile.bio}</Text>
        
        <View style={styles.interestsContainer}>
          {profile.interests.map((interest, index) => (
            <View key={index} style={styles.interestTag}>
              <Text style={styles.interestText}>{interest}</Text>
            </View>
          ))}
        </View>
      </View>
      
      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.skipButton]} 
          onPress={() => onSkip(profile.id)}
        >
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.likeButton]} 
          onPress={() => onLike(profile.id)}
        >
          <Text style={styles.likeButtonText}>Like</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: width - 40,
    backgroundColor: 'white',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    marginHorizontal: 20,
    marginVertical: 10,
    overflow: 'hidden',
  },
  photoContainer: {
    width: '100%',
    height: 400,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 18,
    color: '#999',
  },
  infoContainer: {
    padding: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 5,
  },
  score: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF4B91',
  },
  bio: {
    fontSize: 16,
    color: '#444',
    marginBottom: 15,
    lineHeight: 22,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  interestTag: {
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  interestText: {
    fontSize: 14,
    color: '#666',
  },
  actionContainer: {
    flexDirection: 'row',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  skipButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  likeButton: {
    backgroundColor: '#FF4B91',
  },
  skipButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  likeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileCard;
