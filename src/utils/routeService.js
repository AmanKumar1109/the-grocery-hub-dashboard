import { loadGoogleMaps } from './googleMapsLoader';

/**
 * Fetches real road route points from Google Maps Directions API
 * between origin and destination, with optional waypoints.
 * Returns array of {lat, lng} points following actual roads.
 * Falls back to straight line if API fails or is unavailable.
 */
export async function fetchRoadRoute(origin, destination, waypoints = []) {
  try {
    const maps = await loadGoogleMaps();
    const directionsService = new maps.DirectionsService();

    const waypointsList = waypoints.map(wp => ({
      location: new maps.LatLng(wp.lat, wp.lng),
      stopover: false
    }));

    const result = await new Promise((resolve, reject) => {
      directionsService.route(
        {
          origin: new maps.LatLng(origin.lat, origin.lng),
          destination: new maps.LatLng(destination.lat, destination.lng),
          waypoints: waypointsList,
          travelMode: maps.TravelMode.DRIVING,
          optimizeWaypoints: false
        },
        (response, status) => {
          if (status === 'OK') {
            resolve(response);
          } else {
            reject(new Error(`Directions request failed: ${status}`));
          }
        }
      );
    });

    // Extract all path points from route legs for a smooth road-following polyline
    const routePoints = [];
    const route = result.routes[0];

    if (route && route.legs) {
      for (const leg of route.legs) {
        for (const step of leg.steps) {
          const path = step.path;
          for (const point of path) {
            routePoints.push({ lat: point.lat(), lng: point.lng() });
          }
        }
      }
    }

    // Also extract total distance and duration from the directions response
    let totalDistanceMeters = 0;
    let totalDurationSeconds = 0;
    if (route && route.legs) {
      for (const leg of route.legs) {
        totalDistanceMeters += leg.distance.value;
        totalDurationSeconds += leg.duration.value;
      }
    }

    return {
      points: routePoints,
      totalDistanceKm: Math.round((totalDistanceMeters / 1000) * 100) / 100,
      totalDurationMins: Math.ceil(totalDurationSeconds / 60),
      success: true
    };
  } catch (error) {
    console.warn('Road route fetch failed, using straight line fallback:', error.message);

    // Fallback: return straight line points
    const fallbackPoints = [
      { lat: origin.lat, lng: origin.lng },
      ...waypoints,
      { lat: destination.lat, lng: destination.lng }
    ];

    return {
      points: fallbackPoints,
      totalDistanceKm: 0,
      totalDurationMins: 0,
      success: false
    };
  }
}

/**
 * Converts route points array to Leaflet-compatible format [[lat, lng], ...]
 */
export function routePointsToLatLngs(points) {
  return points.map(p => [p.lat, p.lng]);
}

/**
 * Given a route (array of {lat, lng}), find the point at a given progress ratio (0.0 to 1.0)
 * by walking along the polyline segments proportionally.
 */
export function getPointAlongRoute(routePoints, progress) {
  if (!routePoints || routePoints.length === 0) return { lat: 0, lng: 0 };
  if (progress <= 0) return routePoints[0];
  if (progress >= 1) return routePoints[routePoints.length - 1];

  // Calculate total route length
  let totalLength = 0;
  const segmentLengths = [];
  for (let i = 0; i < routePoints.length - 1; i++) {
    const dx = routePoints[i + 1].lat - routePoints[i].lat;
    const dy = routePoints[i + 1].lng - routePoints[i].lng;
    const segLen = Math.sqrt(dx * dx + dy * dy);
    segmentLengths.push(segLen);
    totalLength += segLen;
  }

  if (totalLength === 0) return routePoints[0];

  // Find the target distance along the route
  const targetDist = progress * totalLength;
  let accumulated = 0;

  for (let i = 0; i < segmentLengths.length; i++) {
    if (accumulated + segmentLengths[i] >= targetDist) {
      const remainingInSegment = targetDist - accumulated;
      const segRatio = remainingInSegment / segmentLengths[i];
      return {
        lat: routePoints[i].lat + (routePoints[i + 1].lat - routePoints[i].lat) * segRatio,
        lng: routePoints[i].lng + (routePoints[i + 1].lng - routePoints[i].lng) * segRatio
      };
    }
    accumulated += segmentLengths[i];
  }

  return routePoints[routePoints.length - 1];
}
