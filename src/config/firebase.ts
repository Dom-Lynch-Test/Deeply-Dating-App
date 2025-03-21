import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';
import Constants from 'expo-constants';

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

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
let firebaseConfig;

if (validateEnvVariables()) {
  firebaseConfig = {
    apiKey: firebaseApiKey,
    authDomain: firebaseAuthDomain,
    projectId: firebaseProjectId,
    storageBucket: firebaseStorageBucket,
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
    storageBucket: "deeply-90de9.firebasestorage.app",
    messagingSenderId: "604287607462",
    appId: "1:604287607462:web:b5fc2d308c177cfc4c4a67",
    measurementId: "G-PP6S66EVQP"
  };
}

// Log the configuration being used
console.log('Using Firebase config:', { 
  apiKey: firebaseConfig.apiKey ? '***' : 'undefined', 
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId
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

export { auth, firestore, storage, analytics };
