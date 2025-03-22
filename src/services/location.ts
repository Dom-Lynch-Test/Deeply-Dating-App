import * as Location from 'expo-location';

interface GeocodingResult {
  city: string;
  region: string;
  country: string;
}

export const getCurrentLocation = async (): Promise<{
  coordinates: { latitude: number; longitude: number };
  city: string;
}> => {
  try {
    // Request permission to access location
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      throw new Error('Location permission not granted');
    }
    
    // Get current position
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    
    const { latitude, longitude } = location.coords;
    
    // Reverse geocode to get city name
    const geocode = await reverseGeocode(latitude, longitude);
    
    return {
      coordinates: { latitude, longitude },
      city: geocode.city,
    };
  } catch (error) {
    console.error('Error getting location:', error);
    throw error;
  }
};

export const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<GeocodingResult> => {
  try {
    const geocodeResult = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });
    
    if (geocodeResult.length === 0) {
      throw new Error('No geocoding results found');
    }
    
    const result = geocodeResult[0];
    
    return {
      city: result.city || 'Unknown city',
      region: result.region || '',
      country: result.country || '',
    };
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    throw error;
  }
};
