let googleMapsPromise = null;

/**
 * Dynamically loads Google Maps JavaScript API SDK if VITE_GOOGLE_MAPS_API_KEY is configured
 */
export function loadGoogleMaps(apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
  if (window.google && window.google.maps) {
    return Promise.resolve(window.google.maps);
  }
  if (!apiKey) {
    return Promise.reject(new Error("Google Maps API key not configured."));
  }
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}
