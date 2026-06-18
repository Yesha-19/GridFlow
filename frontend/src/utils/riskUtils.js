import { RISK_LEVELS } from './constants';

/**
 * Maps a 0-100 congestion score to a risk bucket + its design tokens.
 * Keeping the thresholds in one place means RiskCard, RouteMap legends,
 * and the Validation table all agree on what "High" means.
 */
export function getRiskBand(score) {
  if (score >= 80) return { key: 'critical', ...RISK_LEVELS.critical };
  if (score >= 60) return { key: 'high', ...RISK_LEVELS.high };
  if (score >= 35) return { key: 'moderate', ...RISK_LEVELS.moderate };
  return { key: 'low', ...RISK_LEVELS.low };
}

export function formatMinutes(totalMinutes) {
  if (totalMinutes == null) return '—';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  if (hours <= 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

export function formatNumber(value) {
  if (value == null) return '—';
  return new Intl.NumberFormat('en-IN').format(Math.round(value));
}

export function formatDateTime(isoString) {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export const WEATHER_MULTIPLIERS = {
  clear: 0.0,
  clouds: 0.05,
  drizzle: 0.10,
  rain: 0.20,
  thunderstorm: 0.30
};

export function getWeatherAdjustedRisk(baseScore, weatherCondition) {
  if (baseScore == null) return { score: 0, multiplier: 0 };
  if (!weatherCondition) return { score: baseScore, multiplier: 0 };
  const cond = weatherCondition.trim().toLowerCase();
  const multiplier = WEATHER_MULTIPLIERS[cond] ?? 0;
  const score = Math.round(Math.min(Math.max(baseScore * (1 + multiplier), 4), 98));
  return { score, multiplier };
}

