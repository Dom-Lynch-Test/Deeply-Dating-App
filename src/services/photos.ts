import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

// Maximum photo size in bytes (3MB)
const MAX_PHOTO_SIZE = 3 * 1024 * 1024;

// Request permission to access the photo library
export const requestMediaLibraryPermission = async (): Promise<boolean> => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
};

// Request permission to access the camera
export const requestCameraPermission = async (): Promise<boolean> => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
};

// Pick an image from the library
export const pickImage = async (): Promise<string | null> => {
  try {
    const permissionGranted = await requestMediaLibraryPermission();
    
    if (!permissionGranted) {
      throw new Error('Permission to access media library was denied');
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.8,
    });
    
    if (result.canceled) {
      return null;
    }
    
    // Compress the image if needed
    const compressedImage = await compressImage(result.assets[0].uri);
    return compressedImage;
  } catch (error) {
    console.error('Error picking image:', error);
    throw error;
  }
};

// Take a photo with the camera
export const takePhoto = async (): Promise<string | null> => {
  try {
    const permissionGranted = await requestCameraPermission();
    
    if (!permissionGranted) {
      throw new Error('Permission to access camera was denied');
    }
    
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.8,
    });
    
    if (result.canceled) {
      return null;
    }
    
    // Compress the image if needed
    const compressedImage = await compressImage(result.assets[0].uri);
    return compressedImage;
  } catch (error) {
    console.error('Error taking photo:', error);
    throw error;
  }
};

// Compress image to reduce size
const compressImage = async (uri: string): Promise<string> => {
  try {
    const manipResult = await manipulateAsync(
      uri,
      [{ resize: { width: 1080 } }],
      { compress: 0.7, format: SaveFormat.JPEG }
    );
    
    return manipResult.uri;
  } catch (error) {
    console.error('Error compressing image:', error);
    throw error;
  }
};

// Upload a photo to Firebase Storage
export const uploadPhoto = async (
  userId: string,
  uri: string
): Promise<string> => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    
    // Check file size
    if (blob.size > MAX_PHOTO_SIZE) {
      throw new Error('Photo size exceeds the maximum allowed (3MB)');
    }
    
    // Create a unique filename
    const filename = `${userId}_${Date.now()}.jpg`;
    const storageRef = ref(storage, `users/${userId}/photos/${filename}`);
    
    // Upload the image
    const uploadTask = uploadBytesResumable(storageRef, blob);
    
    // Return a promise that resolves with the download URL when upload completes
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Progress tracking if needed
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress}% done`);
        },
        (error) => {
          // Handle errors
          console.error('Error uploading photo:', error);
          reject(error);
        },
        async () => {
          // Upload completed successfully, get download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  } catch (error) {
    console.error('Error in uploadPhoto:', error);
    throw error;
  }
};

// Simulate AI moderation with Google Vision API
// In a real implementation, this would call a Firebase Cloud Function
// that uses the Google Vision API for content moderation
export const moderatePhoto = async (photoUrl: string): Promise<{
  isAppropriate: boolean;
  moderationScore: number;
}> => {
  try {
    // This is a placeholder for the actual API call
    // In a real implementation, you would call a Firebase Cloud Function
    console.log('Moderating photo:', photoUrl);
    
    // Simulate a delay for the API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // For now, we'll assume all photos pass moderation
    // In a real implementation, this would return the actual moderation results
    return {
      isAppropriate: true,
      moderationScore: 0.95,
    };
  } catch (error) {
    console.error('Error moderating photo:', error);
    throw error;
  }
};
