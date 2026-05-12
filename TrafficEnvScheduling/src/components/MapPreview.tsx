import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Target, Navigation2, Loader2 } from 'lucide-react';
import { searchLocation, calculateRoute } from '../services/geminiService';

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

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 14);
  }, [center, map]);
  return null;
}

export default function MapPreview({ location, coordinates, alternateRoute }: { location: string; coordinates?: { lat: number, lng: number }; alternateRoute: string }) {
  const [routePath, setRoutePath] = useState<Array<[number, number]>>([]);
  const [loadingRoute, setLoadingRoute] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    coordinates ? [coordinates.lat, coordinates.lng] : [6.9271, 79.8612]
  );

  useEffect(() => {
    const fetchRoute = async () => {
      setLoadingRoute(true);
      try {
        let startLat = coordinates?.lat;
        let startLng = coordinates?.lng;

        // If no coordinates provided, try to geocode the location string
        if (!startLat || !startLng) {
          const loc = await searchLocation(location);
          if (loc) {
            startLat = loc.lat;
            startLng = loc.lng;
          }
        }

        if (startLat && startLng) {
          setMapCenter([startLat, startLng]);
          
          // Create a more substantial "bypass" route around the defect
          // Offset slightly asymmetrically to encourage a more interesting route
          const startPtLat = startLat - 0.005;
          const startPtLng = startLng - 0.006;
          const endPtLat = startLat + 0.005;
          const endPtLng = startLng + 0.006;

          const path = await calculateRoute(
            startPtLat, startPtLng,
            endPtLat, endPtLng
          );
          
          if (path.length > 0) {
            console.log("Route generated successfully:", path.length, "points");
            setRoutePath(path);
          } else {
             console.warn("No route points returned from service, using fallback line");
             // Fallback straight line across the point
             setRoutePath([[startPtLat, startPtLng], [endPtLat, endPtLng]]);
          }
        }
      } catch (e) {
        console.error("Failed to generate route", e);
      } finally {
        setLoadingRoute(false);
      }
    };

    if (coordinates) {
      setMapCenter([coordinates.lat, coordinates.lng]);
    }
    fetchRoute();
  }, [location, coordinates]);

  return (
    <div className="relative w-full h-[300px] bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-900 group">
      
      {loadingRoute && (
        <div className="absolute inset-0 z-[2000] flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-sm">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin mb-4" />
          <span className="text-xs font-mono text-sky-400 uppercase tracking-widest">Calculating Deviation Route...</span>
        </div>
      )}

      <MapContainer 
        center={mapCenter} 
        zoom={14} 
        scrollWheelZoom={false}
        className="h-full w-full z-0"
      >
        <MapUpdater center={mapCenter} />
        <TileLayer
          url={`https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}`}
          attribution='&copy; <a href="https://maps.google.com/">Google Maps</a>'
        />
        
        {coordinates && (
          <Marker 
            position={[coordinates.lat, coordinates.lng]} 
            icon={L.divIcon({
              html: '<div class="w-4 h-4 bg-orange-500 rounded-full border-2 border-white shadow-[0_0_15px_rgba(249,115,22,0.8)] animate-pulse"></div>',
              className: '',
              iconSize: [16, 16],
              iconAnchor: [8, 8]
            })}
          />
        )}

        {routePath.length > 0 && (
          <>
            {/* Outer Glow Path */}
            <Polyline 
              positions={routePath} 
              pathOptions={{ color: '#0ea5e9', weight: 12, opacity: 0.3, lineCap: 'round', lineJoin: 'round' }} 
            />
            {/* Inner Core Path */}
            <Polyline 
              positions={routePath} 
              pathOptions={{ color: '#38bdf8', weight: 5, dashArray: '10, 10', className: 'animate-dash' }} 
            />
            
            <Marker 
              position={routePath[0]} 
              icon={L.divIcon({
                html: '<div class="w-3 h-3 bg-sky-400 rounded-full border-2 border-white"></div>',
                className: '',
                iconSize: [12, 12],
                iconAnchor: [6, 6]
              })}
            />
            <Marker 
              position={routePath[routePath.length - 1]} 
              icon={L.divIcon({
                html: '<div class="w-3 h-3 bg-sky-600 rounded-full border-2 border-white"></div>',
                className: '',
                iconSize: [12, 12],
                iconAnchor: [6, 6]
              })}
            />
          </>
        )}
      </MapContainer>

      {/* Overlay Labels */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end z-[1000] pointer-events-none">
        <div className="bg-zinc-900/90 backdrop-blur-md p-3 rounded-xl border border-zinc-800 shadow-2xl">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-[10px] uppercase font-mono text-zinc-500">Target Location</span>
          </div>
          <div className="text-xs font-medium text-zinc-100">{location || 'Awaiting Coordinates...'}</div>
        </div>
        
        <div className="bg-sky-500/90 backdrop-blur-md p-3 rounded-xl border border-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.3)] max-w-[200px]">
          <div className="flex items-center gap-2 mb-1">
            <Navigation2 className="w-3.5 h-3.5 text-zinc-950 rotate-45" />
            <span className="text-[10px] uppercase font-mono text-zinc-950 font-bold">Deviation Path Engaged</span>
          </div>
          <div className="text-[10px] text-zinc-900 leading-tight truncate font-medium">{alternateRoute || 'Scanning routes...'}</div>
        </div>
      </div>
      
      <div className="absolute top-4 left-4 px-2 py-1 bg-zinc-900/80 backdrop-blur-sm rounded border border-zinc-800 text-[10px] font-mono text-zinc-400 z-[1000] pointer-events-none">
        GOOGLE_MAPS_ROUTING_API: ACTIVE
      </div>
    </div>
  );
}
