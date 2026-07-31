import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  MapPin,
  Truck,
  Phone,
  User,
  ShieldCheck,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Navigation,
  Clock,
  Building2,
  CheckCircle2,
  PhoneCall
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  BAHARAGORA_HUB,
  MAX_DELIVERY_RADIUS_KM,
  calculateDistance,
  checkDeliveryServiceable,
  calculateETA,
  resolveOrderCoordinates,
  getInitialRiderCoordinates
} from '../utils/locationUtils';
import { fetchRoadRoute, routePointsToLatLngs, getPointAlongRoute } from '../utils/routeService';

export default function DeliveryMapModal({ order, onClose }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const riderMarkerRef = useRef(null);
  const routePolylineRef = useRef(null);

  // Road route points stored for simulation interpolation
  const routePointsRef = useRef([]);

  // Movement simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simProgress, setSimProgress] = useState(0.4); // 40% along route by default
  const [simSpeed, setSimSpeed] = useState(1);
  const simIntervalRef = useRef(null);

  const [customerCoords, setCustomerCoords] = useState(null);
  const [initialRiderCoords, setInitialRiderCoords] = useState(null);
  const [serviceCheck, setServiceCheck] = useState(null);

  const [currentRiderPos, setCurrentRiderPos] = useState(null);
  const [roadDistance, setRoadDistance] = useState(null);
  const [roadDuration, setRoadDuration] = useState(null);

  useEffect(() => {
    let active = true;
    resolveOrderCoordinates(order).then(coords => {
      if (!active) return;
      setCustomerCoords(coords);
      setServiceCheck(checkDeliveryServiceable(coords.lat, coords.lng));

      const initialRider = order.riderLocation && order.riderLocation.lat
        ? { lat: order.riderLocation.lat, lng: order.riderLocation.lng }
        : getInitialRiderCoordinates(coords.lat, coords.lng);
        
      setInitialRiderCoords(initialRider);
      setCurrentRiderPos(initialRider);
    });
    return () => { active = false; };
  }, [order]);

  // Sync rider position when order.riderLocation updates in Firestore
  useEffect(() => {
    if (order.riderLocation && order.riderLocation.lat && order.riderLocation.lng) {
      const livePos = { lat: order.riderLocation.lat, lng: order.riderLocation.lng };
      setCurrentRiderPos(livePos);

      if (riderMarkerRef.current) {
        riderMarkerRef.current.setLatLng([livePos.lat, livePos.lng]);
      }
    }
  }, [order.riderLocation]);

  const distanceToCustomer = currentRiderPos && customerCoords ? calculateDistance(
    currentRiderPos.lat,
    currentRiderPos.lng,
    customerCoords.lat,
    customerCoords.lng
  ) : 0;

  const currentETA = roadDuration ? `~${roadDuration} mins` : calculateETA(distanceToCustomer);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || !customerCoords || !initialRiderCoords || !serviceCheck) return;

    // Destroy existing instance if present
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Center map midway between Store and Customer
    const centerLat = (BAHARAGORA_HUB.lat + customerCoords.lat) / 2;
    const centerLng = (BAHARAGORA_HUB.lng + customerCoords.lng) / 2;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 13,
      zoomControl: true
    });

    mapInstanceRef.current = map;

    // Tile layer (Google Maps Standard Roadmap)
    L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; Google Maps'
    }).addTo(map);

    // 1. Draw 5 KM Geofence Circle around Baharagora Hub
    const isServiceable = serviceCheck.isServiceable;
    const geofenceCircle = L.circle([BAHARAGORA_HUB.lat, BAHARAGORA_HUB.lng], {
      radius: MAX_DELIVERY_RADIUS_KM * 1000, // 5000m
      color: isServiceable ? '#10b981' : '#f43f5e',
      fillColor: isServiceable ? '#10b981' : '#f43f5e',
      fillOpacity: 0.08,
      weight: 2,
      dashArray: '8, 8'
    }).addTo(map);

    geofenceCircle.bindPopup(`
      <div style="font-family: sans-serif; font-size: 12px; font-weight: bold; text-align: center;">
        <span style="color: ${isServiceable ? '#059669' : '#e11d48'};">
          ${isServiceable ? '✅ 5 KM Baharagora Delivery Zone' : '⚠️ 5 KM Delivery Radius Limit'}
        </span>
        <br/>
        <span style="font-weight: normal; color: #64748b;">All deliveries within 5km of Baharagora Hub are serviced.</span>
      </div>
    `);

    // Custom SVG HTML Icons
    const createCustomIcon = (svgContent, bgColor, borderColor = 'white') => {
      return L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="
            background: ${bgColor};
            border: 3px solid ${borderColor};
            width: 38px;
            height: 38px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.25);
          ">
            ${svgContent}
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
        popupAnchor: [0, -20]
      });
    };

    // Store Marker Icon
    const storeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M10 12h4"/></svg>`;
    const storeIcon = createCustomIcon(storeSvg, '#059669');

    // Rider Scooter Marker Icon
    const riderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.5a2.5 2.5 0 0 0-2.5-2.5H14"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>`;
    const riderIcon = createCustomIcon(riderSvg, '#f59e0b', '#78350f');

    // Customer Home Marker Icon
    const customerSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>`;
    const customerIcon = createCustomIcon(customerSvg, serviceCheck.isServiceable ? '#2563eb' : '#e11d48');

    // 2. Add Store Marker
    const storeMarker = L.marker([BAHARAGORA_HUB.lat, BAHARAGORA_HUB.lng], { icon: storeIcon }).addTo(map);
    storeMarker.bindPopup(`
      <div style="font-family: sans-serif; padding: 4px;">
        <strong style="color: #059669; font-size: 13px;">🏪 ${BAHARAGORA_HUB.name}</strong>
        <p style="margin: 4px 0 0; font-size: 11px; color: #475569;">${BAHARAGORA_HUB.address}</p>
      </div>
    `);

    // 3. Add Customer Marker
    const customerMarker = L.marker([customerCoords.lat, customerCoords.lng], { icon: customerIcon }).addTo(map);
    customerMarker.bindPopup(`
      <div style="font-family: sans-serif; padding: 4px;">
        <strong style="color: #1e293b; font-size: 13px;">👤 Customer: ${order.customerName || 'Valued Customer'}</strong>
        <p style="margin: 4px 0 0; font-size: 11px; color: #475569;">📍 ${order.customerAddress || 'Baharagora'}</p>
        <p style="margin: 4px 0 0; font-size: 11px; font-weight: bold; color: ${serviceCheck.isServiceable ? '#059669' : '#e11d48'};">
          Distance from Hub: ${serviceCheck.distanceKm} km (${serviceCheck.isServiceable ? 'Within 5km Zone' : 'Beyond 5km Limit!'})
        </p>
      </div>
    `);

    // 4. Add Delivery Rider Marker
    const riderMarker = L.marker([initialRiderCoords.lat, initialRiderCoords.lng], { icon: riderIcon }).addTo(map);
    riderMarkerRef.current = riderMarker;

    const riderName = order.deliveryPartnerName || order.staffName || 'Delivery Partner';
    riderMarker.bindPopup(`
      <div style="font-family: sans-serif; padding: 4px;">
        <strong style="color: #d97706; font-size: 13px;">🛵 Delivery Partner: ${riderName}</strong>
        <p style="margin: 4px 0 0; font-size: 11px; color: #475569;">Status: Delivery On The Way</p>
      </div>
    `);

    // 5. Draw initial straight line placeholder while road route loads
    const initialPolyline = L.polyline(
      [
        [BAHARAGORA_HUB.lat, BAHARAGORA_HUB.lng],
        [initialRiderCoords.lat, initialRiderCoords.lng],
        [customerCoords.lat, customerCoords.lng]
      ],
      {
        color: '#059669',
        weight: 5,
        opacity: 0.7,
        dashArray: '8, 8'
      }
    ).addTo(map);

    routePolylineRef.current = initialPolyline;

    // 6. Fetch real road route from Google Maps Directions API
    fetchRoadRoute(
      { lat: BAHARAGORA_HUB.lat, lng: BAHARAGORA_HUB.lng },
      { lat: customerCoords.lat, lng: customerCoords.lng }
    ).then(result => {
      if (!mapInstanceRef.current) return;

      // Store the route points for simulation interpolation
      routePointsRef.current = result.points;

      // Remove placeholder straight line
      if (routePolylineRef.current) {
        routePolylineRef.current.remove();
      }

      const latLngs = routePointsToLatLngs(result.points);

      // Draw the real road-following polyline
      const roadPolyline = L.polyline(latLngs, {
        color: '#059669',
        weight: 5,
        opacity: 0.85,
        lineJoin: 'round',
        lineCap: 'round'
      }).addTo(mapInstanceRef.current);

      routePolylineRef.current = roadPolyline;

      if (result.success) {
        setRoadDistance(result.totalDistanceKm);
        setRoadDuration(result.totalDurationMins);
      }

      // Fit map bounds to the route
      if (latLngs.length > 0) {
        const routeBounds = L.latLngBounds(latLngs);
        mapInstanceRef.current.fitBounds(routeBounds, { padding: [60, 60] });
      }
    });

    // Fit Map Bounds to fit all 3 points nicely
    const bounds = L.latLngBounds([
      [BAHARAGORA_HUB.lat, BAHARAGORA_HUB.lng],
      [customerCoords.lat, customerCoords.lng],
      [initialRiderCoords.lat, initialRiderCoords.lng]
    ]);
    map.fitBounds(bounds, { padding: [60, 60] });

    // Invalidate map size after DOM layout to guarantee tiles render fully
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [order.id, customerCoords]);

  // Movement Simulation Effect
  useEffect(() => {
    if (isSimulating) {
      simIntervalRef.current = setInterval(() => {
        setSimProgress(prev => {
          if (prev >= 0.98) {
            setIsSimulating(false);
            return 1.0;
          }
          return prev + 0.02 * simSpeed;
        });
      }, 500);
    } else {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    }
    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, [isSimulating, simSpeed]);

  // Update rider position based on progress ratio (0.0 to 1.0)
  // Now follows the road route instead of a straight line
  useEffect(() => {
    let roundedPos;

    if (routePointsRef.current.length > 2) {
      // Interpolate along the real road route
      const roadPos = getPointAlongRoute(routePointsRef.current, simProgress);
      roundedPos = {
        lat: Math.round(roadPos.lat * 10000) / 10000,
        lng: Math.round(roadPos.lng * 10000) / 10000
      };
    } else {
      // Fallback to straight line interpolation
      const lat = BAHARAGORA_HUB.lat + (customerCoords.lat - BAHARAGORA_HUB.lat) * simProgress;
      const lng = BAHARAGORA_HUB.lng + (customerCoords.lng - BAHARAGORA_HUB.lng) * simProgress;
      roundedPos = {
        lat: Math.round(lat * 10000) / 10000,
        lng: Math.round(lng * 10000) / 10000
      };
    }

    setCurrentRiderPos(roundedPos);

    if (riderMarkerRef.current) {
      riderMarkerRef.current.setLatLng([roundedPos.lat, roundedPos.lng]);
    }
  }, [simProgress, customerCoords]);

  const riderName = order.deliveryPartnerName || order.staffName || 'Delivery Partner';
  const riderPhone = order.deliveryPartnerPhone || order.staffPhone || '+91 98765 43210';

  if (!customerCoords || !initialRiderCoords || !serviceCheck) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
        <div className="bg-white w-full max-w-4xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col h-[600px] items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-emerald-500 mb-4"></div>
          <h3 className="text-lg font-black text-slate-800">Locating Delivery Map...</h3>
          <p className="text-sm text-slate-500 font-bold mt-1">Generating precise route from Geocoding API.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white w-full max-w-4xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Navigation className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">Live Delivery Tracking</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[11px]">
                  Order #{order.id}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Baharagora 5 KM Delivery Zone & Live Rider Navigation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Serviceability Badge */}
            {serviceCheck.isServiceable ? (
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                {serviceCheck.distanceKm} km (Within 5 km Zone)
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                {serviceCheck.distanceKm} km (Exceeds 5 km Limit!)
              </span>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* HUD Bar (Distance, ETA & Simulation Controls) */}
        <div className="bg-slate-800 text-slate-200 px-6 py-3 border-b border-slate-700 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">ETA to Customer</span>
                <span className="text-xs font-black text-amber-400">{currentETA}</span>
              </div>
            </div>

            <div className="h-6 w-px bg-slate-700" />

            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Remaining Distance</span>
                <span className="text-xs font-extrabold text-emerald-400">{distanceToCustomer.toFixed(2)} km</span>
              </div>
            </div>

            <div className="h-6 w-px bg-slate-700" />

            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Store Hub</span>
                <span className="text-xs font-bold text-slate-200">Baharagora Main Market</span>
              </div>
            </div>
          </div>

          {/* Simulation Controls */}
          <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700">
            <span className="text-[11px] text-slate-400 font-bold">Rider Movement:</span>
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isSimulating
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isSimulating ? 'Pause' : 'Simulate'}
            </button>

            <button
              onClick={() => {
                setIsSimulating(false);
                setSimProgress(0);
              }}
              className="p-1 text-slate-400 hover:text-slate-200"
              title="Reset Rider Position to Store"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <select
              value={simSpeed}
              onChange={(e) => setSimSpeed(Number(e.target.value))}
              className="bg-slate-800 text-slate-200 text-[11px] font-bold rounded px-1.5 py-0.5 border border-slate-700 focus:outline-none"
            >
              <option value="1">1x Speed</option>
              <option value="2">2x Speed</option>
              <option value="4">4x Speed</option>
            </select>
          </div>
        </div>

        {/* Leaflet Map Body */}
        <div className="relative w-full h-[440px] min-h-[440px] bg-slate-100 overflow-hidden">
          <div ref={mapContainerRef} style={{ width: '100%', height: '440px', minHeight: '440px', zIndex: 1 }} className="w-full h-full" />

          {/* Warning Banner if Customer is Beyond 5 KM */}
          {!serviceCheck.isServiceable && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-rose-600 text-white px-4 py-2 rounded-2xl shadow-xl border border-rose-400 text-xs font-bold flex items-center gap-2 animate-bounce">
              <AlertTriangle className="w-4 h-4 text-white" />
              <span>OUT OF SERVICE RADIUS: Customer address is {serviceCheck.distanceKm} km from Baharagora Store (Exceeds 5 km limit)</span>
            </div>
          )}
        </div>

        {/* Customer & Rider Info Footer Cards */}
        <div className="p-5 bg-white border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Customer Details Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold border border-blue-200">
              <User className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-800 text-xs truncate">
                  Customer: {order.customerName || 'Valued Customer'}
                </h4>
                <a
                  href={`tel:${order.customerPhone || '9876543210'}`}
                  className="px-2 py-0.5 rounded-lg bg-blue-600 text-white font-bold text-[10px] flex items-center gap-1 hover:bg-blue-700"
                >
                  <PhoneCall className="w-3 h-3" /> Call
                </a>
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                📍 {order.customerAddress || 'Baharagora, Jharkhand'}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                Items: {order.items ? order.items.length : 1} products | Payment: {order.paymentMethod || 'COD'} (₹{order.totalAmount || 0})
              </p>
            </div>
          </div>

          {/* Delivery Rider Details Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 font-bold border border-amber-200">
              <Truck className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-800 text-xs truncate">
                  Rider: {riderName}
                </h4>
                <a
                  href={`tel:${riderPhone}`}
                  className="px-2 py-0.5 rounded-lg bg-amber-600 text-white font-bold text-[10px] flex items-center gap-1 hover:bg-amber-700"
                >
                  <PhoneCall className="w-3 h-3" /> Call
                </a>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                📞 {riderPhone} | Vehicle: Hero Electric Scooter
              </p>
              <p className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Active Tracking Synced with Firestore
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
