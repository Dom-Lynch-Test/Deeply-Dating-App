import { ref, uploadBytesResumable, getDownloadURL, uploadBytes } from 'firebase/storage';
import { storage, firestore } from '../config/firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Maximum photo size in bytes (3MB)
const MAX_PHOTO_SIZE = 3 * 1024 * 1024;

// Local storage keys
const LOCAL_PHOTOS_KEY = 'deeply_local_photos';

// Flag to determine if we should use local storage fallback
// This will be set to true if Firebase connectivity fails
let useLocalStorageFallback = false;

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
    // Skip permission check on web since it's handled differently
    if (Platform.OS !== 'web') {
      const permissionGranted = await requestMediaLibraryPermission();
      
      if (!permissionGranted) {
        throw new Error('Permission to access media library was denied');
      }
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
    // Skip permission check on web since it's handled differently
    if (Platform.OS !== 'web') {
      const permissionGranted = await requestCameraPermission();
      
      if (!permissionGranted) {
        throw new Error('Permission to access camera was denied');
      }
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

// Helper function to convert URI to blob with proper error handling
const uriToBlob = async (uri: string): Promise<Blob> => {
  try {
    // For web platform, handle data URLs differently
    if (Platform.OS === 'web' && uri.startsWith('data:')) {
      // For data URLs, we can fetch directly
      const response = await fetch(uri);
      const blob = await response.blob();
      return blob;
    }
    
    // For file URIs (mobile platforms and some web cases)
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error('Error converting URI to blob:', error);
    throw new Error('Failed to process the image. Please try again.');
  }
};

// Test Firebase connectivity with more detailed logging and Firestore fallback
export const testFirebaseConnection = async (): Promise<boolean> => {
  try {
    console.log('[DEBUG] Testing Firebase connectivity...');
    console.log('[DEBUG] Storage reference:', storage);
    
    // Log the Firebase config being used
    console.log('[DEBUG] Firebase storage bucket:', storage.app.options.storageBucket);
    
    // Check if storage bucket has the correct format
    const storageBucket = storage.app.options.storageBucket;
    if (storageBucket && storageBucket.includes('firebasestorage.app')) {
      console.error('[ERROR] Incorrect storage bucket format detected:', storageBucket);
      console.error('[ERROR] Storage bucket should use appspot.com instead of firebasestorage.app');
      console.error('[ERROR] Please update your environment variables');
      return false;
    }
    
    // Test basic connectivity to Firebase domains first
    try {
      console.log('[DEBUG] Testing connectivity to Firebase domains...');
      const domains = [
        'firestore.googleapis.com',
        'storage.googleapis.com',
        'firebase.googleapis.com',
        `${storage.app.options.projectId}.firebaseio.com`,
        `${storage.app.options.storageBucket}`  // Add direct test to the storage bucket
      ];
      
      let reachabilityIssues = false;
      
      for (const domain of domains) {
        try {
          console.log(`[DEBUG] Testing connectivity to ${domain}...`);
          
          // Create a simple fetch request with a timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch(`https://${domain}/`, {
            method: 'HEAD',
            signal: controller.signal,
            cache: 'no-cache',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok || response.status === 404) {
            // 404 is fine, it means we reached the server but the path doesn't exist
            console.log(`[DEBUG] Successfully reached ${domain} (status: ${response.status})`);
          } else {
            console.log(`[DEBUG] Reached ${domain} but got status: ${response.status}`);
            reachabilityIssues = true;
          }
        } catch (error: any) {
          console.log(`[DEBUG] Failed to reach ${domain}: ${error.message}`);
          reachabilityIssues = true;
        }
      }
      
      if (reachabilityIssues) {
        console.warn('[WARN] Some Firebase domains are unreachable. This may cause connectivity issues.');
        console.warn('[WARN] Check your network connection, firewall settings, or try a different network.');
        console.warn('[WARN] Enabling local storage fallback for development...');
        useLocalStorageFallback = true;
      }
    } catch (domainError: any) {
      console.error('[ERROR] Error testing domain connectivity:', domainError);
      // Continue with the rest of the tests even if domain check fails
      useLocalStorageFallback = true;
    }
    
    // If we've already determined we need to use local storage, don't bother testing Firebase further
    if (useLocalStorageFallback) {
      console.log('[DEBUG] Using local storage fallback due to connectivity issues');
      return false;
    }
    
    // Try to access the storage bucket
    const testRef = ref(storage, '.connection_test');
    console.log('[DEBUG] Test reference created:', testRef.fullPath);
    
    try {
      // Create a promise that resolves after a timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Storage timeout - operation took too long')), 10000);
      });
      
      // First try Storage with timeout
      console.log('[DEBUG] Testing Storage access...');
      try {
        await Promise.race([
          getDownloadURL(testRef),
          timeoutPromise
        ]);
        console.log('[DEBUG] Successfully connected to Firebase Storage');
        useLocalStorageFallback = false;
        return true;
      } catch (downloadError: any) {
        if (downloadError.message && downloadError.message.includes('timeout')) {
          console.error('[ERROR] Timeout connecting to Firebase Storage');
          console.error('[ERROR] This suggests a network connectivity issue or firewall blocking Storage');
          useLocalStorageFallback = true;
          throw downloadError;
        }
        
        // If we get a "not found" error (404), it means we can connect to Firebase
        // but the file doesn't exist, which is expected
        console.log('[DEBUG] Download error code:', downloadError.code);
        if (downloadError.code === 'storage/object-not-found') {
          console.log('[DEBUG] Firebase Storage connection successful (file not found error is expected)');
          useLocalStorageFallback = false;
          return true;
        }
        
        // If it's a permission error, it means we can connect but don't have permission
        if (downloadError.code === 'storage/unauthorized') {
          console.log('[DEBUG] Firebase Storage connection successful but unauthorized (check Storage Rules)');
          console.log('[DEBUG] Try updating your Firebase Storage Rules to:');
          console.log(`
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}`);
          useLocalStorageFallback = false;
          return true;
        }
        
        // Check for billing-related errors
        if (downloadError.code === 'storage/quota-exceeded' || 
            downloadError.message?.includes('quota') || 
            downloadError.message?.includes('billing')) {
          console.error('[ERROR] Firebase Storage quota exceeded or billing issue detected');
          console.error('[ERROR] Make sure your Firebase project has an active billing plan');
          console.error('[ERROR] Go to Firebase Console > Storage to upgrade your plan');
          useLocalStorageFallback = true;
          throw new Error('Firebase Storage requires a billing plan upgrade');
        }
        
        useLocalStorageFallback = true;
        throw downloadError;
      }
    } catch (storageError: any) {
      // If Storage fails, try Firestore as a fallback to test general connectivity
      console.log('[DEBUG] Storage test failed, trying Firestore as fallback...');
      console.error('[ERROR] Storage error:', storageError);
      
      try {
        // Create a promise that resolves after a timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Firestore timeout - operation took too long')), 10000);
        });
        
        // Try to fetch a single document from any collection
        console.log('[DEBUG] Testing Firestore access...');
        const testQuery = query(collection(firestore, 'users'), limit(1));
        
        try {
          await Promise.race([
            getDocs(testQuery),
            timeoutPromise
          ]);
          
          console.log('[DEBUG] Successfully connected to Firestore');
          console.log('[DEBUG] This suggests the issue is with Storage Rules, not general connectivity');
          useLocalStorageFallback = false;
          return true;
        } catch (queryError: any) {
          if (queryError.message && queryError.message.includes('timeout')) {
            console.error('[ERROR] Timeout connecting to Firestore');
            console.error('[ERROR] This suggests a network connectivity issue or firewall blocking Firestore');
          }
          useLocalStorageFallback = true;
          throw queryError;
        }
      } catch (firestoreError: any) {
        console.error('[ERROR] Firestore test failed:', firestoreError);
        useLocalStorageFallback = true;
        throw firestoreError;
      }
    }
  } catch (error: any) {
    console.error('[ERROR] Firebase connection test failed:', error);
    console.error('[ERROR] Error code:', error.code);
    console.error('[ERROR] Error message:', error.message);
    
    // Provide user-friendly error messages based on the error type
    if (error.code === 'unavailable') {
      console.error('[ERROR] Firebase services are unavailable. This is likely a network connectivity issue.');
      console.error('[ERROR] Try connecting to a different network or disabling any VPN/firewall.');
      console.error('[ERROR] Using local storage fallback for development...');
    } else if (error.message && error.message.includes('timeout')) {
      console.error('[ERROR] Connection timed out. This suggests network latency or firewall issues.');
      console.error('[ERROR] Using local storage fallback for development...');
    } else if (error.code === 'auth/network-request-failed') {
      console.error('[ERROR] Network request failed. Check your internet connection.');
      console.error('[ERROR] Using local storage fallback for development...');
    }
    
    useLocalStorageFallback = true;
    return false;
  }
};

// Local storage fallback functions
const savePhotoToLocalStorage = async (userId: string, uri: string): Promise<string> => {
  try {
    console.log('[DEBUG] Saving photo to local storage');
    
    // Platform-specific handling
    if (Platform.OS === 'web') {
      console.log('[DEBUG] Using web-specific local storage approach');
      
      try {
        // For web, we'll use the browser's localStorage API
        // First, fetch the image and convert it to a base64 string
        const response = await fetch(uri);
        const blob = await response.blob();
        
        // Convert blob to base64
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            try {
              // Generate a unique ID for the photo
              const photoId = `${userId}_${Date.now()}`;
              
              // Get existing photos from localStorage
              const existingPhotosJson = localStorage.getItem(LOCAL_PHOTOS_KEY);
              const existingPhotos = existingPhotosJson ? JSON.parse(existingPhotosJson) : {};
              
              // Add the new photo to the user's photos
              if (!existingPhotos[userId]) {
                existingPhotos[userId] = [];
              }
              
              // Create a mock download URL with the base64 data
              // We'll use a data URL format which can be directly used in <img> tags
              const base64Data = reader.result as string;
              
              // Add the photo to the user's photos
              existingPhotos[userId].push({
                id: photoId,
                url: base64Data,
                timestamp: Date.now()
              });
              
              // Save the updated photos to localStorage
              localStorage.setItem(LOCAL_PHOTOS_KEY, JSON.stringify(existingPhotos));
              
              console.log('[DEBUG] Photo saved to web localStorage:', photoId);
              resolve(base64Data);
            } catch (error: any) {
              console.error('[ERROR] Error saving to localStorage:', error);
              reject(error);
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (webError: any) {
        console.error('[ERROR] Error in web local storage approach:', webError);
        throw webError;
      }
    }
    
    // For native platforms, use FileSystem
    console.log('[DEBUG] Using native FileSystem approach');
    
    // Generate a unique ID for the photo
    const photoId = `${userId}_${Date.now()}`;
    
    // Create a local file path in the app's cache directory
    const localFilePath = `${FileSystem.cacheDirectory}${photoId}.jpg`;
    
    // Copy the photo to the local file path
    await FileSystem.copyAsync({
      from: uri,
      to: localFilePath
    });
    
    // Get the existing photos from AsyncStorage
    const existingPhotosJson = await AsyncStorage.getItem(LOCAL_PHOTOS_KEY);
    const existingPhotos = existingPhotosJson ? JSON.parse(existingPhotosJson) : {};
    
    // Add the new photo to the user's photos
    if (!existingPhotos[userId]) {
      existingPhotos[userId] = [];
    }
    
    // Create a mock download URL
    const mockDownloadUrl = `local://${localFilePath}`;
    
    // Add the photo to the user's photos
    existingPhotos[userId].push({
      id: photoId,
      url: mockDownloadUrl,
      localPath: localFilePath,
      timestamp: Date.now()
    });
    
    // Save the updated photos to AsyncStorage
    await AsyncStorage.setItem(LOCAL_PHOTOS_KEY, JSON.stringify(existingPhotos));
    
    console.log('[DEBUG] Photo saved to local storage:', mockDownloadUrl);
    return mockDownloadUrl;
  } catch (error: any) {
    console.error('[ERROR] Error saving photo to local storage:', error);
    throw new Error(`Failed to save photo locally: ${error.message || 'Unknown error'}`);
  }
};

// Upload a photo to Firebase Storage or local storage fallback
export const uploadPhoto = async (
  userId: string,
  uri: string
): Promise<string> => {
  try {
    console.log('[DEBUG] Starting photo upload process for URI:', uri);
    
    // Test Firebase connectivity first if we're not already using local storage
    if (!useLocalStorageFallback) {
      const isConnected = await testFirebaseConnection();
      useLocalStorageFallback = !isConnected;
    }
    
    // If we're using local storage fallback, save the photo locally
    if (useLocalStorageFallback) {
      console.log('[DEBUG] Using local storage fallback for photo upload');
      return savePhotoToLocalStorage(userId, uri);
    }
    
    // Otherwise, proceed with Firebase Storage upload
    console.log('[DEBUG] Using Firebase Storage for photo upload');
    
    // Convert URI to blob
    let blob: Blob;
    try {
      console.log('[DEBUG] Converting URI to blob');
      const response = await fetch(uri);
      
      // Log response details
      console.log('[DEBUG] Fetch response status:', response.status);
      console.log('[DEBUG] Fetch response type:', response.type);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      blob = await response.blob();
      console.log('[DEBUG] Blob created successfully, size:', blob.size, 'type:', blob.type);
      
      if (blob.size === 0) {
        throw new Error('Image blob is empty. The image may be corrupt or inaccessible.');
      }
    } catch (blobError: any) {
      console.error('[ERROR] Failed to convert URI to blob:', blobError);
      
      // If blob conversion fails, try local storage fallback
      console.log('[DEBUG] Blob conversion failed, trying local storage fallback');
      return savePhotoToLocalStorage(userId, uri);
    }
    
    // Create a unique filename
    const filename = `${userId}_${Date.now()}.jpg`;
    const storagePath = `users/${userId}/photos/${filename}`;
    const storageRef = ref(storage, storagePath);
    
    console.log('[DEBUG] Uploading to Firebase Storage path:', storagePath);
    console.log('[DEBUG] Storage reference full path:', storageRef.fullPath);
    
    // Use different upload approaches based on platform
    if (Platform.OS === 'web') {
      console.log('[DEBUG] Using direct upload for web');
      
      try {
        // Create a promise that resolves after a timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Upload timeout - operation took too long')), 30000);
        });
        
        // Upload with timeout protection
        const uploadPromise = uploadBytes(storageRef, blob);
        
        // Race the upload against the timeout
        const uploadResult = await Promise.race([
          uploadPromise,
          timeoutPromise
        ]);
        
        console.log('[DEBUG] Upload bytes completed, metadata:', uploadResult.metadata);
        
        // Get the download URL with timeout protection
        const downloadPromise = getDownloadURL(storageRef);
        const downloadURL = await Promise.race([
          downloadPromise,
          new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Download URL timeout')), 10000);
          })
        ]);
        
        console.log('[DEBUG] Got download URL:', downloadURL);
        return downloadURL;
      } catch (webError: any) {
        console.error('[ERROR] Error in web upload:', webError);
        console.error('[ERROR] Error code:', webError.code);
        console.error('[ERROR] Error message:', webError.message);
        
        // If Firebase upload fails, try local storage fallback
        console.log('[DEBUG] Firebase upload failed, trying local storage fallback');
        return savePhotoToLocalStorage(userId, uri);
      }
    }
    
    // For mobile platforms, use the event-based approach with progress tracking
    console.log('[DEBUG] Using event-based upload for mobile');
    const uploadTask = uploadBytesResumable(storageRef, blob);
    
    // Return a promise that resolves with the download URL when upload completes
    return new Promise((resolve, reject) => {
      // Set up a timeout to prevent hanging
      const timeoutId = setTimeout(() => {
        uploadTask.cancel();
        console.log('[DEBUG] Upload timed out, trying local storage fallback');
        
        // If the upload times out, try local storage fallback
        savePhotoToLocalStorage(userId, uri)
          .then(resolve)
          .catch(reject);
      }, 60000);
      
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('[DEBUG] Upload progress:', progress.toFixed(2) + '%');
        },
        (error) => {
          clearTimeout(timeoutId);
          console.error('[ERROR] Upload error:', error);
          
          // If Firebase upload fails, try local storage fallback
          console.log('[DEBUG] Firebase upload failed, trying local storage fallback');
          savePhotoToLocalStorage(userId, uri)
            .then(resolve)
            .catch(reject);
        },
        async () => {
          clearTimeout(timeoutId);
          try {
            // Create a promise that resolves after a timeout
            const timeoutPromise = new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error('Download URL timeout')), 10000);
            });
            
            // Get the download URL with timeout protection
            const downloadURL = await Promise.race([
              getDownloadURL(uploadTask.snapshot.ref),
              timeoutPromise
            ]);
            
            console.log('[DEBUG] Upload completed successfully, URL:', downloadURL);
            resolve(downloadURL);
          } catch (urlError: any) {
            console.error('[ERROR] Error getting download URL:', urlError);
            
            // If getting the download URL fails, try local storage fallback
            console.log('[DEBUG] Getting download URL failed, trying local storage fallback');
            savePhotoToLocalStorage(userId, uri)
              .then(resolve)
              .catch(reject);
          }
        }
      );
    });
  } catch (error: any) {
    console.error('[ERROR] Photo upload failed:', error);
    
    // If any unexpected error occurs, try local storage fallback
    console.log('[DEBUG] Unexpected error, trying local storage fallback');
    return savePhotoToLocalStorage(userId, uri);
  }
};

// Simulate AI moderation of a photo
export const moderatePhoto = async (photoUrl: string): Promise<{ isAppropriate: boolean; reason?: string }> => {
  try {
    console.log('[DEBUG] Starting photo moderation for URL:', photoUrl);
    
    // In a real app, this would call an AI moderation service
    // For now, we'll simulate a delay and always approve
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('[DEBUG] Photo moderation completed successfully');
    return { isAppropriate: true };
  } catch (error) {
    console.error('[ERROR] Error in photo moderation:', error);
    // Don't throw, return a safe default
    return { isAppropriate: true, reason: 'Moderation error, approved by default' };
  }
};
