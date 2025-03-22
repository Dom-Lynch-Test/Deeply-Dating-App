import React, { useState } from 'react';
import { Image, ImageProps, View, ActivityIndicator, StyleSheet } from 'react-native';

interface SmartImageProps extends Omit<ImageProps, 'source'> {
  uri: string;
  fallbackUri?: string;
}

/**
 * SmartImage component that handles different image URI formats:
 * - Firebase Storage URLs (https://...)
 * - Local storage URLs (local://...)
 * - Base64 data URLs (data:image/...)
 */
const SmartImage: React.FC<SmartImageProps> = ({ uri, fallbackUri, style, ...props }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Determine the source based on the URI format
  const getSource = (imageUri: string) => {
    if (imageUri.startsWith('data:')) {
      // Base64 data URL (used by web local storage fallback)
      return { uri: imageUri };
    } else if (imageUri.startsWith('local://')) {
      // Local file path (used by native local storage fallback)
      // Strip the 'local://' prefix to get the actual file path
      return { uri: imageUri.replace('local://', '') };
    } else {
      // Regular URL (Firebase Storage or other remote URL)
      return { uri: imageUri };
    }
  };

  return (
    <View style={[styles.container, style]}>
      <Image
        {...props}
        source={getSource(hasError && fallbackUri ? fallbackUri : uri)}
        style={[styles.image, style]}
        onLoadStart={() => setIsLoading(true)}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          console.log('[DEBUG] Error loading image:', uri);
          setIsLoading(false);
          setHasError(true);
          
          // If we have a fallback URI and we're not already using it, retry with fallback
          if (fallbackUri && uri !== fallbackUri) {
            console.log('[DEBUG] Trying fallback URI:', fallbackUri);
          }
        }}
      />
      
      {isLoading && (
        <View style={[styles.loaderContainer, style]}>
          <ActivityIndicator size="small" color="#FF3B6F" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 245, 245, 0.7)',
  },
});

export default SmartImage;
