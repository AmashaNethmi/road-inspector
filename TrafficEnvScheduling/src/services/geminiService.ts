import { AnalysisResult, DefectDetails, EnvironmentalData } from "../types";

export async function analyzeRepair(
  defect: DefectDetails,
  environment: EnvironmentalData
): Promise<AnalysisResult> {
  
  try {
    const response = await fetch('http://localhost:8001/predict_plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: defect.location,
        coordinates: defect.coordinates,
        type: defect.type,
        length: defect.size.length,
        width: defect.size.width,
        depth: defect.size.depth,
        severity: defect.severity,
        temperature: environment.weather.temperature
      })
    });
    
    if (!response.ok) {
      throw new Error(`Backend returned status ${response.status}`);
    }
    
    const plan = await response.json();
    
    return {
      defect,
      environment,
      plan
    };
  } catch (error) {
    console.error("Failed to connect to the Random Forest backend. Ensure it is running on port 8000.", error);
    throw new Error("Could not connect to the planning engine.");
  }
}

export async function fetchHistory(): Promise<any[]> {
  try {
    const response = await fetch('http://localhost:8001/history');
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch history:', error);
    return [];
  }
}

export async function searchLocation(query: string): Promise<{ lat: number, lng: number, display_name: string } | null> {
  try {
    const response = await fetch(`http://localhost:8001/geocode?query=${encodeURIComponent(query)}`);
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
    console.error('Google Maps Geocoding failed:', error);
    return null;
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const response = await fetch(`http://localhost:8001/reverse_geocode?lat=${lat}&lng=${lng}`);
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return data.results[0].formatted_address;
    }
    return null;
  } catch (error) {
    console.error('Google Maps Reverse Geocoding failed:', error);
    return null;
  }
}

export async function autocompleteLocation(query: string): Promise<Array<{ lat: number, lng: number, display_name: string }>> {
  if (!query.trim()) return [];
  
  try {
    const response = await fetch(`http://localhost:8001/geocode?query=${encodeURIComponent(query)}`);
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
    console.error('Google Maps Autocomplete failed:', error);
    return [];
  }
}

export async function calculateRoute(startLat: number, startLng: number, endLat: number, endLng: number): Promise<Array<[number, number]>> {
  try {
    const response = await fetch(`http://localhost:8001/route?startLat=${startLat}&startLng=${startLng}&endLat=${endLat}&endLng=${endLng}`);
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
    console.error('Google Maps Routing failed:', error);
    return [];
  }
}

// Utility to mock environmental data based on location
export function getMockEnvironmentalData(location: string): EnvironmentalData {
  // In a real app, this would call real Weather/Traffic APIs
  const conditions = ['Clear', 'Cloudy', 'Partly Cloudy', 'Rainy'];
  const flows: Array<'low' | 'moderate' | 'high' | 'heavy'> = ['low', 'moderate', 'high', 'heavy'];
  
  const weatherIndex = Math.floor(Math.random() * conditions.length);
  const flowIndex = Math.floor(Math.random() * flows.length);

  return {
    weather: {
      condition: conditions[weatherIndex],
      temperature: 20 + Math.floor(Math.random() * 15),
      precipitationChance: weatherIndex === 3 ? 80 : 10,
      isOptimal: weatherIndex !== 3
    },
    traffic: {
      flowLevel: flows[flowIndex],
      peakHours: ['08:00 - 10:00', '17:00 - 19:00'],
      isOptimal: flowIndex < 2
    }
  };
}
