import React, { ReactNode, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useProfile } from '../../context/ProfileContext';

interface ProfileSetupLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  showBackButton?: boolean;
  showNextButton?: boolean;
  nextButtonText?: string;
  nextDisabled?: boolean;
  onNext?: () => void;
  onBack?: () => void;
  loading?: boolean;
}

const ProfileSetupLayout: React.FC<ProfileSetupLayoutProps> = ({
  title,
  subtitle,
  children,
  showBackButton = true,
  showNextButton = true,
  nextButtonText = 'Next',
  nextDisabled = false,
  onNext,
  onBack,
  loading = false,
}) => {
  const { state, dispatch } = useProfile();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleNext = async () => {
    if (nextDisabled || isProcessing) return;
    
    setIsProcessing(true);
    try {
      if (onNext) {
        onNext();
      } else {
        dispatch({ type: 'NEXT_STEP' });
      }
    } catch (error) {
      console.error('Error in next action:', error);
      // In development, we'll still allow navigation even if there are errors
      if (process.env.NODE_ENV === 'development') {
        console.warn('Continuing despite error in development mode');
        dispatch({ type: 'NEXT_STEP' });
      }
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      dispatch({ type: 'PREV_STEP' });
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {showBackButton && (
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleBack}
            disabled={isProcessing}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        <View style={styles.stepIndicator}>
          <Text style={styles.stepText}>Step {state.currentStep} of 9</Text>
        </View>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        {children}
      </View>
      
      {showNextButton && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.nextButton,
              (nextDisabled || isProcessing) && styles.nextButtonDisabled
            ]}
            onPress={handleNext}
            disabled={nextDisabled || isProcessing}
          >
            {(loading || isProcessing) ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.nextButtonText}>{nextButtonText}</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    padding: 10,
  },
  backButtonText: {
    color: '#ff4b7d',
    fontSize: 16,
  },
  stepIndicator: {
    alignItems: 'center',
  },
  stepText: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  nextButton: {
    backgroundColor: '#ff4b7d',
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#ffb6c8',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ProfileSetupLayout;
