import { AnalysisResult, DefectDetails, EnvironmentalData } from "../types";

const getApiBase = () => {
  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  return `http://${host}:8002`;
};
const API_BASE = getApiBase();

export async function analyzeRepair(
  defect: DefectDetails
): Promise<AnalysisResult> {
  
  try {
    const response = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(defect)
    });
    
    if (!response.ok) {
      throw new Error(`Backend returned status ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Failed to connect to the Advanced ML backend. Ensure it is running on port 8002.", error);
    throw new Error("Could not connect to the planning engine.");
  }
}

export async function fetchHistory(): Promise<any[]> {
  try {
    const response = await fetch(`${API_BASE}/history`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch history:', error);
    return [];
  }
}

export async function searchLocation(query: string): Promise<{ lat: number, lng: number, display_name: string } | null> {
  try {
    const response = await fetch(`${API_BASE}/geocode?query=${encodeURIComponent(query)}`);
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      return {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        display_name: result.formatted_address || query
      };
    }
    return null;
  } catch (error) {
    console.error('Local Geocoding failed:', error);
    return null;
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE}/reverse_geocode?lat=${lat}&lng=${lng}`);
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return data.results[0].formatted_address;
    }
    return null;
  } catch (error) {
    console.error('Local Reverse Geocoding failed:', error);
    return null;
  }
}

export async function autocompleteLocation(query: string): Promise<Array<{ lat: number, lng: number, display_name: string }>> {
  if (!query.trim()) return [];
  
  try {
    const response = await fetch(`${API_BASE}/geocode?query=${encodeURIComponent(query)}`);
    if (!response.ok) return [];
    
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return data.results.slice(0, 5).map((result: any) => ({
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        display_name: result.formatted_address
      }));
    }
    return [];
  } catch (error) {
    console.error('Local Autocomplete failed:', error);
    return [];
  }
}

export async function calculateRoute(startLat: number, startLng: number, endLat: number, endLng: number): Promise<Array<[number, number]>> {
  try {
    const response = await fetch(`${API_BASE}/route?startLat=${startLat}&startLng=${startLng}&endLat=${endLat}&endLng=${endLng}`);
    if (!response.ok) return [];
    
    const data = await response.json();
    if (data.routes && data.routes.length > 0) {
      const steps = data.routes[0].legs[0].steps;
      const points: Array<[number, number]> = [];
      
      points.push([startLat, startLng]);
      steps.forEach((step: any) => {
        points.push([step.start_location.lat, step.start_location.lng]);
        points.push([step.end_location.lat, step.end_location.lng]);
      });
      points.push([endLat, endLng]);
      
      return points;
    }
    return [];
  } catch (error) {
    console.error('Local Routing failed:', error);
    return [];
  }
}

// Mock utility removed as the ML backend now handles environmental modeling.
