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
  surfaceMaterial: SurfaceType;
  severity: 'low' | 'medium' | 'high';
}

export interface EnvironmentalData {
  weather: {
    condition: string;
    temperature: number;
    precipitationChance: number;
    isOptimal: boolean;
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
    referenceDatasets: Array<{name: string, url: string}>;
  };
}

export interface AnalysisResult {
  defect: DefectDetails;
  environment: EnvironmentalData;
  plan: RepairPlan;
}
