import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Crosshair, Search } from 'lucide-react';

// Fix for default marker icons in Leaflet with Vite
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number, address?: string) => void;
}

function MapEvents({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number, address?: string) => void }) {
  const [position, setPosition] = useState<L.LatLng | null>(null);

  useMapEvents({
    async click(e) {
      const { lat, lng } = e.latlng;
      setPosition(e.latlng);
      
      // Perform reverse geocode to get address for the clicked point
      const address = await reverseGeocode(lat, lng);
      onLocationSelect(lat, lng, address || undefined);
    },
  });

  return position === null ? null : (
    <Marker position={position} />
  );
}

import { searchLocation, autocompleteLocation, reverseGeocode } from '../services/geminiService';

export default function LocationPicker({ onLocationSelect }: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [map, setMap] = useState<L.Map | null>(null);
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [suggestions, setSuggestions] = useState<Array<{lat: number, lng: number, display_name: string}>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const DEFAULT_CITIES = [
    { display_name: 'Colombo, Sri Lanka', lat: 6.9271, lng: 79.8612 },
    { display_name: 'Kandy, Sri Lanka', lat: 7.2906, lng: 80.6337 },
    { display_name: 'Galle, Sri Lanka', lat: 6.0535, lng: 80.2210 },
    { display_name: 'Jaffna, Sri Lanka', lat: 9.6615, lng: 80.0255 },
    { display_name: 'Negombo, Sri Lanka', lat: 7.2089, lng: 79.8430 }
  ];

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length > 2) {
        const results = await autocompleteLocation(searchQuery);
        if (results.length > 0 && !results.find(r => r.display_name === searchQuery)) {
          setSuggestions(results);
          setShowSuggestions(true);
        } else {
          setShowSuggestions(false);
        }
      } else if (isFocused && searchQuery.trim().length === 0) {
        setSuggestions(DEFAULT_CITIES);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, searchQuery.trim().length > 0 ? 300 : 0);
    return () => clearTimeout(timer);
  }, [searchQuery, isFocused]);

  const handleManualSearch = async () => {
    if (!searchQuery.trim() || !map) return;
    setIsSearching(true);
    
    try {
      const data = await searchLocation(searchQuery);
      if (data) {
        const { lat, lng, display_name } = data;
        const newPos = new L.LatLng(lat, lng);
        map.setView(newPos, 16);
        setPosition(newPos);
        onLocationSelect(lat, lng, display_name);
        setSearchQuery(display_name);
      }
    } catch (error) {
      console.error('AI Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleManualSearch();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs font-mono text-zinc-400 uppercase tracking-wider">
          <Crosshair className="w-4 h-4 text-orange-500" />
          Geo-Location Precision
        </label>
        <span className="text-[10px] text-zinc-500 font-mono">SEARCH OR CLICK MAP</span>
      </div>

      <div className="relative group z-[1001]">
        <div className="relative">
          <input
            type="text"
            placeholder="Search location (e.g. Kandy, Sri Lanka)..."
            className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all pr-12"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              // Delay hiding to allow clicks on suggestions
              setTimeout(() => setIsFocused(false), 200);
            }}
          />
          <button
            type="button"
            onClick={handleManualSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-zinc-800 hover:bg-orange-500 rounded-lg transition-colors"
          >
            {isSearching ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Search className="w-4 h-4 text-zinc-400 group-hover:text-white" />}
          </button>
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl z-[1002]">
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                className="w-full text-left px-4 py-3 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors border-b border-zinc-800/50 last:border-0"
                onClick={() => {
                  const newPos = new L.LatLng(s.lat, s.lng);
                  if (map) map.setView(newPos, 16);
                  setPosition(newPos);
                  onLocationSelect(s.lat, s.lng, s.display_name);
                  setSearchQuery(s.display_name);
                  setShowSuggestions(false);
                }}
              >
                {s.display_name}
              </button>
            ))}
          </div>
        )}
      </div>
      
      <div className="h-[200px] w-full rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-inner relative group">
        <MapContainer 
          center={[6.9271, 79.8612]} 
          zoom={13} 
          scrollWheelZoom={false}
          className="h-full w-full"
          ref={setMap}
        >
          <TileLayer
            url={`https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}`}
            attribution='&copy; <a href="https://maps.google.com/">Google Maps</a>'
          />
          <MapEvents onLocationSelect={(lat, lng, address) => {
            setPosition(new L.LatLng(lat, lng));
            onLocationSelect(lat, lng, address);
            setShowSuggestions(false);
          }} />
          {position && <Marker position={position} />}
        </MapContainer>
        
        <div className="absolute top-2 right-2 z-[1000] pointer-events-none">
          <div className="px-2 py-1 bg-black/60 backdrop-blur-md rounded border border-white/10 text-[9px] font-mono text-orange-400">
            SATELLITE_LOCK: ACTIVE
          </div>
        </div>
      </div>
    </div>
  );
}
