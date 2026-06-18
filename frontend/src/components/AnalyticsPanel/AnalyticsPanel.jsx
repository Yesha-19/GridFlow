import React, { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import { generateHourlyProfile } from '../../utils/mockData';
import { getRiskBand } from '../../utils/riskUtils';

// NOTE: the hourly breakdown is presentation-layer enrichment derived from the
// single risk score for now. Once the backend exposes a per-hour forecast on
// /api/predict, swap generateHourlyProfile() for that field directly.
export default function AnalyticsPanel({ event, prediction }) {
  const profile = useMemo(
    () => (event && prediction ? generateHourlyProfile(event, prediction) : []),
    [event, prediction]
  );

  if (!profile.length) return null;

  const startHour = new Date(event.startTime).getHours();
  const peakHour = profile.reduce((a, b) => (b.value > a.value ? b : a), profile[0]);

  return (
    <div className="rounded-xl border border-console-border bg-console-panel/80 p-5">
      <div className="flex items-center gap-2">
        <BarChart3 size={16} className="text-signal" />
        <h3 className="font-display text-sm font-semibold text-console-text">
          24-Hour Congestion Outlook
        </h3>
        <span className="ml-auto font-mono text-[11px] text-console-muted">
          Peak {String(peakHour.hour).padStart(2, '0')}:00
        </span>
      </div>

      <div className="mt-5 flex h-36 items-end gap-[3px] sm:gap-1">
        {profile.map(({ hour, value }) => {
          const band = getRiskBand(value);
          const isEventHour = hour === startHour;
          return (
            <div key={hour} className="group relative flex-1">
              <div
                className={`rounded-t-sm transition-[height] duration-700 ${band.bgClass} ${
                  isEventHour ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
                }`}
                style={{ height: `${Math.max(4, value)}%` }}
              />
              {isEventHour && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 font-mono text-[9px] text-signal">
                  start
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex justify-between font-mono text-[10px] text-console-muted">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>23:00</span>
      </div>

      <div className="mt-4 flex items-center gap-4 text-[11px] text-console-muted">
        <Legend color="bg-risk-low" label="Low" />
        <Legend color="bg-risk-moderate" label="Moderate" />
        <Legend color="bg-risk-high" label="High" />
        <Legend color="bg-risk-critical" label="Critical" />
      </div>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-sm ${color}`} />
      {label}
    </span>
  );
}
