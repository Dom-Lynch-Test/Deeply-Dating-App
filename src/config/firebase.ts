import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';
import Constants from 'expo-constants';
import { ref, getDownloadURL } from 'firebase/storage';

// Get environment variables from expo-constants
const {
  firebaseApiKey,
  firebaseAuthDomain,
  firebaseProjectId,
  firebaseStorageBucket,
  firebaseMessagingSenderId,
  firebaseAppId,
  firebaseMeasurementId
} = Constants.expoConfig?.extra || {};

// Validate environment variables
const validateEnvVariables = () => {
  const variables = [
    { name: 'firebaseApiKey', value: firebaseApiKey },
    { name: 'firebaseAuthDomain', value: firebaseAuthDomain },
    { name: 'firebaseProjectId', value: firebaseProjectId },
    { name: 'firebaseStorageBucket', value: firebaseStorageBucket },
    { name: 'firebaseMessagingSenderId', value: firebaseMessagingSenderId },
    { name: 'firebaseAppId', value: firebaseAppId },
    { name: 'firebaseMeasurementId', value: firebaseMeasurementId }
  ];

  const missingVars = variables.filter(v => !v.value);
  
  if (missingVars.length > 0) {
    console.error(
      `Missing environment variables: ${missingVars.map(v => v.name).join(', ')}. ` +
      'Make sure you have a .env file with all required variables.'
    );
    
    // Fallback to hardcoded values in development
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Using fallback Firebase configuration for development. DO NOT USE IN PRODUCTION!');
      return false;
    } else {
      throw new Error('Missing required Firebase configuration in production environment');
    }
  }
  
  return true;
};

// Ensure storage bucket has the correct format
const getCorrectStorageBucket = (bucket: string) => {
  if (bucket && bucket.includes('firebasestorage.app')) {
    console.log('[FIREBASE] Fixing incorrect storage bucket format');
    return bucket.replace('firebasestorage.app', 'appspot.com');
  }
  return bucket;
};

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
let firebaseConfig;

if (validateEnvVariables()) {
  firebaseConfig = {
    apiKey: firebaseApiKey,
    authDomain: firebaseAuthDomain,
    projectId: firebaseProjectId,
    storageBucket: getCorrectStorageBucket(firebaseStorageBucket),
    messagingSenderId: firebaseMessagingSenderId,
    appId: firebaseAppId,
    measurementId: firebaseMeasurementId
  };
} else {
  // Fallback configuration for development only
  firebaseConfig = {
    apiKey: "AIzaSyCcoEHjZ_WML0CALfbvoxRY1Qr9udcAMJI",
    authDomain: "deeply-90de9.firebaseapp.com",
    projectId: "deeply-90de9",
    storageBucket: getCorrectStorageBucket("deeply-90de9.appspot.com"),
    messagingSenderId: "604287607462",
    appId: "1:604287607462:web:b5fc2d308c177cfc4c4a67",
    measurementId: "G-PP6S66EVQP"
  };
}

// Log the configuration being used
console.log('[DEBUG] Firebase initialization with config:', { 
  apiKey: firebaseConfig.apiKey ? '***' : 'undefined', 
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

// Initialize Analytics (only in web environments)
let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

// Export a function to test Firebase connectivity
export const testFirebaseConfig = async () => {
  console.log('[FIREBASE] Testing Firebase connectivity...');
  
  try {
    // Test basic connectivity to Firebase domains first
    const domains = [
      'firestore.googleapis.com',
      'storage.googleapis.com',
      'firebase.googleapis.com',
      `${firebaseConfig.projectId}.firebaseio.com`
    ];
    
    let reachabilityIssues = false;
    
    for (const domain of domains) {
      try {
        console.log(`[FIREBASE] Testing connectivity to ${domain}...`);
        
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
          console.log(`[FIREBASE] Successfully reached ${domain} (status: ${response.status})`);
        } else {
          console.log(`[FIREBASE] Reached ${domain} but got status: ${response.status}`);
          reachabilityIssues = true;
        }
      } catch (error: any) {
        console.log(`[FIREBASE] Failed to reach ${domain}: ${error.message}`);
        reachabilityIssues = true;
      }
    }
    
    if (reachabilityIssues) {
      console.warn('[FIREBASE] Some Firebase domains are unreachable. This may cause connectivity issues.');
      console.warn('[FIREBASE] Check your network connection, firewall settings, or try a different network.');
    }
    
    // Test storage specifically
    try {
      console.log('[FIREBASE] Testing Firebase Storage connectivity...');
      const testRef = ref(storage, '.connection_test');
      
      // Create a promise that resolves after a timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Storage timeout - operation took too long')), 10000);
      });
      
      // Race the download against the timeout
      try {
        await Promise.race([
          getDownloadURL(testRef),
          timeoutPromise
        ]);
        console.log('[FIREBASE] Successfully connected to Firebase Storage');
        return true;
      } catch (error: any) {
        if (error.code === 'storage/object-not-found') {
          // This is actually a successful test - we could connect but the file doesn't exist
          console.log('[FIREBASE] Successfully connected to Firebase Storage (file not found)');
          return true;
        } else if (error.message.includes('timeout')) {
          console.error('[FIREBASE] Timeout connecting to Firebase Storage');
          console.error('[FIREBASE] This suggests a network connectivity issue or firewall blocking Storage');
          return false;
        } else {
          console.error(`[FIREBASE] Error connecting to Firebase Storage: ${error.message} (${error.code || 'no code'})`);
          
          if (error.code === 'storage/unauthorized') {
            console.warn('[FIREBASE] This is likely a Storage Rules issue. Check your Firebase Storage Rules.');
          }
          
          return false;
        }
      }
    } catch (error: any) {
      console.error(`[FIREBASE] Error setting up Storage test: ${error.message}`);
      return false;
    }
  } catch (error: any) {
    console.error(`[FIREBASE] Unexpected error in connectivity test: ${error.message}`);
    return false;
  }
};

export { auth, firestore, storage, analytics };
