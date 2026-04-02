import axios from 'axios';

const OSRM_BASE_URL = 'http://router.project-osrm.org/route/v1/driving';

export interface RouteInfo {
  distance: number; // in meters
  duration: number; // in seconds
}

export const getRouteInfo = async (
  pickupLat: number,
  pickupLng: number,
  dropoffLat: number,
  dropoffLng: number
): Promise<RouteInfo | null> => {
  try {
    const coords = `${pickupLng},${pickupLat};${dropoffLng},${dropoffLat}`;
    const url = `${OSRM_BASE_URL}/${coords}?overview=false`;
    const response = await axios.get(url);

    if (response.data && response.data.routes && response.data.routes.length > 0) {
      const { distance, duration } = response.data.routes[0];
      return { distance, duration };
    }
    return null;
  } catch (error) {
    console.error('OSRM Error:', error);
    return null;
  }
};
