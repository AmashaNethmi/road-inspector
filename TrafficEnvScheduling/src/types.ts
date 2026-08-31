/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum DefectType {
  POTHOLE = 'pothole',
  CRACK = 'crack',
  RUTTING = 'rutting',
  EROSION = 'erosion',
}

export enum SurfaceType {
  ASPHALT = 'asphalt',
  CONCRETE = 'concrete',
  GRAVEL = 'gravel',
}

export interface DefectDetails {
  location: string;
  coordinates?: { lat: number; lng: number };
  type: DefectType;
  size: {
    length: number;
    width: number;
    depth: number;
  };
  actualSize?: {
    length: number;
    width: number;
    depth: number;
  };
  repairSize?: {
    length: number;
    width: number;
    depth: number;
  };
  finalArea?: number;
  surfaceMaterial: SurfaceType;
  severity: 'low' | 'medium' | 'high';
}

export interface EnvironmentalData {
  weather: {
    condition: string;
    temperature: number;
    precipitationChance: number;
    isOptimal: boolean;
    rainRule?: string;
    skippedDays?: Array<{
      date: string;
      day: string;
      rain_chance: number;
      temp: number;
      reason: string;
    }>;
  };
  traffic: {
    flowLevel: 'low' | 'moderate' | 'high' | 'heavy';
    peakHours: string[];
    isOptimal: boolean;
  };
}

export interface RepairPlan {
  estimatedDurationHours: number;
  suggestedStartTime: string;
  bestTimeRationale: string;
  alternateRoute: string;
  crewRecommendation: {
    workers: number;
    skillLevel: string;
    equipment: string[];
  };
  risks: string[];
  automationRecommendation?: {
    optimalWindow: string;
    confidenceScore: number;
    environmentalImpact: string;
    referenceDatasets: Array<{ name: string; url: string }>;
  };
}

export interface AnalysisResult {
  defect: DefectDetails;
  environment: EnvironmentalData;
  plan: RepairPlan;
}

export interface CitizenReport {
  id: string;
  user: string;
  type: 'Pothole' | 'Crack' | 'Rutting' | 'Erosion';
  location: string;
  coordinates: { lat: number; lng: number };
  timestamp: string;
  status: 'Pending Review' | 'AI Verified' | 'Scheduled' | 'Dispatched' | 'Completed';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  image: string;
  description: string;
  actualSizeM3: number;
  repairSizeM3: number;
  roadType: SurfaceType;
}

export type NavigationTab = 
  | 'plan'
  | 'citizen'
  | 'weather'
  | 'traffic'
  | 'scheduling'
  | 'routing'
  | 'evaluation'
  | 'analytics'
  | 'compliance'
  | 'history'
  | 'tester';
