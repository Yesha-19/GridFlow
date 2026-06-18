import api from './api';
import { USE_MOCK } from '../utils/constants';
import { generateMockForecast } from '../utils/mockData';

/**
 * Backend contract — POST /api/predict
 *
 * Request body:
 * {
 *   eventName: string,
 *   eventType: string,        // one of EVENT_TYPES[].value
 *   venueName: string,
 *   latitude: number,
 *   longitude: number,
 *   expectedAttendance: number,
 *   startTime: string,        // ISO 8601
 *   durationHours: number
 * }
 *
 * Response body:
 * {
 *   prediction: {
 *     congestionRiskScore: number,   // 0-100
 *     estimatedDelayMinutes: number,
 *     affectedRadiusKm: number,
 *     confidenceScore: number,       // 0-100, model confidence
 *     peakOffsetMinutes: number      // minutes after startTime that congestion peaks
 *   },
 *   resources: {
 *     policePersonnel: number,
 *     trafficWardens: number,
 *     barricades: number,
 *     cctvUnits: number,
 *     ambulanceStandby: number,
 *     deploymentZones: Array<{
 *       id: string, name: string, lat: number, lng: number,
 *       personnelCount: number, priority: 'low'|'moderate'|'high'|'critical'
 *     }>
 *   }
 * }
 */
export async function getForecast(eventPayload) {
  if (USE_MOCK) {
    await simulateLatency();
    return generateMockForecast(eventPayload);
  }

  try {
    const { data } = await api.post('/predict', eventPayload);
    return data;
  } catch (err) {
    console.warn('[predictionApi] falling back to mock forecast:', err.message);
    return generateMockForecast(eventPayload);
  }
}

function simulateLatency() {
  return new Promise((resolve) => setTimeout(resolve, 650 + Math.random() * 500));
}
