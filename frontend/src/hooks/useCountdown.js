import { useEffect, useState } from 'react';

/**
 * Ticks down to a target ISO timestamp. Used to give RiskCard a live
 * "T-minus" readout — the urgency is the whole point of forecasting
 * "before gridlock occurs" rather than after.
 */
export function useCountdown(targetIso) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!targetIso) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  if (!targetIso) {
    return { isPast: false, label: '—', days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const target = new Date(targetIso).getTime();
  const diff = target - now;
  const isPast = diff <= 0;
  const abs = Math.abs(diff);

  const days = Math.floor(abs / 86400000);
  const hours = Math.floor((abs % 86400000) / 3600000);
  const minutes = Math.floor((abs % 3600000) / 60000);
  const seconds = Math.floor((abs % 60000) / 1000);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  parts.push(`${String(hours).padStart(2, '0')}h`);
  parts.push(`${String(minutes).padStart(2, '0')}m`);
  if (days === 0) parts.push(`${String(seconds).padStart(2, '0')}s`);

  return {
    isPast,
    label: parts.join(' '),
    days,
    hours,
    minutes,
    seconds,
  };
}
