import * as Location from 'expo-location';

interface GeocodingResult {
  city: string;
  region: string;
  country: string;
}

export const CITY_OPTIONS = [
  'Chicago',
  'Houston',
  'London',
  'Los Angeles',
  'Melbourne',
  'New York',
  'Sydney',
  'Toronto',
  'Vancouver',
];

// Type for city coordinates map
type CityCoordinates = {
  [key in typeof CITY_OPTIONS[number]]: { latitude: number; longitude: number };
};

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

export const setSelectedCity = (city: string): {
  coordinates: { latitude: number; longitude: number };
  city: string;
} => {
  // For simplicity, we're using dummy coordinates for each city
  // In a real app, you would use a geocoding service to get actual coordinates
  const dummyCoordinates: CityCoordinates = {
    'Chicago': { latitude: 41.8781, longitude: -87.6298 },
    'Houston': { latitude: 29.7604, longitude: -95.3698 },
    'London': { latitude: 51.5074, longitude: -0.1278 },
    'Los Angeles': { latitude: 34.0522, longitude: -118.2437 },
    'Melbourne': { latitude: -37.8136, longitude: 144.9631 },
    'New York': { latitude: 40.7128, longitude: -74.0060 },
    'Sydney': { latitude: -33.8688, longitude: 151.2093 },
    'Toronto': { latitude: 43.6532, longitude: -79.3832 },
    'Vancouver': { latitude: 49.2827, longitude: -123.1207 },
  };
  
  // Default to New York if city is not in our list
  const defaultCoordinates = { latitude: 40.7128, longitude: -74.0060 };
  
  return {
    coordinates: dummyCoordinates[city as keyof CityCoordinates] || defaultCoordinates,
    city,
  };
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
