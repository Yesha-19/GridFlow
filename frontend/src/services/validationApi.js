import api from './api';
import { USE_MOCK } from '../utils/constants';
import { generateMockValidationHistory } from '../utils/mockData';

/**
 * Backend contract — GET /api/validation/history
 *
 * Response body: Array<{
 *   id: string, eventName: string, eventType: string, eventDate: string,
 *   predictedRiskScore: number, actualRiskScore: number,
 *   predictedDelayMinutes: number, actualDelayMinutes: number,
 *   accuracyPercent: number, validated: boolean
 * }>
 *
 * Backend contract — POST /api/validation/{id}
 * Request body: { actualRiskScore: number, actualDelayMinutes: number }
 * Response body: the updated history row (same shape as above).
 */
export async function getValidationHistory() {
  if (USE_MOCK) {
    await simulateLatency();
    return generateMockValidationHistory();
  }

  try {
    const { data } = await api.get('/validation/history');
    return data;
  } catch (err) {
    console.warn('[validationApi] falling back to mock validation history:', err.message);
    return generateMockValidationHistory();
  }
}

export async function submitActualOutcome(eventId, actuals) {
  if (USE_MOCK) {
    await simulateLatency();
    return { id: eventId, ...actuals, validated: true };
  }

  try {
    const { data } = await api.post(`/validation/${eventId}`, actuals);
    return data;
  } catch (err) {
    console.warn('[validationApi] could not submit outcome, applying locally:', err.message);
    return { id: eventId, ...actuals, validated: true };
  }
}

function simulateLatency() {
  return new Promise((resolve) => setTimeout(resolve, 350 + Math.random() * 300));
}
