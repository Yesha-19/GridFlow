// Central place for config so swapping mock data for the live backend later
// is a one-line change (VITE_USE_MOCK in .env) rather than a code hunt.

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// While the backend team builds the FastAPI service in parallel, the UI runs
// entirely on realistic generated data. Set VITE_USE_MOCK=false in .env once
// /api/predict, /api/routing, and /api/validation are live.
export const USE_MOCK = false;

// Default map view centers on Bengaluru (HQ city for the hackathon).
export const DEFAULT_MAP_CENTER = [12.9716, 77.5946];
export const DEFAULT_MAP_ZOOM = 12;

export const PLANNED_EVENT_TYPES = [
  { value: 'political_rally', label: 'Political Rally', baseWeight: 0.85 },
  { value: 'religious_festival', label: 'Religious Festival', baseWeight: 0.75 },
  { value: 'sports_event', label: 'Sports Event', baseWeight: 0.65 },
  { value: 'cultural_event', label: 'Cultural Event / Concert', baseWeight: 0.55 },
  { value: 'protest_strike', label: 'Protest / Strike', baseWeight: 0.9 },
  { value: 'vip_movement', label: 'VIP Movement', baseWeight: 0.7 },
  { value: 'construction', label: 'Major Construction Work', baseWeight: 0.60 },
];

export const UNPLANNED_EVENT_TYPES = [
  { value: 'accident', label: 'Traffic Accident', baseWeight: 0.85 },
  { value: 'vehicle_breakdown', label: 'Vehicle Breakdown', baseWeight: 0.50 },
  { value: 'tree_fall', label: 'Tree Fall', baseWeight: 0.75 },
  { value: 'waterlogging', label: 'Waterlogging / Flooding', baseWeight: 0.80 },
  { value: 'road_damage', label: 'Road Damage / Pothole', baseWeight: 0.60 },
  { value: 'fire', label: 'Fire Incident', baseWeight: 0.90 },
];

// Astram Dataset Specific Top Hotspots
export const DATASET_LOCATIONS = [
  { name: 'Mysore Road Corridor', lat: 12.9400, lng: 77.5300 },
  { name: 'Bellary Road Junction', lat: 13.0450, lng: 77.5850 },
  { name: 'Tumkur Road (Peenya)', lat: 13.0300, lng: 77.5300 },
  { name: 'Hosur Road / Silk Board', lat: 12.9176, lng: 77.6238 },
  { name: 'Outer Ring Road (East)', lat: 12.9350, lng: 77.6800 },
  { name: 'Old Madras Road', lat: 12.9900, lng: 77.6500 },
  { name: 'Magadi Road', lat: 12.9750, lng: 77.5300 },
  { name: 'Whitefield Area', lat: 12.9698, lng: 77.7500 },
];

export const RISK_LEVELS = {
  low: {
    label: 'Low',
    color: '#2FD480',
    textClass: 'text-risk-low',
    bgClass: 'bg-risk-low',
    softBgClass: 'bg-risk-low/10',
    ringClass: 'ring-risk-low/40',
  },
  moderate: {
    label: 'Moderate',
    color: '#F5B83D',
    textClass: 'text-risk-moderate',
    bgClass: 'bg-risk-moderate',
    softBgClass: 'bg-risk-moderate/10',
    ringClass: 'ring-risk-moderate/40',
  },
  high: {
    label: 'High',
    color: '#FF7A45',
    textClass: 'text-risk-high',
    bgClass: 'bg-risk-high',
    softBgClass: 'bg-risk-high/10',
    ringClass: 'ring-risk-high/40',
  },
  critical: {
    label: 'Critical',
    color: '#FF4D5E',
    textClass: 'text-risk-critical',
    bgClass: 'bg-risk-critical',
    softBgClass: 'bg-risk-critical/10',
    ringClass: 'ring-risk-critical/40',
  },
};
