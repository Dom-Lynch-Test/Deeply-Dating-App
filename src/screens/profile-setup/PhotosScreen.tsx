import React, { useState } from 'react';
import { View, StyleSheet, Text, Image, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import ProfileSetupLayout from '../../components/profile-setup/ProfileSetupLayout';
import { useProfile } from '../../context/ProfileContext';
import { useAuth } from '../../context/AuthContext';
import { pickImage, takePhoto, uploadPhoto, moderatePhoto } from '../../services/photos';
import { REQUIRED_PHOTOS_COUNT } from '../../types/profile';

const PhotosScreen: React.FC = () => {
  const { state, dispatch } = useProfile();
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number | null>(null);
  
  const handleAddPhoto = async (source: 'camera' | 'library') => {
    if (!user) return;
    if (state.photos.length >= REQUIRED_PHOTOS_COUNT) {
      Alert.alert('Maximum Photos', `You can only upload ${REQUIRED_PHOTOS_COUNT} photos.`);
      return;
    }
    
    try {
      setUploading(true);
      
      // Get photo from camera or library
      const photoUri = source === 'camera' 
        ? await takePhoto()
        : await pickImage();
      
      if (!photoUri) {
        setUploading(false);
        return;
      }
      
      setCurrentPhotoIndex(state.photos.length);
      
      // Upload to Firebase Storage
      const downloadUrl = await uploadPhoto(user.uid, photoUri);
      
      // Simulate AI moderation
      const moderationResult = await moderatePhoto(downloadUrl);
      
      if (!moderationResult.isAppropriate) {
        Alert.alert(
          'Photo Rejected',
          'Your photo doesn\'t meet our community guidelines. Please upload a different photo.'
        );
        setUploading(false);
        setCurrentPhotoIndex(null);
        return;
      }
      
      // Add to profile state
      dispatch({ type: 'ADD_PHOTO', payload: downloadUrl });
      setCurrentPhotoIndex(null);
      
    } catch (error) {
      console.error('Error adding photo:', error);
      Alert.alert('Error', 'Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };
  
  const handleRemovePhoto = (photoUrl: string) => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => dispatch({ type: 'REMOVE_PHOTO', payload: photoUrl })
        }
      ]
    );
  };
  
  const handleNext = () => {
    if (state.photos.length === REQUIRED_PHOTOS_COUNT) {
      dispatch({ type: 'NEXT_STEP' });
    } else {
      Alert.alert(
        'Photos Required',
        `Please upload exactly ${REQUIRED_PHOTOS_COUNT} photos to continue.`
      );
    }
  };
  
  return (
    <ProfileSetupLayout
      title="Profile Photos"
      subtitle={`Upload exactly ${REQUIRED_PHOTOS_COUNT} photos that clearly show your face`}
      nextDisabled={state.photos.length !== REQUIRED_PHOTOS_COUNT || uploading}
      onNext={handleNext}
    >
      <ScrollView style={styles.container}>
        <Text style={styles.photoCount}>
          {state.photos.length} of {REQUIRED_PHOTOS_COUNT} photos
        </Text>
        
        <View style={styles.photosContainer}>
          {Array.from({ length: REQUIRED_PHOTOS_COUNT }).map((_, index) => {
            const photo = state.photos[index];
            const isUploading = currentPhotoIndex === index && uploading;
            
            return (
              <View key={index} style={styles.photoBox}>
                {photo ? (
                  <View style={styles.photoWrapper}>
                    <Image source={{ uri: photo }} style={styles.photo} />
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemovePhoto(photo)}
                      disabled={uploading}
                    >
                      <MaterialIcons name="close" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : isUploading ? (
                  <View style={styles.uploadingContainer}>
                    <ActivityIndicator size="large" color="#FF3B6F" />
                    <Text style={styles.uploadingText}>Uploading...</Text>
                  </View>
                ) : (
                  <View style={styles.emptyPhoto}>
                    <MaterialIcons name="add-photo-alternate" size={40} color="#ccc" />
                    <Text style={styles.emptyPhotoText}>Add Photo {index + 1}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
        
        {state.photos.length < REQUIRED_PHOTOS_COUNT && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.photoButton}
              onPress={() => handleAddPhoto('library')}
              disabled={uploading}
            >
              <MaterialIcons name="photo-library" size={24} color="#fff" />
              <Text style={styles.buttonText}>Choose from Library</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.photoButton}
              onPress={() => handleAddPhoto('camera')}
              disabled={uploading}
            >
              <MaterialIcons name="camera-alt" size={24} color="#fff" />
              <Text style={styles.buttonText}>Take a Photo</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Photo Guidelines:</Text>
          <Text style={styles.infoText}>• Your face should be clearly visible</Text>
          <Text style={styles.infoText}>• No inappropriate content</Text>
          <Text style={styles.infoText}>• No group photos</Text>
          <Text style={styles.infoText}>• Recent photos that represent you accurately</Text>
          <Text style={styles.infoText}>• All photos undergo AI moderation</Text>
        </View>
      </ScrollView>
    </ProfileSetupLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  photoCount: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 10,
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  photoBox: {
    width: '45%',
    aspectRatio: 4/5,
    marginBottom: 15,
    borderRadius: 10,
    overflow: 'hidden',
  },
  photoWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPhoto: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPhotoText: {
    marginTop: 10,
    color: '#666',
  },
  uploadingContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingText: {
    marginTop: 10,
    color: '#666',
  },
  buttonContainer: {
    marginVertical: 20,
  },
  photoButton: {
    flexDirection: 'row',
    backgroundColor: '#FF3B6F',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
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

export default PhotosScreen;
