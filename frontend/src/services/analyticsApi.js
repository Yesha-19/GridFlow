import api from './api';
import { USE_MOCK } from '../utils/constants';
import { generateCityAnalytics, generateAccuracyTrend } from '../utils/mockData';

export async function getAnalytics() {
  if (USE_MOCK) {
    // Simulate latency
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      analytics: generateCityAnalytics(),
      accuracyTrend: generateAccuracyTrend()
    };
  }

  try {
    const { data } = await api.get('/analytics');
    return {
      analytics: data,
      accuracyTrend: data.accuracyTrend
    };
  } catch (err) {
    console.warn('[analyticsApi] fallback to mock data:', err.message);
    return {
      analytics: generateCityAnalytics(),
      accuracyTrend: generateAccuracyTrend()
    };
  }
}
