import { loadGoogleMaps } from './googleMapsLoader';

// Exact Baharagora Store Location (Dadu Complex, near Shitla Mandir, Baharagora, Jharkhand 832101)
export const BAHARAGORA_HUB = {
  lat: 22.2825,
  lng: 86.7235,
  name: 'The Grocery Hub Store',
  address: 'Dadu Complex, Near Shitla Mandir, Baharagora, Jharkhand - 832101',
  pincode: '832101'
};

// Maximum Allowed Delivery Radius Limit (in Kilometers)
export const MAX_DELIVERY_RADIUS_KM = 5.0;

/**
 * Calculates Haversine distance in kilometers between two coordinates (lat1, lon1) and (lat2, lon2)
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // 2 decimal places
}

/**
 * Checks if a customer location is within the 5 km Baharagora delivery zone
 */
export function checkDeliveryServiceable(lat, lng) {
  if (!lat || !lng) {
    return {
      isServiceable: true,
      distanceKm: 0,
      radiusLimitKm: MAX_DELIVERY_RADIUS_KM,
      diffKm: 0
    };
  }

  const distanceKm = calculateDistance(BAHARAGORA_HUB.lat, BAHARAGORA_HUB.lng, lat, lng);
  const isServiceable = distanceKm <= MAX_DELIVERY_RADIUS_KM;

  return {
    isServiceable,
    distanceKm,
    radiusLimitKm: MAX_DELIVERY_RADIUS_KM,
    diffKm: Math.round((distanceKm - MAX_DELIVERY_RADIUS_KM) * 100) / 100
  };
}

/**
 * Calculates Estimated Time of Arrival (ETA) based on average urban rider speed (25 km/h)
 */
export function calculateETA(distanceKm, averageSpeedKmH = 25) {
  if (!distanceKm || distanceKm <= 0) return '5-10 mins';
  const hours = distanceKm / averageSpeedKmH;
  const minutes = Math.max(3, Math.ceil(hours * 60) + 4); // +4 mins buffer for packing/pickup
  return `~${minutes} mins`;
}

/**
 * Resolves coordinates for customer addresses using Google Maps Geocoder if exact lat/lng is missing.
 */
export async function resolveOrderCoordinates(order) {
  // 1. If order already has direct exact lat/lng (From "Use Current Location")
  if (order.lat && order.lng) {
    return { lat: parseFloat(order.lat), lng: parseFloat(order.lng) };
  }
  if (order.customerCoords && order.customerCoords.lat && order.customerCoords.lng) {
    return { lat: parseFloat(order.customerCoords.lat), lng: parseFloat(order.customerCoords.lng) };
  }

  // 2. Geocode the address text using Google Maps
  const addressString = order.address || order.customerAddress || order.deliveryAddress || 'Baharagora, Jharkhand';
  
  try {
    const maps = await loadGoogleMaps();
    const geocoder = new maps.Geocoder();
    
    return new Promise((resolve) => {
      geocoder.geocode({ address: addressString }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          resolve({
            lat: location.lat(),
            lng: location.lng()
          });
        } else {
          console.warn(`Geocode failed for address: ${addressString}. Status: ${status}`);
          // Fallback to Baharagora Hub if geocoding completely fails
          resolve({ lat: BAHARAGORA_HUB.lat, lng: BAHARAGORA_HUB.lng });
        }
      });
    });
  } catch (err) {
    console.error("Error loading Google Maps for Geocoding:", err);
    return { lat: BAHARAGORA_HUB.lat, lng: BAHARAGORA_HUB.lng };
  }
}

/**
 * Generates initial rider coordinates halfway between Store Hub and Customer Location
 */
export function getInitialRiderCoordinates(customerLat, customerLng) {
  const storeLat = BAHARAGORA_HUB.lat;
  const storeLng = BAHARAGORA_HUB.lng;

  return {
    lat: Math.round(((storeLat + customerLat) / 2) * 10000) / 10000,
    lng: Math.round(((storeLng + customerLng) / 2) * 10000) / 10000
  };
}
