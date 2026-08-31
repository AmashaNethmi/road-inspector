import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Target, Navigation2, Loader2, RefreshCw, MapPin, AlertTriangle } from 'lucide-react';
import { searchLocation, calculateRoute } from '../services/mlService';

// Fix for default marker icons
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom pulsing work zone icon
const workZoneIcon = L.divIcon({
  className: 'custom-workzone-marker',
  html: `<div class="relative flex items-center justify-center">
    <div class="absolute w-8 h-8 rounded-full bg-orange-500/40 animate-ping"></div>
    <div class="w-4 h-4 rounded-full bg-orange-500 border-2 border-white shadow-lg shadow-orange-500/50"></div>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 14);
  }, [center, map]);
  return null;
}

function MapClickEvents({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

export default function MapPreview({
  location,
  coordinates,
  alternateRoute
}: {
  location: string;
  coordinates?: { lat: number; lng: number };
  alternateRoute: string;
}) {
  const [routePath, setRoutePath] = useState<Array<[number, number]>>([]);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [userClosureLocation, setUserClosureLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [activeBypassText, setActiveBypassText] = useState<string>(alternateRoute);
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    coordinates ? [coordinates.lat, coordinates.lng] : [6.9271, 79.8612]
  );

  const activeCoords = userClosureLocation || (coordinates ? { lat: coordinates.lat, lng: coordinates.lng } : null);

  useEffect(() => {
    setActiveBypassText(alternateRoute);
  }, [alternateRoute]);

  useEffect(() => {
    const fetchRoute = async () => {
      setLoadingRoute(true);
      try {
        let startLat = activeCoords?.lat;
        let startLng = activeCoords?.lng;

        if (!startLat || !startLng) {
          const loc = await searchLocation(location);
          if (loc) {
            startLat = loc.lat;
            startLng = loc.lng;
          }
        }

        if (startLat && startLng) {
          setMapCenter([startLat, startLng]);

          // Bypass route perimeter calculation
          const startPtLat = startLat - 0.002;
          const startPtLng = startLng - 0.002;
          const endPtLat = startLat + 0.002;
          const endPtLng = startLng + 0.002;

          const path = await calculateRoute(startPtLat, startPtLng, endPtLat, endPtLng);

          if (path.length > 0) {
            setRoutePath(path);
          } else {
            setRoutePath([
              [startPtLat, startPtLng],
              [startLat - 0.001, startLng + 0.003],
              [startLat + 0.002, startLng + 0.002],
              [endPtLat, endPtLng]
            ]);
          }

          if (userClosureLocation) {
            try {
              const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
              const revRes = await fetch(`http://${host}:8002/reverse_geocode?lat=${startLat}&lng=${startLng}`);
              if (revRes.ok) {
                const geoData = await revRes.json();
                const addressName = geoData.results?.[0]?.formatted_address || "Local Road";
                setActiveBypassText(`Simulated dynamic bypass computed around closure on ${addressName}`);
              }
            } catch (e) {
              setActiveBypassText(`Dynamic detour perimeter calculated around coordinates [${startLat.toFixed(4)}, ${startLng.toFixed(4)}]`);
            }
          }
        }
      } catch (err) {
        console.error("Map route generation error:", err);
      } finally {
        setLoadingRoute(false);
      }
    };

    fetchRoute();
  }, [location, coordinates, userClosureLocation]);

  const handleMapClick = (lat: number, lng: number) => {
    setUserClosureLocation({ lat, lng });
  };

  const handleResetClosure = () => {
    setUserClosureLocation(null);
    if (coordinates) {
      setMapCenter([coordinates.lat, coordinates.lng]);
    }
    setActiveBypassText(alternateRoute);
  };

  return (
    <div className="glass-panel rounded-2xl border border-zinc-800/80 overflow-hidden flex flex-col space-y-3 p-4">
      {/* Map Control Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/60 pb-3">
        <div className="flex items-center gap-2">
          <Navigation2 className="w-4 h-4 text-sky-400" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">
            Interactive GIS Bypass & Detour Map
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {userClosureLocation && (
            <button
              onClick={handleResetClosure}
              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-orange-400 text-[11px] font-mono rounded border border-zinc-700 transition-colors flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Reset Pin
            </button>
          )}

          <div className="flex items-center gap-2 text-[10px] font-mono">
            <span className="flex items-center gap-1 text-orange-400">
              <span className="w-2 h-2 rounded-full bg-orange-500" /> Work Zone
            </span>
            <span className="flex items-center gap-1 text-sky-400">
              <span className="w-2 h-2 rounded-full bg-sky-400" /> Bypass Detour
            </span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative w-full h-[320px] rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
        <MapContainer
          center={mapCenter}
          zoom={14}
          scrollWheelZoom={true}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapUpdater center={mapCenter} />
          <MapClickEvents onSelect={handleMapClick} />

          {/* Work Zone / Defect Marker */}
          {activeCoords && (
            <Marker position={[activeCoords.lat, activeCoords.lng]} icon={workZoneIcon}>
              <Popup>
                <div className="text-xs font-mono p-1">
                  <div className="font-bold text-orange-400 mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Active Work Zone Closure
                  </div>
                  <div className="text-zinc-300">{location}</div>
                  <div className="text-[10px] text-zinc-500 mt-1">
                    Lat: {activeCoords.lat.toFixed(6)}, Lng: {activeCoords.lng.toFixed(6)}
                  </div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Dynamic Detour Bypass Route */}
          {routePath.length > 0 && (
            <Polyline
              positions={routePath}
              pathOptions={{
                color: '#38bdf8',
                weight: 4,
                opacity: 0.85,
                dashArray: '8, 8',
                className: 'animate-dash'
              }}
            />
          )}
        </MapContainer>

        {loadingRoute && (
          <div className="absolute top-3 right-3 bg-zinc-950/90 border border-zinc-800 px-3 py-1.5 rounded-lg text-[10px] font-mono text-sky-400 flex items-center gap-1.5 shadow-lg z-[1000]">
            <Loader2 className="w-3 h-3 animate-spin" />
            Calculating Detour Graph...
          </div>
        )}

        {/* Tip Tag */}
        <div className="absolute bottom-3 left-3 bg-zinc-950/90 border border-zinc-800 px-3 py-1.5 rounded-lg text-[10px] font-mono text-zinc-400 z-[1000] flex items-center gap-1.5">
          <Target className="w-3 h-3 text-orange-400" />
          Click anywhere on map to simulate custom road closure
        </div>
      </div>

      {/* Bypass Direction Text */}
      <div className="bg-zinc-950/70 p-3 rounded-xl border border-zinc-800/80 text-xs font-mono text-zinc-300 flex items-center gap-2">
        <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
        <span className="truncate">{activeBypassText}</span>
      </div>
    </div>
  );
}
