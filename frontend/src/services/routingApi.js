import api from './api';
import { USE_MOCK } from '../utils/constants';
import { generateMockRouting } from '../utils/mockData';

/**
 * Backend contract — POST /api/routing
 *
 * Request body: same event payload as /api/predict, plus the resulting
 * `prediction` object so the routing engine can scale closures to risk.
 *
 * Response body:
 * {
 *   affectedRoutes: Array<{
 *     id: string, name: string,
 *     congestionLevel: 'low'|'moderate'|'high'|'critical',
 *     coordinates: [number, number][]   // [lat, lng] polyline points
 *   }>,
 *   diversionRoutes: Array<{
 *     id: string, name: string, recommendedFor: string,
 *     coordinates: [number, number][]
 *   }>,
 *   closureZone: { center: [number, number], radiusMeters: number }
 * }
 */
export async function getRoutingPlan(eventPayload, prediction) {
  if (USE_MOCK) {
    await simulateLatency();
    return generateMockRouting(eventPayload, prediction);
  }

  try {
    const { data } = await api.post('/routing', { event: eventPayload, prediction });
    return data;
  } catch (err) {
    console.warn('[routingApi] falling back to mock routing plan:', err.message);
    return generateMockRouting(eventPayload, prediction);
  }
}

function simulateLatency() {
  return new Promise((resolve) => setTimeout(resolve, 400 + Math.random() * 350));
}
