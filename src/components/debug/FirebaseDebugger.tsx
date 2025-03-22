import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, UserCredential } from 'firebase/auth';
import { getStorage, ref, getDownloadURL, uploadString, uploadBytes, deleteObject } from 'firebase/storage';
import { getFirestore, collection, getDocs, query, limit, QuerySnapshot, DocumentData } from 'firebase/firestore';
import Constants from 'expo-constants';
import NetInfo from '@react-native-community/netinfo';

const FirebaseDebugger: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<any>(null);

  useEffect(() => {
    // Check network status on mount
    checkNetworkStatus();
  }, []);

  const checkNetworkStatus = async () => {
    try {
      const state = await NetInfo.fetch();
      setNetworkStatus(state);
      addLog(`Network Status: ${JSON.stringify({
        isConnected: state.isConnected,
        type: state.type,
        isInternetReachable: state.isInternetReachable
      }, null, 2)}`);
    } catch (error) {
      addLog(`Error checking network: ${error}`);
    }
  };

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]} - ${message}`]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const getFirebaseConfig = () => {
    // First try to get from Constants
    const {
      firebaseApiKey,
      firebaseAuthDomain,
      firebaseProjectId,
      firebaseStorageBucket,
      firebaseMessagingSenderId,
      firebaseAppId,
      firebaseMeasurementId
    } = Constants.expoConfig?.extra || {};

    // Check if we have all required values
    if (firebaseApiKey && firebaseAuthDomain && firebaseProjectId && firebaseStorageBucket) {
      addLog('Using config from Constants/env variables');
      
      // Ensure storage bucket has the correct format
      let storageBucket = firebaseStorageBucket;
      if (storageBucket.includes('firebasestorage.app')) {
        addLog('⚠️ Incorrect storage bucket format detected, fixing...');
        storageBucket = storageBucket.replace('firebasestorage.app', 'appspot.com');
        addLog(`✅ Fixed storage bucket format: ${storageBucket}`);
      }
      
      return {
        apiKey: firebaseApiKey,
        authDomain: firebaseAuthDomain,
        projectId: firebaseProjectId,
        storageBucket: storageBucket,
        messagingSenderId: firebaseMessagingSenderId,
        appId: firebaseAppId,
        measurementId: firebaseMeasurementId
      };
    }

    // Fallback to hardcoded config
    addLog('WARNING: Using hardcoded fallback config');
    return {
      apiKey: "AIzaSyCcoEHjZ_WML0CALfbvoxRY1Qr9udcAMJI",
      authDomain: "deeply-90de9.firebaseapp.com",
      projectId: "deeply-90de9",
      storageBucket: "deeply-90de9.appspot.com",
      messagingSenderId: "604287607462",
      appId: "1:604287607462:web:b5fc2d308c177cfc4c4a67",
      measurementId: "G-PP6S66EVQP"
    };
  };

  // Test if we can reach Firebase servers directly
  const testFirebaseReachability = async () => {
    addLog('\nTesting Firebase Reachability');
    
    try {
      // Test basic connectivity to Firebase domains
      const domains = [
        'firestore.googleapis.com',
        'storage.googleapis.com',
        'firebase.googleapis.com',
        'deeply-90de9.firebaseio.com'
      ];
      
      for (const domain of domains) {
        try {
          addLog(`Testing connectivity to ${domain}...`);
          
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
            addLog(`✅ Successfully reached ${domain} (status: ${response.status})`);
          } else {
            addLog(`❌ Reached ${domain} but got status: ${response.status}`);
          }
        } catch (error: any) {
          if (error.name === 'AbortError') {
            addLog(`❌ Timeout reaching ${domain} - connection took too long`);
          } else {
            addLog(`❌ Failed to reach ${domain}: ${error.message}`);
          }
        }
      }
    } catch (error: any) {
      addLog(`Error in reachability test: ${error.message}`);
    }
  };

  // Test Firebase Storage Rules
  const testStorageRules = async () => {
    addLog('\nTesting Firebase Storage Rules');
    
    try {
      // Get the storage instance
      const storageInstance = getStorage();
      
      // Create a test file in memory
      const testBlob = new Blob(['Test file content'], { type: 'text/plain' });
      const testRef = ref(storageInstance, 'test_permissions.txt');
      
      addLog('Attempting to upload a test file...');
      
      try {
        // Create a promise that resolves after a timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Upload timeout - operation took too long')), 10000);
        });
        
        // Upload with timeout protection
        await Promise.race([
          uploadBytes(testRef, testBlob),
          timeoutPromise
        ]);
        
        addLog('✅ Successfully uploaded test file - Storage Rules allow writes');
        
        // Now try to read it back
        addLog('Attempting to read the test file...');
        
        await Promise.race([
          getDownloadURL(testRef),
          new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Download timeout')), 10000);
          })
        ]);
        
        addLog('✅ Successfully read test file - Storage Rules allow reads');
        
        // Clean up by deleting the test file
        addLog('Cleaning up test file...');
        await deleteObject(testRef);
        addLog('✅ Test file deleted successfully');
        
        return true;
      } catch (error: any) {
        if (error.code === 'storage/unauthorized') {
          addLog('❌ Permission denied - Storage Rules are too restrictive');
          addLog('Recommended Storage Rules for testing:');
          addLog(`
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}`);
          return false;
        } else if (error.message && error.message.includes('timeout')) {
          addLog('❌ Operation timed out - check network connectivity');
          return false;
        } else if (error.code === 'storage/quota-exceeded' || 
                  error.message?.includes('quota') || 
                  error.message?.includes('billing')) {
          addLog('❌ Storage quota exceeded or billing issue detected');
          addLog('Make sure your Firebase project has an active billing plan');
          return false;
        } else {
          addLog(`❌ Error testing Storage Rules: ${error.message} (${error.code || 'unknown'})`);
          return false;
        }
      }
    } catch (error: any) {
      addLog(`Error in Storage Rules test: ${error.message}`);
      return false;
    }
  };

  const runTests = async () => {
    setIsRunning(true);
    clearLogs();
    
    try {
      // Step 0: Check network status
      await checkNetworkStatus();
      
      // Step 0.5: Test Firebase reachability
      await testFirebaseReachability();
      
      // Step 1: Initialize Firebase with config
      addLog('\nSTEP 1: Initializing Firebase');
      const config = getFirebaseConfig();
      addLog(`Config: ${JSON.stringify({
        ...config,
        apiKey: '***HIDDEN***' // Hide API key in logs
      }, null, 2)}`);
      
      // Initialize a fresh Firebase instance for testing
      let testApp: FirebaseApp;
      try {
        testApp = initializeApp(config, 'debuggerApp');
        addLog('✅ Firebase initialized successfully');
      } catch (initError: any) {
        addLog(`❌ Firebase initialization error: ${initError.message}`);
        throw initError;
      }
      
      // Step 2: Test Auth
      addLog('\nSTEP 2: Testing Firebase Auth');
      try {
        const auth = getAuth(testApp);
        addLog('Auth initialized');
        
        // Check if localhost is in authorized domains (web only)
        if (Platform.OS === 'web') {
          addLog('⚠️ Web platform detected - make sure localhost is in authorized domains in Firebase Console');
          addLog('Go to: Firebase Console > Authentication > Settings > Authorized Domains');
          addLog('Add "localhost" if it\'s not already there');
        }
        
        try {
          addLog('Attempting anonymous sign-in (with 10s timeout)...');
          
          // Create a promise that resolves after a timeout
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Auth timeout - operation took too long')), 10000);
          });
          
          // Race the sign-in against the timeout
          const userCredential = await Promise.race([
            signInAnonymously(auth),
            timeoutPromise
          ]) as UserCredential;
          
          addLog(`✅ Anonymous sign-in successful: ${userCredential.user.uid}`);
        } catch (authError: any) {
          if (authError.message.includes('timeout')) {
            addLog(`❌ ${authError.message}`);
            addLog('This suggests a network connectivity issue or firewall blocking Firebase');
          } else {
            addLog(`❌ Auth error: ${authError.message} (${authError.code || 'no code'})`);
          }
          
          // Continue with other tests even if auth fails
        }
      } catch (authSetupError: any) {
        addLog(`❌ Auth setup error: ${authSetupError.message}`);
        // Continue with other tests
      }
      
      // Step 3: Test Firestore
      addLog('\nSTEP 3: Testing Firestore');
      try {
        const firestore = getFirestore(testApp);
        addLog('Firestore initialized');
        
        try {
          const testQuery = query(collection(firestore, 'users'), limit(1));
          addLog('Attempting to query Firestore (with 10s timeout)...');
          
          // Create a promise that resolves after a timeout
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Firestore timeout - operation took too long')), 10000);
          });
          
          // Race the query against the timeout
          const querySnapshot: QuerySnapshot<DocumentData> = await Promise.race([
            getDocs(testQuery),
            timeoutPromise
          ]) as QuerySnapshot<DocumentData>;
          
          addLog(`✅ Firestore query successful: ${querySnapshot.size} documents found`);
        } catch (firestoreError: any) {
          if (firestoreError.message.includes('timeout')) {
            addLog(`❌ ${firestoreError.message}`);
            addLog('This suggests a network connectivity issue or firewall blocking Firestore');
          } else {
            addLog(`❌ Firestore error: ${firestoreError.message} (${firestoreError.code || 'no code'})`);
          }
        }
      } catch (firestoreSetupError: any) {
        addLog(`❌ Firestore setup error: ${firestoreSetupError.message}`);
      }
      
      // Step 4: Test Storage
      addLog('\nSTEP 4: Testing Firebase Storage');
      try {
        const storage = getStorage(testApp);
        addLog(`Storage initialized with bucket: ${storage.app.options.storageBucket}`);
        
        // Try to get a reference
        try {
          const testRef = ref(storage, 'test.txt');
          addLog(`Storage reference created: ${testRef.fullPath}`);
          
          // Try to get a download URL (will likely fail with 404, which is expected)
          try {
            addLog('Attempting to get download URL (with 10s timeout)...');
            
            // Create a promise that resolves after a timeout
            const timeoutPromise = new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error('Storage timeout - operation took too long')), 10000);
            });
            
            // Race the download against the timeout
            const url = await Promise.race([
              getDownloadURL(testRef),
              timeoutPromise
            ]) as string;
            
            addLog(`✅ Got download URL: ${url}`);
          } catch (downloadError: any) {
            if (downloadError.message.includes('timeout')) {
              addLog(`❌ ${downloadError.message}`);
              addLog('This suggests a network connectivity issue or firewall blocking Storage');
            } else if (downloadError.code === 'storage/object-not-found') {
              addLog('✅ File not found error (expected, this is normal)');
              addLog('This confirms we can connect to Storage but the file doesn\'t exist');
              
              // Try to upload a small test file
              try {
                addLog('Attempting to upload a test file (with 10s timeout)...');
                
                // Create a promise that resolves after a timeout
                const uploadTimeoutPromise = new Promise<never>((_, reject) => {
                  setTimeout(() => reject(new Error('Upload timeout - operation took too long')), 10000);
                });
                
                // Race the upload against the timeout
                await Promise.race([
                  uploadString(testRef, 'Test content from Deeply app'),
                  uploadTimeoutPromise
                ]);
                
                addLog('✅ Test file uploaded successfully');
                
                // Now try to get the URL again
                const url = await getDownloadURL(testRef);
                addLog(`✅ Got download URL after upload: ${url}`);
              } catch (uploadError: any) {
                if (uploadError.message.includes('timeout')) {
                  addLog(`❌ ${uploadError.message}`);
                } else {
                  addLog(`❌ Upload error: ${uploadError.message} (${uploadError.code || 'no code'})`);
                  
                  if (uploadError.code === 'storage/unauthorized') {
                    addLog('⚠️ This is likely a Storage Rules issue. Check your Firebase Storage Rules.');
                    addLog('Temporarily try setting rules to:');
                    addLog(`
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}`);
                  }
                }
              }
            } else {
              addLog(`❌ Download error: ${downloadError.message} (${downloadError.code || 'no code'})`);
            }
          }
        } catch (refError: any) {
          addLog(`❌ Error creating storage reference: ${refError.message}`);
        }
      } catch (storageError: any) {
        addLog(`❌ Storage setup error: ${storageError.message}`);
      }
      
      // Step 5: Test Storage Rules
      await testStorageRules();
      
      // Step 6: Provide recommendations based on test results
      addLog('\nDIAGNOSIS & RECOMMENDATIONS:');
      if (logs.some(log => log.includes('timeout'))) {
        addLog('⚠️ NETWORK ISSUE DETECTED: Multiple timeouts suggest connectivity problems');
        addLog('1. Check your internet connection');
        addLog('2. Verify you\'re not behind a restrictive firewall or VPN');
        addLog('3. If on web, ensure CORS is properly configured for Firebase Storage');
        addLog('4. Try testing on a different network or device');
      }
      
      if (logs.some(log => log.includes('unauthorized'))) {
        addLog('⚠️ PERMISSION ISSUE DETECTED: Unauthorized errors suggest Firebase Security Rules problems');
        addLog('1. Check your Firebase Security Rules for Storage and Firestore');
        addLog('2. Temporarily set rules to allow all access for testing');
        addLog('3. Ensure you\'re properly authenticated before accessing protected resources');
      }
      
      if (Platform.OS === 'web' && logs.some(log => log.includes('CORS'))) {
        addLog('⚠️ CORS ISSUE DETECTED: Web platform requires proper CORS configuration');
        addLog('1. Go to Firebase Console > Storage > Rules > CORS Configuration');
        addLog('2. Add localhost to the allowed origins');
      }
      
      addLog('\nAll tests completed');
    } catch (error: any) {
      addLog(`Unexpected error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase Debugger</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, isRunning && styles.disabledButton]}
          onPress={runTests}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>
            {isRunning ? 'Running Tests...' : 'Run Firebase Tests'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.clearButton}
          onPress={clearLogs}
          disabled={isRunning}
        >
          <Text style={styles.clearButtonText}>Clear Logs</Text>
        </TouchableOpacity>
      </View>
      
      {networkStatus && (
        <View style={[
          styles.networkStatus, 
          networkStatus.isConnected ? styles.networkConnected : styles.networkDisconnected
        ]}>
          <Text style={styles.networkStatusText}>
            Network: {networkStatus.isConnected ? 'Connected' : 'Disconnected'} 
            ({networkStatus.type})
          </Text>
        </View>
      )}
      
      <ScrollView style={styles.logsContainer}>
        {logs.length === 0 ? (
          <Text style={styles.emptyLogs}>No logs yet. Run tests to see results.</Text>
        ) : (
          logs.map((log, index) => (
            <Text key={index} style={[
              styles.logLine,
              log.includes('❌') ? styles.errorLog : 
              log.includes('✅') ? styles.successLog :
              log.includes('⚠️') ? styles.warningLog : null
            ]}>
              {log}
            </Text>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  button: {
    flex: 3,
    backgroundColor: '#4285F4',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  disabledButton: {
    backgroundColor: '#A4C2F4',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#666',
    fontSize: 16,
  },
  networkStatus: {
    padding: 8,
    borderRadius: 4,
    marginBottom: 16,
  },
  networkConnected: {
    backgroundColor: '#E8F5E9',
  },
  networkDisconnected: {
    backgroundColor: '#FFEBEE',
  },
  networkStatusText: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  logsContainer: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 12,
  },
  emptyLogs: {
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  logLine: {
    color: '#FFF',
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 4,
  },
  errorLog: {
    color: '#FF8A80',
  },
  successLog: {
    color: '#B9F6CA',
  },
  warningLog: {
    color: '#FFE57F',
  },
});

export default FirebaseDebugger;
