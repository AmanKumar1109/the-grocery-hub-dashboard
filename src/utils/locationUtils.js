// Baharagora Central Grocery Hub Coordinates (Baharagora, Jharkhand, India)
export const BAHARAGORA_HUB = {
  lat: 22.2813,
  lng: 86.7225,
  name: 'Baharagora Grocery Hub Store',
  address: 'Main Market, Baharagora, East Singhbhum, Jharkhand - 832301'
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
 * Resolves or generates deterministic coordinates around Baharagora for customer addresses
 */
export function resolveOrderCoordinates(order) {
  // If order already has direct lat/lng
  if (order.lat && order.lng) {
    return { lat: parseFloat(order.lat), lng: parseFloat(order.lng) };
  }
  if (order.customerCoords && order.customerCoords.lat && order.customerCoords.lng) {
    return { lat: parseFloat(order.customerCoords.lat), lng: parseFloat(order.customerCoords.lng) };
  }

  // Generate deterministic offset coordinates based on order ID or address hash
  const str = String(order.id || order.customerAddress || 'order-101');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }

  // Create offsets within 1.2 to 6.5 km of Baharagora
  const angle = Math.abs(hash % 360) * (Math.PI / 180);

  // Intentional mix: most within 5km, some slightly beyond 5km to test constraint!
  const isBeyond = Math.abs(hash % 10) === 0;
  const radiusKm = isBeyond ? 5.8 + (Math.abs(hash % 15) / 10) : 1.2 + (Math.abs(hash % 35) / 10);

  // 1 deg lat ~ 111 km, 1 deg lng ~ 111 * cos(lat) km
  const latOffset = (radiusKm / 111) * Math.sin(angle);
  const lngOffset = (radiusKm / (111 * Math.cos(BAHARAGORA_HUB.lat * (Math.PI / 180)))) * Math.cos(angle);

  return {
    lat: Math.round((BAHARAGORA_HUB.lat + latOffset) * 10000) / 10000,
    lng: Math.round((BAHARAGORA_HUB.lng + lngOffset) * 10000) / 10000
  };
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
