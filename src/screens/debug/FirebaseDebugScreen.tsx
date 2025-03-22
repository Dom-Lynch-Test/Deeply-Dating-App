import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import FirebaseDebugger from '../../components/debug/FirebaseDebugger';

const FirebaseDebugScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <FirebaseDebugger />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default FirebaseDebugScreen;
