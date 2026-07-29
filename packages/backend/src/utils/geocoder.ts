import axios from 'axios';

const PHOTON_URL = 'https://photon.komoot.io/api/';

export interface AddressSuggestion {
  name: string;
  city?: string;
  country?: string;
  lat: number;
  lng: number;
  fullAddress: string;
}

export const searchAddress = async (query: string, limit: number = 5): Promise<AddressSuggestion[]> => {
  if (!query || query.length < 3) return [];
  
  try {
    const response = await axios.get(PHOTON_URL, {
      params: { q: query, limit }
    });

    if (response.data && response.data.features) {
      return response.data.features.map((f: any) => {
        const { name, city, country } = f.properties;
        const [lng, lat] = f.geometry.coordinates;
        const address = [name, city, country].filter(Boolean).join(', ');
        
        return {
          name: name || 'Unknown',
          city,
          country,
          lat,
          lng,
          fullAddress: address,
        };
      });
    }
    return [];
  } catch (error) {
    console.error('Geocoder Error:', error);
    return [];
  }
};
