import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator, ScrollView, Alert, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import ProfileSetupLayout from '../../components/profile-setup/ProfileSetupLayout';
import { useProfile } from '../../context/ProfileContext';
import { useAuth } from '../../context/AuthContext';
import { pickImage, takePhoto, uploadPhoto, moderatePhoto, testFirebaseConnection } from '../../services/photos';
import { REQUIRED_PHOTOS_COUNT } from '../../types/profile';
import { testFirebaseConfig } from '../../config/firebase';
import SmartImage from '../../components/SmartImage';

const PhotosScreen: React.FC = () => {
  const { state, dispatch } = useProfile();
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  
  // Test function to check Firebase connectivity
  const testFirebase = async () => {
    setTestResult('Testing Firebase connectivity...');
    try {
      // Test Firebase config
      const configTest = testFirebaseConfig();
      console.log('[DEBUG] Firebase config test result:', configTest);
      
      // Create a simple test with a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Firebase connection test timed out after 5 seconds')), 5000);
      });
      
      // Test Firebase connection with timeout
      const connectionPromise = testFirebaseConnection();
      const result = await Promise.race([connectionPromise, timeoutPromise]);
      
      if (result === true) {
        setTestResult('Firebase connection successful! ');
      } else {
        setTestResult('Firebase connection failed! Check console for details.');
      }
    } catch (error) {
      console.error('[ERROR] Error testing Firebase:', error);
      setTestResult(`Firebase test error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  const handleAddPhoto = async (source: 'camera' | 'library') => {
    if (!user) {
      console.error('[ERROR] No user found when trying to upload photo');
      setError('You must be logged in to upload photos');
      return;
    }
    
    if (state.photos.length >= REQUIRED_PHOTOS_COUNT) {
      Alert.alert('Maximum Photos', `You can only upload ${REQUIRED_PHOTOS_COUNT} photos.`);
      return;
    }
    
    // Reset states at the beginning
    setUploading(true);
    setError(null);
    
    let photoUri: string | null = null;
    
    try {
      console.log('[DEBUG] Starting photo selection process');
      
      // Get photo from camera or library
      try {
        photoUri = source === 'camera' 
          ? await takePhoto()
          : await pickImage();
        console.log('[DEBUG] Photo selected:', photoUri ? 'success' : 'cancelled');
      } catch (err) {
        console.error('[ERROR] Error accessing camera/library:', err);
        setError(Platform.OS === 'web' 
          ? 'There was an issue accessing your camera/photos on web. Try using a mobile device for the best experience.'
          : 'There was an issue accessing your camera/photos. Please check your permissions.');
        setUploading(false);
        return;
      }
      
      if (!photoUri) {
        console.log('[DEBUG] No photo selected, cancelling upload');
        setUploading(false);
        return;
      }
      
      setCurrentPhotoIndex(state.photos.length);
      console.log('[DEBUG] Setting current photo index to:', state.photos.length);
      
      // Upload to Firebase Storage
      try {
        console.log('[DEBUG] Starting upload to Firebase');
        const downloadUrl = await uploadPhoto(user.uid, photoUri);
        console.log('[DEBUG] Upload successful, got URL:', downloadUrl);
        
        // Simulate AI moderation
        console.log('[DEBUG] Starting photo moderation');
        const moderationResult = await moderatePhoto(downloadUrl);
        console.log('[DEBUG] Moderation result:', moderationResult);
        
        if (!moderationResult.isAppropriate) {
          console.log('[DEBUG] Photo rejected by moderation');
          Alert.alert(
            'Photo Rejected',
            'Your photo doesn\'t meet our community guidelines. Please upload a different photo.'
          );
          setUploading(false);
          setCurrentPhotoIndex(null);
          return;
        }
        
        // Add to profile state
        console.log('[DEBUG] Adding photo to profile state');
        dispatch({ type: 'ADD_PHOTO', payload: downloadUrl });
        console.log('[DEBUG] Photo added successfully');
      } catch (err) {
        console.error('[ERROR] Error uploading photo:', err);
        setError('Failed to upload photo. Please try again.');
        setCurrentPhotoIndex(null);
      }
      
    } catch (error) {
      console.error('[ERROR] Unhandled error in photo upload process:', error);
      setError('An unexpected error occurred. Please try again.');
      setCurrentPhotoIndex(null);
    } finally {
      console.log('[DEBUG] Resetting uploading state to false');
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
  
  // Function to handle tapping on an empty photo box
  const handleEmptyPhotoPress = (index: number) => {
    // For web, just open the library picker
    // For mobile, could show an action sheet to choose between camera and library
    if (Platform.OS === 'web') {
      handleAddPhoto('library');
    } else {
      Alert.alert(
        'Add Photo',
        'Choose a photo source',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Camera', 
            onPress: () => handleAddPhoto('camera')
          },
          { 
            text: 'Photo Library', 
            onPress: () => handleAddPhoto('library')
          }
        ]
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
        
        {Platform.OS === 'web' && (
          <View style={styles.webNotice}>
            <MaterialIcons name="info" size={24} color="#FF3B6F" />
            <Text style={styles.webNoticeText}>
              For the best photo upload experience, we recommend using the Deeply app on your mobile device.
            </Text>
          </View>
        )}
        
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        {/* Firebase Test Button */}
        <TouchableOpacity 
          style={styles.testButton} 
          onPress={testFirebase}
          disabled={uploading}
        >
          <Text style={styles.testButtonText}>Test Firebase Connection</Text>
        </TouchableOpacity>
        
        {testResult && (
          <View style={styles.testResultContainer}>
            <Text style={styles.testResultText}>{testResult}</Text>
          </View>
        )}
        
        <View style={styles.photosContainer}>
          {Array.from({ length: REQUIRED_PHOTOS_COUNT }).map((_, index) => {
            const photo = state.photos[index];
            const isUploading = currentPhotoIndex === index && uploading;
            
            return (
              <View key={index} style={styles.photoBox}>
                {photo ? (
                  <View style={styles.photoWrapper}>
                    <SmartImage 
                      uri={photo}
                      style={styles.photo} 
                      onError={(e) => {
                        console.error('[ERROR] Error loading image:', e.nativeEvent.error);
                        // If there's an error loading the image, we could show a fallback
                        // or handle it in some other way
                      }}
                    />
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
                  <TouchableOpacity
                    style={styles.emptyPhoto}
                    onPress={() => handleEmptyPhotoPress(index)}
                    disabled={uploading}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="add-photo-alternate" size={40} color="#ccc" />
                    <Text style={styles.emptyPhotoText}>Add Photo {index + 1}</Text>
                  </TouchableOpacity>
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
  webNotice: {
    flexDirection: 'row',
    backgroundColor: '#FFF5F7',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  webNoticeText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 15,
    marginBottom: 15,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
  },
  testButton: {
    backgroundColor: '#3F51B5',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  testResultContainer: {
    backgroundColor: '#E8F5E9',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 15,
    marginBottom: 15,
  },
  testResultText: {
    color: '#2E7D32',
    fontSize: 14,
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
    backgroundColor: '#f5f5f5',
  },
  photoWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  uploadingText: {
    marginTop: 10,
    color: '#666',
  },
  emptyPhoto: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 10,
  },
  emptyPhotoText: {
    marginTop: 10,
    color: '#666',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  photoButton: {
    backgroundColor: '#FF3B6F',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    minWidth: 150,
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 16,
  },
  infoContainer: {
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginHorizontal: 15,
    marginBottom: 30,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
});

export default PhotosScreen;
